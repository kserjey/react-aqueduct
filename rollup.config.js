import babel from 'rollup-plugin-babel';
import filesize from 'rollup-plugin-filesize';
import pkg from './package.json';

export default {
  input: 'src/index.js',
  output: {
    file: pkg.main,
    format: 'cjs'
  },
  plugins: [
    babel({
      exclude: 'node_modules/**',
      plugins: ['external-helpers']
    }),
    filesize()
  ],
  external: ['react', ...Object.keys(pkg.dependencies)]
};
