---
"astro-loader-bluesky-posts": patch
---

Expand the Astro peer range from `>=4.14.0 <7.0.0` to `>=4.14.0 <8.0.0` so Astro 7 projects can install the loader without peer dependency conflicts.

Migrate the package build from inline `tsup` scripts and `postbuild` `.graphql` copying to `tsdown --watch` / `tsdown` with `tsdown.config.ts`, keep `astro:env/server` external through `deps.neverBundle`, disable declaration/source maps, and mark the package as side-effect free for better tree-shaking.

