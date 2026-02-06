// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Support for path aliases (@/...)
config.resolver.extraNodeModules = {
  '@': path.resolve(__dirname, 'src'),
};

module.exports = config;
