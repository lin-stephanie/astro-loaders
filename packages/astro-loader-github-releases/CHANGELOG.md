# astro-loader-github-releases

## 1.4.0

### Minor Changes ([`38cf8fc`](https://github.com/lin-stephanie/astro-loaders/commit/38cf8fced10c91476e9475fd40f6df51f86cf121))

- In `userCommit` mode, add `repoOwner` field and renamed `repoName` to `repoNameWithOwner` (the original `repoName` only represented the repository name). 
- In `repoList` mode, add `versionNum` and `repoOwner` fields.
- In `repoList` mode, when configured with `entryReturnType: 'byRepository'`, support returning the `<Content />` component via `render(entry)` to render the published content.
- Errors no longer force the entire Astro project to terminate.
- No longer calls `store.clear()` internally.

## 1.3.1

### Patch Changes

- Update `peerDependencies` to support Astro 4.14.0+ and 5.x ([`c9a0772`](https://github.com/lin-stephanie/astro-loaders/commit/c9a077259de2f4da9c2503955a43daddae948b0a))

## 1.3.0

### Minor Changes

- Add `monthsBack` option in 'repoList' mode to specify the recent months for loading releases ([`752ee0e`](https://github.com/lin-stephanie/astro-loaders/commit/752ee0e9ae3fba4a78091737c675979936284279))

## 1.2.3

### Patch Changes

- Handle missing GitHub token error & Optimize logging ([`de1a6cc`](https://github.com/lin-stephanie/astro-loaders/commit/de1a6cc2b3a244d93280c96ee4b6994cd4060162))

## 1.2.2

### Patch Changes

- Fix the ineffective `sinceDate` configuration in 'repoList' mode ([`bd4ea47`](https://github.com/lin-stephanie/astro-loaders/commit/bd4ea47fbff892a3c017999775fd52cd6dd45568))

## 1.2.1

### Patch Changes

- Resolve error ('Type 'string' is not assignable to type 'Date'') when setting `sinceDate` field due to type mismatch in Zod type inference ([`0a0dede`](https://github.com/lin-stephanie/astro-loaders/commit/0a0dede095dab52612a92cf14f00a81d796e2570))

## 1.2.0

### Minor Changes

- Adjust 'userCommit' mode configuration options & add new entry fields with aligned naming to match the fields in the response JSON data ([`35312c1`](https://github.com/lin-stephanie/astro-loaders/commit/35312c165ef95391c865e5bfcd5b8790c8d20683))

### Patch Changes

- Save `etag` to meta & properly handle 304 response status ([`9a23da5`](https://github.com/lin-stephanie/astro-loaders/commit/9a23da5989f5f495de2dfbce1064024ed2af9d9e))

## 1.1.0

### Minor Changes

- Resolve missing `query.graphql` in build output ([`30fd698`](https://github.com/lin-stephanie/astro-loaders/commit/30fd6985b0120af1fde11c4537453e984eb7e226))
- Add `githubToken` option for authentication with GitHub GraphQL API in 'repoList' mode, defaults to `GITHUB_TOKEN` env var ([`5c859d2`](https://github.com/lin-stephanie/astro-loaders/commit/5c859d28328d2b80ad0872a8565745a7408d4351))

## 1.0.0

### Major Changes

- Supports fetching GitHub releases in 'repoList' mode (based on the provided repository list) ([`3d49a99`](https://github.com/lin-stephanie/astro-loaders/commit/3d49a99ea58c41cf1c52f4fdffe79e053a00eb90))
- Supports fetching GitHub releases in 'userCommit' mode (based on commit from user-specific push events) ([`5637860`](https://github.com/lin-stephanie/astro-loaders/commit/56378602f3e6c10887ff704280319414d8f91eb3))
