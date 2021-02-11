import typescript from '@wessberg/rollup-plugin-ts';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/shoemaker.ts',
  output: {
    file: 'dist/shoemaker.js',
    format: 'esm'
  },
  plugins: [nodeResolve(), typescript()]
};
