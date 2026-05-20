/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  ...require('./base'),
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'error',
    },
  },
];
