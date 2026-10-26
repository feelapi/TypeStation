const iTwinPlugin = require("@itwin/eslint-plugin");

const customLanguageOptions = {
  sourceType: "module",
  parser: require("@typescript-eslint/parser"),
  parserOptions: {
    project: [
      "./tsconfig.json",
      "./tsconfig.backend.json",
      "./tsconfig.buildScripts.json",
      "./vite.config.mts"
    ],
    ecmaVersion: "latest",
    ecmaFeatures: {
      jsx: true,
      modules: true
    },
  },
};

module.exports = [
  {
    files: ["**/*.ts"],
    ...iTwinPlugin.configs.iTwinjsRecommendedConfig,
    languageOptions: customLanguageOptions
  },
  {
    // Same overrides as the official iTwin.js display-test-app (common/config/eslint/eslint.config.base.js).
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unsafe-enum-comparison": "off"
    }
  }
];