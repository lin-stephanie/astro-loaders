# astro-loader-github-releases

## 1.1.0

### Minor Changes

- Resolve missing `query.graphql` in build output ([`30fd698`](https://github.com/lin-stephanie/astro-loaders/commit/30fd6985b0120af1fde11c4537453e984eb7e226)) ([`2f0f9ec`](https://github.com/lin-stephanie/astro-loaders/commit/2f0f9ec28883f318833aa051ee1a5a264f030050))
- Add `githubToken` option for authentication with GitHub GraphQL API in 'repoList' mode, defaults to `GITHUB_TOKEN` env var ([`5c859d2`](https://github.com/lin-stephanie/astro-loaders/commit/5c859d28328d2b80ad0872a8565745a7408d4351))

## 1.0.0

### Major Changes

- Provides a GitHub releases loader for Astro ([`d93c600`](https://github.com/lin-stephanie/astro-loaders/commit/d93c6003e05c4ba0d5fb49e6d2d23d1c9a7f38af))
  - Supports fetching GitHub releases in 'repoList' mode (based on the provided repository list) ([`3d49a99`](https://github.com/lin-stephanie/astro-loaders/commit/3d49a99ea58c41cf1c52f4fdffe79e053a00eb90))
  - Supports fetching GitHub releases in 'userCommit' mode (based on commit from user-specific push events) ([`5637860`](https://github.com/lin-stephanie/astro-loaders/commit/56378602f3e6c10887ff704280319414d8f91eb3))
