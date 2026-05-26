# astro-loader-ins-medias

## 2.0.0

### Major Changes

- Update the default Instagram API version from `v23.0` to `v25.0`. ([`c0089f2`](https://github.com/lin-stephanie/astro-loaders/commit/c0089f260d295aa303b223c9432d9f002956858e))

  Move live loaders to the `/live` subpath. `liveInsMediasLoader` is no longer exported from the package root, so import it from the `/live` subpath instead:

  ```ts
  import { liveInsMediasLoader } from "astro-loader-ins-medias/live";
  ```

  This keeps the package root focused on build-time loaders and prevents build-time users from loading live runtime dependencies such as `astro:env/server`.

  Use Astro's adapter-backed `getSecret()` for live loader GitHub tokens instead of `import.meta.env`, avoiding build-time inlining and allowing runtime-provided secrets to be read per request.

  Astro v6.0 upgrades to Zod 4. Based on the [Zod 4 changelog](https://zod.dev/v4/changelog) and the need to keep compatibility with older Astro versions, update schemas by:

  - Replace `passthrough()` usage with `catchall(z.unknown())` to keep allowing extra fields without requiring Zod 4-only `z.looseObject()`

## 1.0.1

### Patch Changes

- Update `README.md` ([`890cc93`](https://github.com/lin-stephanie/astro-loaders/commit/890cc93a9bce71dc2908bc35a787a49d2791eed2))

## 1.0.0

### Major Changes ([`9c7ff12`](https://github.com/lin-stephanie/astro-loaders/commit/9c7ff12ecd3be1d66eaa623bd65504fb6144fcef))

- Export `insMediasLoader` for loading Instagram media at build time.
- Export `liveInsMediasLoader` for fetching Instagram media at runtime on each request.
- See [README](https://github.com/lin-stephanie/astro-loaders/tree/main/packages/astro-loader-ins-medias) for details.
