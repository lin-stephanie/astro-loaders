# astro-loader-github-releases

## 3.0.0

### Major Changes

- Remove the `userCommit` mode from build-time and live release loaders because GitHub no longer includes commit summaries in public `PushEvent` payloads. The `mode: 'repoList'` discriminator is also removed because repository-list loading is now the only supported behavior ([`c0089f2`](https://github.com/lin-stephanie/astro-loaders/commit/c0089f260d295aa303b223c9432d9f002956858e))

- Move live loaders to the `/live` subpath. `liveGithubReleasesLoader` is no longer exported from the package root, so import it from the `/live` subpath instead: ([`c0089f2`](https://github.com/lin-stephanie/astro-loaders/commit/c0089f260d295aa303b223c9432d9f002956858e))

  ```ts
  import { liveGithubReleasesLoader } from "astro-loader-github-releases/live";
  ```

  This keeps the package root focused on build-time loaders and prevents build-time users from loading live runtime dependencies such as `astro:env/server`.

- Use Astro's adapter-backed `getSecret()` for live loader GitHub tokens instead of `import.meta.env`, avoiding build-time inlining and allowing runtime-provided secrets to be read per request ([`c0089f2`](https://github.com/lin-stephanie/astro-loaders/commit/c0089f260d295aa303b223c9432d9f002956858e))

- Implement the Astro 6 migration change where [schema types are inferred instead of generated](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-schema-types-are-inferred-instead-of-generated-content-loader-api), while preserving accurate `entryReturnType` inference and avoiding Zod 4 internal type leakage in published declarations ([`c0089f2`](https://github.com/lin-stephanie/astro-loaders/commit/c0089f260d295aa303b223c9432d9f002956858e))

- Astro v6.0 upgrades to Zod 4. Based on the [Zod 4 changelog](https://zod.dev/v4/changelog) and the need to keep compatibility with older Astro versions, update schemas by: ([`c0089f2`](https://github.com/lin-stephanie/astro-loaders/commit/c0089f260d295aa303b223c9432d9f002956858e))
  
  - Replace object intersection with `extend()` for the extended post schema

## 2.1.1

### Patch Changes

- Update `README.md` ([`7deec94`](https://github.com/lin-stephanie/astro-loaders/commit/7deec9474f52150356f1a3c096723d39f4538fb5))

## 2.1.0

### Minor Changes 

- Add `liveGithubReleasesLoader` live loader that fetches releases at runtime on each request ([`348d6cf`](https://github.com/lin-stephanie/astro-loaders/commit/348d6cf435e30c80e5a3fc9663f9cdc0d0a1b3d2))
- Add exports including `LiveGithubReleasesLoaderError` (extends `Error`) and the types `LiveGithubReleasesLoaderUserConfig`, `LiveCollectionFilter`, and `LiveEntryFilter` ([`348d6cf`](https://github.com/lin-stephanie/astro-loaders/commit/348d6cf435e30c80e5a3fc9663f9cdc0d0a1b3d2))
- Update schema (for `mode: 'repoList'`) ([`348d6cf`](https://github.com/lin-stephanie/astro-loaders/commit/348d6cf435e30c80e5a3fc9663f9cdc0d0a1b3d2))

## 2.0.2

### Patch Changes

- Exit early in 'repoList' mode when GitHub token is missing ([`e2fdc33`](https://github.com/lin-stephanie/astro-loaders/commit/e2fdc33a405a4e4e15470c524dc9d8eab4909321))

## 2.0.1

### Patch Changes

- Log missing tokens as `warn` instead of `error` ([`0650a3d`](https://github.com/lin-stephanie/astro-loaders/commit/0650a3d60a424d5685151d169716c155513b5075))

## 2.0.0

### Major Changes

- Update Configuration Structure ([`153a8da`](https://github.com/lin-stephanie/astro-loaders/commit/153a8daf3aa514758f0e3edaf4c145d710372896))

  - Renamed `loadMode` to `mode`
  - Removed `modeConfig`; options are now configured per mode directly
- In `repoList` mode, when `entryReturnType: 'byRepository'`, renamed `repoReleases` in the entry Zod schema to `releases` ([`153a8da`](https://github.com/lin-stephanie/astro-loaders/commit/153a8daf3aa514758f0e3edaf4c145d710372896))

- Add `clearStore` option to control whether to clear store before saving new data ([`153a8da`](https://github.com/lin-stephanie/astro-loaders/commit/153a8daf3aa514758f0e3edaf4c145d710372896))


## 1.4.1

### Patch Changes

- Use UTC methods in date calculations for consistency ([`0e0ca6f`](https://github.com/lin-stephanie/astro-loaders/commit/0e0ca6ff59b1183337816980dbdcfab0621430fb))

## 1.4.0

### Minor Changes 

- In `userCommit` mode, add `repoOwner` field and renamed `repoName` to `repoNameWithOwner` (the original `repoName` only represented the repository name) ([`38cf8fc`](https://github.com/lin-stephanie/astro-loaders/commit/38cf8fced10c91476e9475fd40f6df51f86cf121))
- In `repoList` mode, add `versionNum` and `repoOwner` fields ([`38cf8fc`](https://github.com/lin-stephanie/astro-loaders/commit/38cf8fced10c91476e9475fd40f6df51f86cf121))
- In `repoList` mode, when configured with `entryReturnType: 'byRelease'`, support returning the `<Content />` component via `render(entry)` to render the published content ([`38cf8fc`](https://github.com/lin-stephanie/astro-loaders/commit/38cf8fced10c91476e9475fd40f6df51f86cf121))
- Errors no longer force the entire Astro project to terminate ([`38cf8fc`](https://github.com/lin-stephanie/astro-loaders/commit/38cf8fced10c91476e9475fd40f6df51f86cf121))
- No longer calls `store.clear()` internally ([`38cf8fc`](https://github.com/lin-stephanie/astro-loaders/commit/38cf8fced10c91476e9475fd40f6df51f86cf121))

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
