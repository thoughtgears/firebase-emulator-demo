import js from '@eslint/js'
import google from 'eslint-config-google'
import globals from 'globals'

// ESLint 9 defaults to flat config and no longer reads .eslintrc.js. This
// replaces that file, keeping the same rule set: eslint:recommended +
// eslint-config-google (spread directly -- it only ever exported a `rules`
// object, so it composes into flat config without a compat shim) plus the
// original project-specific overrides.
export default [
  {
    ignores: ['node_modules/**', 'lib/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...google.rules,
      'no-restricted-globals': ['error', 'name', 'length'],
      'prefer-arrow-callback': 'error',
      quotes: ['error', 'double', { allowTemplateLiterals: true }],
      'max-len': ['error', { code: 120 }],
      'object-curly-spacing': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'require-jsdoc': 'off',
      'valid-jsdoc': 'off',
    },
  },
  {
    files: ['**/*.spec.js'],
    languageOptions: {
      globals: {
        ...globals.mocha,
      },
    },
  },
]
