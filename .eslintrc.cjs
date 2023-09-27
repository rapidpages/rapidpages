/** @type {import("eslint").Linter.Config} */
const config = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  plugins: ["@typescript-eslint"],
  extends: ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  rules: {
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      {
        prefer: "type-imports",
        fixStyle: "inline-type-imports",
      },
    ],
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": ["error", { ignoreRestArgs: true }],
    "no-console": ["error", { allow: ["warn", "error"] }],
    // Not all images have to be optimized. Some are already optimized.
    "@next/next/no-img-element": "off",
    /*
     * I don't have a strong opinoion about this, but I think it's better to
     * have a consistent way to export modules.
     */
    "import/no-default-export": "error",
    /*
     * I don't have a strong opinoion about this, but I think it's better to
     * have a consistent way to name functions.
     */
    "react/function-component-definition": [
      2,
      { namedComponents: "arrow-function" },
    ],
  },
  overrides: [
    /**
     * We want to have default exports for Next.js pages.
     */
    {
      files: [
        "src/pages/**/*.ts",
        "src/pages/**/*.tsx",
        "next.config.mjs",
        "tailwind.config.ts",
      ],
      rules: {
        "import/no-default-export": "off",
        "import/prefer-default-export": "error",
      },
    },
  ],
  ignorePatterns: ["public", "node_modules"],
};

module.exports = config;
