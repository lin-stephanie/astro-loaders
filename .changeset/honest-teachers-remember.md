---
"astro-loader-github-releases": minor
---

In `userCommit` mode, add `repoOwner` field and renamed `repoName` to `repoNameWithOwner` (the original `repoName` only represented the repository name).
In `repoList` mode, add `versionNum` and `repoOwner` fields.
In `repoList` mode, when configured with `entryReturnType: 'byRepository'`, supports returning the `<Content />` component via `render(entry)` to render the published content.
Errors no longer force the entire Astro project to terminate.
The loader no longer calls `store.clear()` internally.
