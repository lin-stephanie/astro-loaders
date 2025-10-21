# astro-loader-github-prs

## 1.3.0

### Minor Changes ([`34f18dc`](https://github.com/lin-stephanie/astro-loaders/commit/34f18dc929daf0ead9ad9eff0daa63cb53be6755))

- Add `liveGithubPrsLoader` live loader that fetches PRs at runtime on each request
- Add exports including `LiveGithubPrsLoaderError` (extends `Error`) and the types `LiveGithubPrsLoaderUserConfig`, `LiveCollectionFilter`, and `LiveEntryFilter`
- Add `maxEntries` option
- Update schema

## 1.2.1

### Patch Changes

- Log missing tokens as `warn` instead of `error` ([`0650a3d`](https://github.com/lin-stephanie/astro-loaders/commit/0650a3d60a424d5685151d169716c155513b5075))

## 1.2.0

### Minor Changes

- Add `clearStore` option to control whether to clear store before saving new data ([`d03abe0`](https://github.com/lin-stephanie/astro-loaders/commit/d03abe02d699cbd7f8375959f236f3a2afb85051))

## 1.1.1

### Patch Changes

- Use UTC methods in date calculations for consistency ([`0e0ca6f`](https://github.com/lin-stephanie/astro-loaders/commit/0e0ca6ff59b1183337816980dbdcfab0621430fb))

## 1.1.0

### Minor Changes ([`25f92a8`](https://github.com/lin-stephanie/astro-loaders/commit/25f92a8c2f159336ef8be4bbfe1ed72c33219cfe))

- Add `monthsBack` option to specify the recent months for loading pull requests
- Support returning the `<Content />` component via `render(entry)` to render the PR content
- Errors no longer force the entire Astro project to terminate
- No longer calls `store.clear()` internally

## 1.0.2

### Patch Changes

- Update `peerDependencies` to support Astro 4.14.0+ and 5.x ([`c9a0772`](https://github.com/lin-stephanie/astro-loaders/commit/c9a077259de2f4da9c2503955a43daddae948b0a))

## 1.0.1

### Patch Changes

- Handle missing GitHub token error ([`0ddb6b5`](https://github.com/lin-stephanie/astro-loaders/commit/0ddb6b56465f2ad1b39b8f9bde573c8fa399ab91))

## 1.0.0

### Major Changes

- Supports loading GitHub pull reuqests from a given GitHub search string ([`deb6408`](https://github.com/lin-stephanie/astro-loaders/commit/deb6408257342f2dd17dfa16fb8281ccc9f7add2))
