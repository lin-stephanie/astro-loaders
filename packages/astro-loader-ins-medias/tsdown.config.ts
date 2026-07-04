import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/live.ts'],

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
    neverBundle: ['astro:env/server'],
    onlyBundle: [],
  },

  outExtensions: () => ({
    js: '.js',
    dts: '.d.ts',
  }),
})
