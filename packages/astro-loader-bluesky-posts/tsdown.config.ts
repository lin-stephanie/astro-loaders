import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],

  format: 'esm',
  clean: true,
  treeshake: true,
  sourcemap: false,
  dts: {
    sourcemap: false,
    compilerOptions: {
      declarationMap: false,
    },
  },

  deps: {
    onlyBundle: [],
  },

  outExtensions: () => ({
    js: '.js',
    dts: '.d.ts',
  }),
})
