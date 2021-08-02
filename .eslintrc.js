module.exports = {
  root: true,
  env: {
    browser: false,
    node: true,
    es2021: true,
    'jest/globals': true,
  },
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['prettier', 'jest'],
  rules: {
    'prettier/prettier': 'error',
    'sort-imports': 'error',
    'no-empty': 'off',
    curly: 'error',
    semi: 'error',
  },
};
