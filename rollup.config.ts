import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

const config = [
  // ESM — preserves original directory structure
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist',
      format: 'es',
      preserveModules: true,
      preserveModulesRoot: 'src',
      entryFileNames: '[name].js',
    },
    plugins: [typescript({ tsconfig: './tsconfig.json' })],
  },
  // CJS — same structure, .cjs extension
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist',
      format: 'cjs',
      preserveModules: true,
      preserveModulesRoot: 'src',
      entryFileNames: '[name].cjs',
      chunkFileNames: '[name]-[hash].cjs',
      exports: 'named',
    },
    plugins: [typescript({ tsconfig: './tsconfig.json' })],
  },
  // UMD — single bundle for CDN / script tag
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'LiteLog',
      exports: 'named',
    },
    plugins: [typescript({ tsconfig: './tsconfig.json' })],
  },
  // Type declarations
  {
    input: 'src/index.ts',
    output: { file: 'dist/index.d.ts', format: 'es' },
    plugins: [dts()],
  },
];

export default config;
