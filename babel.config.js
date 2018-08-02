module.exports = {
  presets: [
    [
      '@babel/env',
      { modules: process.env.NODE_ENV === 'test' ? 'commonjs' : false },
    ],
    '@babel/react',
  ],
  plugins: ['@babel/proposal-class-properties'],
};
