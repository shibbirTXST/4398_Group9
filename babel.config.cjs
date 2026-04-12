/** Babel config used by Jest server project (ESM app + CJS tests). */
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: '20' },
      },
    ],
  ],
};
