import babel from 'rollup-plugin-babel';
import { sizeSnapshot } from 'rollup-plugin-size-snapshot';
import pkg from './package.json';

const EXTERNAL = ['react', '@babel/runtime', ...Object.keys(pkg.dependencies)];

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
      plugins: [
        [
          '@babel/plugin-transform-runtime',
          { polyfill: false, useBuiltIns: true },
        ],
      ],
    }),
    sizeSnapshot(),
  ],
  external: mod => EXTERNAL.some(ext => mod.startsWith(ext)),
};
