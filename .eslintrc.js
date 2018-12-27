module.exports = {
  env: {
    es6: true,
  },
  extends: 'eslint:recommended',
  rules: {
    indent: ['error', 2],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'no-undef': ['off'],
    'comma-dangle': ['error', 'only-multiline'],
    'no-console': ['off'],
  },
};
