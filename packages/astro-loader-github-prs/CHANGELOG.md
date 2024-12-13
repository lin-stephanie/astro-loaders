# astro-loader-github-prs

## 1.1.0

### Minor Changes

- Add `monthsBack` option to specify the recent months for loading pull requests ([`25f92a8`](https://github.com/lin-stephanie/astro-loaders/commit/25f92a8c2f159336ef8be4bbfe1ed72c33219cfe))
  Support returning the `<Content />` component via `render(entry)` to render the PR content
  Errors no longer force the entire Astro project to terminate
  No longer calls `store.clear()` internally

## 1.0.2

### Patch Changes

- Update `peerDependencies` to support Astro 4.14.0+ and 5.x ([`c9a0772`](https://github.com/lin-stephanie/astro-loaders/commit/c9a077259de2f4da9c2503955a43daddae948b0a))

## 1.0.1

### Patch Changes

- Handle missing GitHub token error ([`0ddb6b5`](https://github.com/lin-stephanie/astro-loaders/commit/0ddb6b56465f2ad1b39b8f9bde573c8fa399ab91))

## 1.0.0

### Major Changes

- Supports loading GitHub pull reuqests from a given GitHub search string ([`deb6408`](https://github.com/lin-stephanie/astro-loaders/commit/deb6408257342f2dd17dfa16fb8281ccc9f7add2))
