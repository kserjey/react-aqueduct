import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';
import pkg from './package.json';

const PROD = 'production';

export default {
  input: 'src/index.js',
  output: {
    file: pkg.main,
    format: 'cjs'
  },
  plugins: [
    babel({ exclude: 'node_modules/**' }),
    process.env.NODE_ENV === PROD || uglify()
  ],
  external: ['react']
};
