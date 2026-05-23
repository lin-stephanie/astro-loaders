---
"astro-loader-github-prs": major
---

Move live loaders to the `/live` subpath and read runtime tokens with Astro's `getSecret()`.

Breaking change: `liveGithubPrsLoader` is no longer exported from the package root. Import it from the `/live` subpath instead:

```ts
import { liveGithubPrsLoader } from 'astro-loader-github-prs/live'
```

This keeps the package root focused on build-time loaders and prevents build-time users from loading live runtime dependencies such as `astro:env/server`.
