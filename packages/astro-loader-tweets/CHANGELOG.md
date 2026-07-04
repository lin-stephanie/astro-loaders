# astro-loader-tweets

## 1.3.2

### Patch Changes

- Expand the Astro peer range from `>=4.14.0 <7.0.0` to `>=4.14.0 <8.0.0` so Astro 7 projects can install the loader without peer dependency conflicts. ([`70b8058`](https://github.com/lin-stephanie/astro-loaders/commit/70b80585ffbbe5583ece7f815d9e9f012d8aea17))

  Migrate the package build from inline `tsup` scripts and `postbuild` `.graphql` copying to `tsdown --watch` / `tsdown` with `tsdown.config.ts`, keep `astro:env/server` external through `deps.neverBundle`, disable declaration/source maps, and mark the package as side-effect free for better tree-shaking.

## 1.3.1

### Patch Changes

- Implement the Astro 6 migration change where [schema types are inferred instead of generated](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-schema-types-are-inferred-instead-of-generated-content-loader-api), while preserving accurate loader-based entry data inference and avoiding Zod 4 internal type leakage in published declarations ([`c0089f2`](https://github.com/lin-stephanie/astro-loaders/commit/c0089f260d295aa303b223c9432d9f002956858e))

## 1.3.0

### Minor Changes

- Consolidate consecutive newlines (`\n`) to single `<br/ >\n` ([`bc7ccc0`](https://github.com/lin-stephanie/astro-loaders/commit/bc7ccc09581913a47132e8b691d57c9ba54ca763))
- Rename `urlTextType` option 'display-url' to 'post-text' ([`bc7ccc0`](https://github.com/lin-stephanie/astro-loaders/commit/bc7ccc09581913a47132e8b691d57c9ba54ca763))
- Fix schema for optional `description` in `UserV2Schema` ([`bc7ccc0`](https://github.com/lin-stephanie/astro-loaders/commit/bc7ccc09581913a47132e8b691d57c9ba54ca763))

## 1.2.3

### Patch Changes

- Refine handling for `linkTextType: 'domain-path'` ([`743512a`](https://github.com/lin-stephanie/astro-loaders/commit/743512a5722d4ab33b795f8ceb57977ee3b398c1))

## 1.2.2

### Patch Changes

- Refine logger output and update docs ([`f3c237d`](https://github.com/lin-stephanie/astro-loaders/commit/f3c237df1b014f1fb017085688395fd1b4d40648))

## 1.2.1

### Patch Changes

- Add data type validation for JSON-stored tweets and update docs. ([`dde3e92`](https://github.com/lin-stephanie/astro-loaders/commit/dde3e926b8ba52b4c30bee10d187e6e48a90c5ba))

## 1.2.0

### Minor Changes

- Support for persisting the loaded tweets to a JSON file at a custom path, [see details](https://github.com/lin-stephanie/astro-loaders/tree/main/packages/astro-loader-tweets#about-the-storage-configuration) ([`c0c6f6c`](https://github.com/lin-stephanie/astro-loaders/commit/c0c6f6cc569ba81da1d1e98dd9342fe953382939))

## 1.1.0

### Minor Changes

- Add `newlineHandling` option to specify `\n` processing in `text_html` generation ([`2542879`](https://github.com/lin-stephanie/astro-loaders/commit/2542879d4c27a4bfe6957b6288189116e6cd696a))

## 1.0.0

### Major Changes

- Add basic functionality for `astro-loader-tweets` to support loading tweets from multiple tweet IDs and generating HTML and Markdown for direct rendering ([`d74cd6c`](https://github.com/lin-stephanie/astro-loaders/commit/d74cd6cae34643942e7f1d52918495b3810c1e55), [`424c7e9`](https://github.com/lin-stephanie/astro-loaders/commit/424c7e92d5e15bb89a9c5377398144d4edf31a3c))
