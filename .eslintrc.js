module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['node_modules/', 'android/', 'ios/', 'coverage/', '__tests__/fixtures/'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    'react-native/no-inline-styles': 'off',
  },
  overrides: [
    {
      // El dominio es TypeScript puro: no puede importar nada de React Native.
      files: ['src/domain/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['react-native', 'react-native-*', '../ui/*', '../net/*', '../state/*'],
                message: 'src/domain debe ser TypeScript puro.',
              },
            ],
          },
        ],
      },
    },
    {files: ['__tests__/**'], rules: {'@typescript-eslint/no-explicit-any': 'off'}},
  ],
};
