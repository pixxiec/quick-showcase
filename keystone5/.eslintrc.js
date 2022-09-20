module.exports = {
  extends: ['eslint:recommended', 'prettier', 'google'],
  plugins: ['prettier', 'jest', 'graphql'],
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    ecmaVersion: 2021,
  },
  env: {
    es2020: true,
    node: true,
    'jest/globals': true,
  },
  rules: {
    'prettier/prettier': ['error'],
    'quote-props': ['error', 'as-needed'],
    'graphql/template-strings': [
      'error',
      {
        tagName: 'gql',
        schemaJson: require('./schema.json'),
      },
    ],
    indent: ['error', 2, {SwitchCase: 1}],
    'max-len': [
      'error',
      {
        code: 120,
        tabWidth: 2,
        ignoreUrls: true,
      },
    ],
    'operator-linebreak': 'off',
    'require-jsdoc': 'off',
  },
};
