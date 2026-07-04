# astro-loader-ins-medias

## 2.0.1

### Patch Changes

- Expand the Astro peer range from `>=4.14.0 <7.0.0` to `>=4.14.0 <8.0.0` so Astro 7 projects can install the loader without peer dependency conflicts. ([`70b8058`](https://github.com/lin-stephanie/astro-loaders/commit/70b80585ffbbe5583ece7f815d9e9f012d8aea17))

  Migrate the package build from inline `tsup` scripts and `postbuild` `.graphql` copying to `tsdown --watch` / `tsdown` with `tsdown.config.ts`, keep `astro:env/server` external through `deps.neverBundle`, disable declaration/source maps, and mark the package as side-effect free for better tree-shaking.

## 2.0.0

### Major Changes

- Update the default Instagram API version from `v23.0` to `v25.0` ([`c0089f2`](https://github.com/lin-stephanie/astro-loaders/commit/c0089f260d295aa303b223c9432d9f002956858e))

- Move live loaders to the `/live` subpath. `liveInsMediasLoader` is no longer exported from the package root, so import it from the `/live` subpath instead: ([`c0089f2`](https://github.com/lin-stephanie/astro-loaders/commit/c0089f260d295aa303b223c9432d9f002956858e))

  ```ts
  import { liveInsMediasLoader } from "astro-loader-ins-medias/live";
  ```

  This keeps the package root focused on build-time loaders and prevents build-time users from loading live runtime dependencies such as `astro:env/server`.

- Use Astro's adapter-backed `getSecret()` for live loader GitHub tokens instead of `import.meta.env`, avoiding build-time inlining and allowing runtime-provided secrets to be read per request ([`c0089f2`](https://github.com/lin-stephanie/astro-loaders/commit/c0089f260d295aa303b223c9432d9f002956858e))

- Astro v6.0 upgrades to Zod 4. Based on the [Zod 4 changelog](https://zod.dev/v4/changelog) and the need to keep compatibility with older Astro versions, update schemas by: ([`c0089f2`](https://github.com/lin-stephanie/astro-loaders/commit/c0089f260d295aa303b223c9432d9f002956858e))

  - Replace `passthrough()` usage with `catchall(z.unknown())` to keep allowing extra fields without requiring Zod 4-only `z.looseObject()`

## 1.0.1

### Patch Changes

- Update `README.md` ([`890cc93`](https://github.com/lin-stephanie/astro-loaders/commit/890cc93a9bce71dc2908bc35a787a49d2791eed2))

## 1.0.0

### Major Changes

- Export `insMediasLoader` for loading Instagram media at build time ([`9c7ff12`](https://github.com/lin-stephanie/astro-loaders/commit/9c7ff12ecd3be1d66eaa623bd65504fb6144fcef))
- Export `liveInsMediasLoader` for fetching Instagram media at runtime on each request ([`9c7ff12`](https://github.com/lin-stephanie/astro-loaders/commit/9c7ff12ecd3be1d66eaa623bd65504fb6144fcef))
- See [README](https://github.com/lin-stephanie/astro-loaders/tree/main/packages/astro-loader-ins-medias) for details ([`9c7ff12`](https://github.com/lin-stephanie/astro-loaders/commit/9c7ff12ecd3be1d66eaa623bd65504fb6144fcef))
