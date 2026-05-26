---
"astro-loader-github-releases": major
---

Remove the `userCommit` mode from build-time and live release loaders because GitHub no longer includes commit summaries in public `PushEvent` payloads. The `mode: 'repoList'` discriminator is also removed because repository-list loading is now the only supported behavior.

Move live loaders to the `/live` subpath. `liveGithubReleasesLoader` is no longer exported from the package root, so import it from the `/live` subpath instead:

```ts
import { liveGithubReleasesLoader } from 'astro-loader-github-releases/live'
```

This keeps the package root focused on build-time loaders and prevents build-time users from loading live runtime dependencies such as `astro:env/server`.

Use Astro's adapter-backed `getSecret()` for live loader GitHub tokens instead of `import.meta.env`, avoiding build-time inlining and allowing runtime-provided secrets to be read per request.

Implement the Astro 6 migration change where [schema types are inferred instead of generated (Content Loader API)](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-schema-types-are-inferred-instead-of-generated-content-loader-api), while preserving accurate `entryReturnType` inference and avoiding Zod 4 internal type leakage in published declarations.
