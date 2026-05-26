---
"astro-loader-ins-medias": major
---

Update the default Instagram API version from `v23.0` to `v25.0`.

Move live loaders to the `/live` subpath. `liveInsMediasLoader` is no longer exported from the package root, so import it from the `/live` subpath instead:

```ts
import { liveInsMediasLoader } from 'astro-loader-ins-medias/live'
```

This keeps the package root focused on build-time loaders and prevents build-time users from loading live runtime dependencies such as `astro:env/server`.

Use Astro's adapter-backed `getSecret()` for live loader GitHub tokens instead of `import.meta.env`, avoiding build-time inlining and allowing runtime-provided secrets to be read per request.

Astro v6.0 upgrades to Zod 4. Based on the [Zod 4 changelog](https://zod.dev/v4/changelog) and the need to keep compatibility with older Astro versions, update schemas by:

- Replace `passthrough()` usage with `catchall(z.unknown())` to keep allowing extra fields without requiring Zod 4-only `z.looseObject()`
