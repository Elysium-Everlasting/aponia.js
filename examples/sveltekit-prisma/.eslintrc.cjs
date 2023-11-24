/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    extraFileExtensions: ['.svelte'],
  },
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:svelte/recommended', 'prettier'],
  plugins: ['@typescript-eslint'],
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: { parser: '@typescript-eslint/parser' },
    },
  ],
  ignorePatterns: ['*.config.*', '*rc.*', '*.json'],
}
