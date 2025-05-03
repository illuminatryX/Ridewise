// https://docs.expo.dev/guides/using-eslint/
const { FlatCompat } = require('@eslint/eslintrc');
const expoConfig = require("eslint-config-expo/flat");

const compat = new FlatCompat();

module.exports = [
  expoConfig,
  {
    ignores: ["dist/*"],
  }
];
