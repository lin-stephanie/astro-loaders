---
"astro-loader-github-prs": major
---

Move live loaders to the `/live` subpath and read runtime tokens with Astro's `getSecret()`.

Breaking change: `liveGithubPrsLoader` is no longer exported from the package root. Import it from the `/live` subpath instead:

```ts
import { liveGithubPrsLoader } from 'astro-loader-github-prs/live'
```

This keeps the package root focused on build-time loaders and prevents build-time users from loading live runtime dependencies such as `astro:env/server`.

Implement the Astro 6 migration change where [schema types are inferred instead of generated (Content Loader API)](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-schema-types-are-inferred-instead-of-generated-content-loader-api), while preserving accurate loader-based entry data inference and avoiding Zod 4 internal type leakage in published declarations.
