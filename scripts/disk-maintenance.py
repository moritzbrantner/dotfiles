"""Personal Linux build-cache retention and disposable verification lifecycle."""

import argparse
from contextlib import ExitStack
import fcntl
import json
import math
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import tempfile
import time

GIB = 1024**3
DEFAULTS = dict(schemaVersion=1, roots=[], maxAgeDays=7, maxTargetBytes=10 * GIB,
                quietHours=24, minFreeBytes=50 * GIB, restoreFreeBytes=75 * GIB,
                packageCaches=True, cacheMaxBytes=GIB)
UNIT = "coding-agent-disk-maintenance"
PRUNE_DIRS = {".git", "node_modules", ".venv", "venv", "__pycache__"}


def home_path():
    home = Path(os.environ["HOME"])
    if not home.is_absolute() or not home.is_dir() or home.is_symlink():
        raise ValueError("HOME must be an existing absolute directory, not a symlink")
    return home


def safe_path(path, home):
    """Reject broad deletion boundaries and symlinked ancestors before resolving."""
    path = Path(os.path.abspath(os.path.expanduser(str(path))))
    if path == home or not path.is_relative_to(home):
        raise ValueError(f"Path must be a strict descendant of HOME: {path}")
    for ancestor in [path, *path.parents]:
        if ancestor == home:
            break
        if ancestor.is_symlink():
            raise ValueError(f"Symlink boundary: {ancestor}")
    return path


def config_path(home):
    # Match the installed user unit; this personal service has one fixed config.
    return safe_path(home / ".config/coding-agent/disk-maintenance.json", home)


def read_config(path, home):
    config = {**DEFAULTS, **json.loads(Path(path).read_text())}
    if config["schemaVersion"] != 1 or not isinstance(config["roots"], list):
        raise ValueError("Unsupported disk maintenance configuration")
    if not all(isinstance(root, str) for root in config["roots"]):
        raise ValueError("roots must contain path strings")
    for key in ("maxAgeDays", "maxTargetBytes", "quietHours", "minFreeBytes",
                "restoreFreeBytes", "cacheMaxBytes"):
        value = config[key]
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0:
            raise ValueError(f"{key} must be a finite nonnegative number")
    if not isinstance(config["packageCaches"], bool):
        raise ValueError("packageCaches must be boolean")
    if config["restoreFreeBytes"] < config["minFreeBytes"]:
        raise ValueError("restoreFreeBytes must be at least minFreeBytes")
    config["roots"] = sorted({str(safe_path(root, home)) for root in config["roots"]})
    return config


def command(args, **kwargs):
    return subprocess.run(args, capture_output=True, text=True, timeout=120, **kwargs)


def processes():
    """Inspection failure for a live same-user process prevents destructive work."""
    result = []
    for entry in Path("/proc").iterdir():
        if not entry.name.isdigit() or int(entry.name) == os.getpid():
            continue
        try:
            status = (entry / "status").read_text()
            uid_line = next(line for line in status.splitlines() if line.startswith("Uid:"))
            if os.getuid() not in [int(value) for value in uid_line.split()[1:]]:
                continue
            argv = (entry / "cmdline").read_bytes().decode(errors="replace").split("\0")
            if not any(argv):  # Exited/zombie process: no filesystem use.
                continue
            refs, maps, opaque = [], "", False
            try:
                refs = [os.readlink(entry / "cwd"), os.readlink(entry / "exe")]
                for fd in (entry / "fd").iterdir():
                    try:
                        refs.append(os.readlink(fd))
                    except FileNotFoundError:
                        pass  # File descriptor closed during inspection.
                maps = (entry / "maps").read_text()
            except PermissionError:
                # Linux deliberately hides these for service managers, credential
                # agents and sandboxed browser children. Keep their visible argv;
                # unknown opaque processes still prohibit deletion globally.
                opaque = True
            result.append(dict(pid=int(entry.name), argv=argv, refs=refs, maps=maps,
                               opaque=opaque, comm=(entry / "comm").read_text().strip()))
        except (FileNotFoundError, ProcessLookupError):
            continue  # Process exited during inspection.
    return result


def in_use(scope, snapshot):
    path = str(scope)
    for proc in snapshot:
        if any(ref == path or ref.startswith(path + "/") for ref in proc["refs"]):
            return proc["pid"]
        if any(path + "/" in arg or arg == path for arg in proc["argv"]) or path + "/" in proc["maps"]:
            return proc["pid"]
        if proc["opaque"] and not infrastructure_process(proc):
            raise PermissionError(f"Unavailable process safety evidence for PID {proc['pid']}")
    return None


def infrastructure_process(proc):
    # Chromium overwrites argv with one space-separated process title. Confirm
    # both the kernel comm and a root-owned installed executable, not just flags.
    words = " ".join(proc["argv"]).split()
    if not words:
        return False
    executable = Path(words[0])
    name = executable.name
    if name == "(sd-pam)" and proc["comm"] == "(sd-pam)":
        return True
    if not executable.is_absolute() or proc["comm"] != name[:15]:
        return False
    try:
        if executable.stat().st_uid != 0:
            return False
    except FileNotFoundError:
        return False
    if name == "systemd" and "--user" in words:
        return True
    if name == "ssh-agent":
        return True
    browser = name in {"brave", "chrome", "chromium", "chromium-browser", "chrome-sandbox"}
    roles = {"--type=renderer", "--type=zygote", "--type=utility", "--type=gpu-process"}
    return browser and bool(roles.intersection(words))


def inventory(path):
    newest = path.stat().st_mtime
    size = 0
    seen = set()
    locks = []
    for parent, dirs, files in os.walk(path, followlinks=False, onerror=raise_error):
        for name in [*dirs, *files]:
            item = Path(parent) / name
            stat = item.lstat()
            if item.is_symlink():
                raise ValueError(f"Symlink inside disposable directory: {item}")
            if name == ".git":
                raise ValueError(f"Git source state inside disposable directory: {item}")
            newest = max(newest, stat.st_mtime)
            identity = (stat.st_dev, stat.st_ino)
            if identity not in seen:
                size += stat.st_blocks * 512
                seen.add(identity)
            if name == ".cargo-lock":
                locks.append(item)
    return newest, size, locks


def raise_error(error):
    raise error


def owned_run(path):
    home = home_path()
    caches = {home / ".cache/coding-agent-builds",
              Path(os.environ.get("XDG_CACHE_HOME", home / ".cache")) / "coding-agent-builds"}
    if path.parent not in caches:
        return None
    marker = path / ".disk-maintenance-run.json"
    if not path.name.startswith("run-") or not marker.is_file():
        return None
    owner = json.loads(marker.read_text())
    if owner.get("schemaVersion") == 1 and owner.get("owner") == UNIT:
        return owner
    return None


def process_start(pid):
    try:
        return Path(f"/proc/{pid}/stat").read_text().rsplit(")", 1)[1].split()[19]
    except FileNotFoundError:
        return None


def discover(roots):
    seen = set()
    for root in roots:
        if not Path(root).exists():
            continue
        for parent, dirs, _ in os.walk(root, followlinks=False, onerror=raise_error):
            path = Path(parent)
            dirs[:] = sorted(name for name in dirs if name not in PRUNE_DIRS and not (path / name).is_symlink())
            cargo_name = path.name in {"target", ".cargo-target"} or path.name.endswith("-target")
            cargo_marker = (path / ".rustc_info.json").is_file() or (path / "debug/.cargo-lock").is_file()
            if (cargo_name and cargo_marker) or owned_run(path):
                dirs.clear()
                if path not in seen:
                    seen.add(path)
                    yield path


def git_guard(path):
    probe = command(["git", "-C", str(path.parent), "rev-parse", "--show-toplevel"])
    if probe.returncode:
        if "not a git repository" in probe.stderr:
            return path.parent, None
        raise RuntimeError(probe.stderr.strip())
    root = Path(probe.stdout.strip())
    tracked = command(["git", "-C", str(root), "ls-files", "--", str(path)])
    if tracked.returncode:
        raise RuntimeError(tracked.stderr.strip())
    return root, "tracked files" if tracked.stdout else None


def remove_output(path, identity, home):
    """Anchor deletion to the opened physical parent, not replaceable ancestors."""
    safe_path(path, home)
    fd = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        if os.readlink(f"/proc/self/fd/{fd}") != str(path.parent):
            raise ValueError("Parent directory changed during inspection")
        current = os.stat(path.name, dir_fd=fd, follow_symlinks=False)
        if (current.st_dev, current.st_ino) != (identity.st_dev, identity.st_ino):
            raise ValueError("Directory changed during inspection")
        shutil.rmtree(path.name, dir_fd=fd)
    finally:
        os.close(fd)


def maintenance(config, apply, home):
    actions, errors = [], []
    candidates = []
    # Finish discovery before deletion, so overlapping roots and partial scans are safe.
    for path in discover(config["roots"]):
        try:
            safe_path(path, home)
            newest, size, locks = inventory(path)
            candidates.append((newest, str(path), size, locks))
        except (OSError, ValueError) as error:
            actions.append(dict(path=str(path), action="skip", reason=str(error)))
    pressured_devices = set()
    for newest, name, size, locks in sorted(candidates):
        path = Path(name)
        free = shutil.disk_usage(path).free
        device = path.stat().st_dev
        if free < config["minFreeBytes"]:
            pressured_devices.add(device)
        if free >= config["restoreFreeBytes"]:
            pressured_devices.discard(device)
        age = time.time() - newest
        reason = None
        if age >= config["maxAgeDays"] * 86400:
            reason = "expired output"
        elif age >= config["quietHours"] * 3600:
            if size > config["maxTargetBytes"]:
                reason = "oversized quiet output"
            elif device in pressured_devices:
                reason = "free-space reserve"
        action = dict(path=name, action="skip", reason=reason or "recent output", bytes=size)
        try:
            scope, protected = git_guard(path)
            owner = owned_run(path)
            if owner and process_start(owner["pid"]) is not None and (
                    "startTime" not in owner or process_start(owner["pid"]) == owner["startTime"]):
                protected = "live verification owner"
            busy = in_use(scope, processes())
            if protected or busy:
                action["reason"] = protected or f"active process {busy}"
            elif reason:
                with ExitStack() as stack:
                    for lock in locks:
                        fd = stack.enter_context(open(lock, "rb"))
                        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
                    identity = path.stat()
                    # Recheck activity, boundaries and freshness after obtaining Cargo locks.
                    safe_path(path, home)
                    current_newest, _, _ = inventory(path)
                    _, protected = git_guard(path)
                    if protected or current_newest != newest or in_use(scope, processes()):
                        action["reason"] = "changed or became active during inspection"
                    elif apply:
                        remove_output(path, identity, home)
                        action["action"] = "remove"
                    else:
                        action["action"] = "remove"
        except (OSError, ValueError, RuntimeError, subprocess.TimeoutExpired) as error:
            action["reason"] = f"inspection refused: {error}"
            errors.append(dict(path=name, error=str(error)))
        actions.append(action)
    if config["packageCaches"]:
        package_maintenance(config, apply, home, actions, errors)
    return dict(schemaVersion=1, applied=apply, actions=actions, errors=errors,
                freeBytes=shutil.disk_usage(home).free)


def package_maintenance(config, apply, home, actions, errors):
    cache = Path(os.environ.get("XDG_CACHE_HOME", home / ".cache"))
    packages = [("uv", cache / "uv", ["uv", "--cache-dir", str(cache / "uv"), "cache", "prune"]),
                ("pip", cache / "pip", ["python3", "-m", "pip", "--cache-dir", str(cache / "pip"), "cache", "purge"]),
                ("npm", home / ".npm/_cacache", ["npm", "--cache", str(home / ".npm"), "--offline", "cache", "clean", "--force"])]
    for tool, path, argv in packages:
        action = dict(path=str(path), action="skip", reason="cache below threshold")
        try:
            safe_path(path, home)
            if not path.exists():
                continue
            if tool != "uv" and inventory(path)[1] <= config["cacheMaxBytes"]:
                continue
            snapshot = processes()
            running = any(any(Path(arg).name in {tool, tool + "3", tool + ".js", tool + "-cli.js"}
                              for arg in proc["argv"]) for proc in snapshot)
            if running or in_use(path, snapshot):
                action["reason"] = "active package manager/cache"
            elif not apply:
                action.update(action="remove", reason="supported package-cache maintenance")
            elif shutil.which(argv[0]):
                result = command(argv, env={**os.environ, "UV_LOCK_TIMEOUT": "1"})
                action.update(reason="supported package-cache maintenance", command=argv,
                              output=(result.stdout + result.stderr).strip(), exitCode=result.returncode)
                if result.returncode:
                    errors.append(dict(path=str(path), error=action["output"]))
                else:
                    action["action"] = "remove"
            else:
                action["reason"] = "package manager unavailable"
        except (OSError, ValueError, subprocess.TimeoutExpired) as error:
            action["reason"] = str(error)
            errors.append(dict(path=str(path), error=str(error)))
        actions.append(action)


def terminate_group(child):
    try:
        os.killpg(child.pid, signal.SIGTERM)
    except ProcessLookupError:
        return
    try:
        child.wait(timeout=5)
    except subprocess.TimeoutExpired:
        pass
    try:
        os.killpg(child.pid, signal.SIGKILL)
    except ProcessLookupError:
        pass
    child.wait()


def run_disposable(config, argv, home):
    if argv and argv[0] == "--":
        argv = argv[1:]
    if not argv:
        raise ValueError("run requires a command after --")
    cache = safe_path(Path(os.environ.get("XDG_CACHE_HOME", home / ".cache")) / "coding-agent-builds", home)
    cache.mkdir(parents=True, exist_ok=True)
    if shutil.disk_usage(cache).free < config["minFreeBytes"]:
        raise RuntimeError("Insufficient free disk space for verification")
    run = Path(tempfile.mkdtemp(prefix="run-", dir=cache))
    identity = run.stat()
    child, received = None, []
    old_handlers = {}
    def cancelled(signum, _frame):
        received.append(signum)
    try:
        for signum in (signal.SIGTERM, signal.SIGINT):
            old_handlers[signum] = signal.signal(signum, cancelled)
        (run / ".disk-maintenance-run.json").write_text(json.dumps(
            dict(schemaVersion=1, owner=UNIT, pid=os.getpid(), startTime=process_start(os.getpid()))))
        target = run / "target"
        target.mkdir()
        child = subprocess.Popen(argv, start_new_session=True,
                                 env={**os.environ, "CARGO_TARGET_DIR": str(target), "CARGO_INCREMENTAL": "0"})
        while child.poll() is None:
            if received:
                terminate_group(child)
                return 128 + received[0]
            if shutil.disk_usage(cache).free < config["minFreeBytes"]:
                terminate_group(child)
                raise RuntimeError("Verification stopped to preserve free disk space")
            time.sleep(0.1)
        return child.returncode if child.returncode >= 0 else 128 - child.returncode
    finally:
        if child is not None:
            terminate_group(child)  # Also terminate surviving children in our owned group.
        for signum, handler in old_handlers.items():
            signal.signal(signum, handler)
        if not in_use(run, processes()):
            remove_output(run, identity, home)
        else:
            print(f"Preserving output still used by a detached process: {run}", file=sys.stderr)


def install(workspaces, apply, home):
    source = Path(__file__).resolve()
    repository = source.parent.parent
    path = config_path(home)
    roots = [*workspaces, str(home / "worktrees"), str(home / ".cache/coding-tooling"),
             str(home / ".cache/physics-queue"), str(home / ".local/share/coding-agent"),
             str(home / ".cache/coding-agent-builds"),
             str(Path(os.environ.get("XDG_CACHE_HOME", home / ".cache")) / "coding-agent-builds")]
    config = read_config(path, home) if path.exists() else dict(DEFAULTS)
    config["roots"] = sorted({*config["roots"], *(str(safe_path(root, home)) for root in roots)})
    links = [(source, home / ".local/share/coding-agent/disk-maintenance.py")]
    for suffix in ("service", "timer"):
        relative = f".config/systemd/user/{UNIT}.{suffix}"
        links.append((repository / relative, home / relative))
    for origin, target in links:
        safe_path(target.parent, home)
        if target.is_symlink():
            if target.resolve() != origin.resolve():
                raise ValueError(f"Refusing to replace foreign link: {target}")
        elif target.exists():
            raise ValueError(f"Refusing to replace user-owned file: {target}")
    if path.is_symlink():
        raise ValueError(f"Refusing symlinked configuration: {path}")
    encoded = json.dumps(config, indent=2) + "\n"
    if apply:
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists() or path.read_text() != encoded:
            with tempfile.NamedTemporaryFile(mode="w", dir=path.parent, delete=False) as output:
                temporary = Path(output.name)
                output.write(encoded)
            try:
                temporary.replace(path)
            finally:
                temporary.unlink(missing_ok=True)
        for origin, target in links:
            if not target.is_symlink():
                target.parent.mkdir(parents=True, exist_ok=True)
                target.symlink_to(os.path.relpath(origin, target.parent))
        for args in (["systemctl", "--user", "daemon-reload"],
                     ["systemctl", "--user", "enable", "--now", UNIT + ".timer"]):
            result = command(args)
            if result.returncode:
                raise RuntimeError(result.stderr.strip())
    return dict(schemaVersion=1, applied=apply, config=str(path), roots=config["roots"], timer=UNIT + ".timer")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="operation", required=True)
    for name in ("maintain", "run"):
        p = sub.add_parser(name)
        p.add_argument("--config")
        if name == "maintain":
            p.add_argument("--apply", action="store_true")
        else:
            p.add_argument("command", nargs=argparse.REMAINDER)
    p = sub.add_parser("install")
    p.add_argument("--workspace", action="append", required=True)
    p.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    if sys.platform != "linux" or sys.version_info < (3, 11):
        raise RuntimeError("Disk maintenance requires Python 3.11+ and Linux /proc")
    home = home_path()
    if args.operation == "install":
        print(json.dumps(install(args.workspace, args.apply, home)))
        return 0
    config = read_config(args.config or config_path(home), home)
    if args.operation == "run":
        return run_disposable(config, args.command, home)
    with ExitStack() as stack:
        if args.apply:
            # Timer and interactive callers may inherit different XDG settings;
            # one fixed per-user lock serializes their overlapping cleanup roots.
            lock = safe_path(home / ".cache/coding-agent-builds/.maintenance.lock", home)
            lock.parent.mkdir(parents=True, exist_ok=True)
            fd = os.open(lock, os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
            stack.callback(os.close, fd)
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        report = maintenance(config, args.apply, home)
    print(json.dumps(report))
    return 1 if report["errors"] else 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, RuntimeError, KeyError, subprocess.TimeoutExpired) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
