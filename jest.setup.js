/* eslint-env jest */
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  const chain = () => new Proxy(function () {}, {get: () => chain(), apply: () => chain()});
  return {GestureHandlerRootView: View, GestureDetector: View, Gesture: chain()};
});
jest.mock('react-native-haptic-feedback', () => ({__esModule: true, default: {trigger: jest.fn()}}));
jest.mock('react-native-sound', () => {
  const S = function () {
    return {play: cb => cb && cb(true), release: jest.fn(), setVolume: jest.fn()};
  };
  S.setCategory = jest.fn();
  return {__esModule: true, default: S};
});
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(async () => ({
      type: 'wifi',
      isConnected: true,
      details: {ipAddress: '192.168.1.20', subnet: '255.255.255.0'},
    })),
    addEventListener: jest.fn(() => () => {}),
  },
}));
jest.mock('react-native-tcp-socket', () => ({
  __esModule: true,
  default: {createServer: jest.fn(), createConnection: jest.fn()},
}));
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('@react-native-clipboard/clipboard', () =>
  require('@react-native-clipboard/clipboard/jest/clipboard-mock'),
);
