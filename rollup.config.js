import babel from 'rollup-plugin-babel';
import { sizeSnapshot } from 'rollup-plugin-size-snapshot';
import pkg from './package.json';

const EXTERNAL = ['react', ...Object.keys(pkg.dependencies)];

export default {
  input: 'src/index.js',
  output: {
    file: pkg.main,
    format: 'cjs',
  },
  plugins: [
    babel({
      exclude: '**/node_modules/**',
      runtimeHelpers: true,
      plugins: ['@babel/transform-runtime'],
    }),
    sizeSnapshot(),
  ],
  external: mod => EXTERNAL.some(ext => mod.startsWith(ext)),
};
