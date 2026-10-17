# Capability owners

Shared capabilities and the repository whose Decision Atlas owns their decisions. Consumers record only a one-line Decision linking the owner's entry. Check this list before deciding anything that another repository may already own; add a row when a new shared capability appears. This is a map, not an authority: the linked Atlas wins.

| Capability | Owner | Known consumers | Notes |
| --- | --- | --- | --- |
| 3D models, characters, outfits, animation clips, asset catalog and promotion | asset-tooling | arpg, mmorpg, zoo | Quaternius Universal Base Characters is the humanoid source (2026-10-17). |
| Image generation operations (ComfyUI/Diffusers providers, model profiles) | asset-tooling | — | `image.generate@1`. |
| 3D runtime crates (`three-d-*`) | 3d-lab | video-to-3d, zoo, asset-tooling | Bump all crates together. |
| Game physics engine | physics-engine | — | arpg uses Rapier until physics-engine is complete; lessons go back as physics-engine issues. |
| Input device semantics (gestures, gamepad runtime, bindings) | input-bindings | arpg | |
| Peer multiplayer session setup | multiplayer-setup-service | arpg | |
| Graph editing primitives | graph-editor | workflow-editor | Workflow graph validation policy is owned by workflow-editor. |
| Decision Atlas tooling (`daq`, anchors, previews), performance history, fleet reports | coding-tooling | all Atlas repositories | |
| Agent conventions, Renovate preset, owner engineering principles | coding-agent-conventions | all repositories | |
| Agent skills and owner-question formats | dotfiles | all repositories | |
