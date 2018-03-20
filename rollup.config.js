import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';
import pkg from './package.json';

export default {
  input: 'src/react-request.js',
  output: {
    file: pkg.main,
    format: 'cjs'
  },
  plugins: [
    babel({ exclude: 'node_modules/**' }),
    uglify()
  ],
  external: ['react']
}
