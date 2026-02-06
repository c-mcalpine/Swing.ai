module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@/api': './src/api',
            '@/components': './src/components',
            '@/config': './src/config',
            '@/features': './src/features',
            '@/hooks': './src/hooks',
            '@/lib': './src/lib',
            '@/screens': './src/screens',
            '@/styles': './src/styles',
            '@/utils': './src/utils',
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        },
      ],
    ],
  };
};
