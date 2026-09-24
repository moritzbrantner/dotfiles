export default [
  {
    ignores: ["**/dist/**", "**/build/**", "**/coverage/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    rules: {
      curly: "error",
      "no-case-declarations": "error",
      "no-cond-assign": ["error", "always"],
      "no-fallthrough": ["error", { allowEmptyCase: true }],
      "no-multi-assign": "error",
      "no-nested-ternary": "error",
      "no-sequences": ["error", { allowInParentheses: false }],
    },
  },
];
