module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-tcp-socket|@react-navigation|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-svg|react-native-haptic-feedback|react-native-sound|@noble)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/', '/fixtures/'],
  collectCoverageFrom: ['src/domain/**/*.ts', 'src/net/**/*.ts'],
};
