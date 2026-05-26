# astro-loader-bluesky-posts

## 1.2.4

### Patch Changes

- Implement the Astro 6 migration change where [schema types are inferred instead of generated](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-schema-types-are-inferred-instead-of-generated-content-loader-api), while preserving accurate loader-based entry data inference and avoiding Zod 4 internal type leakage in published declarations. ([`c0089f2`](https://github.com/lin-stephanie/astro-loaders/commit/c0089f260d295aa303b223c9432d9f002956858e))

- Astro v6.0 upgrades to Zod 4. Based on the [Zod 4 changelog](https://zod.dev/v4/changelog) and the need to keep compatibility with older Astro versions, update schemas by: ([`c0089f2`](https://github.com/lin-stephanie/astro-loaders/commit/c0089f260d295aa303b223c9432d9f002956858e))

  - Replace `passthrough()` usage with `catchall(z.unknown())` to keep allowing extra fields without requiring Zod 4-only `z.looseObject()`;
  - Replace `z.any()` label entries with `z.unknown()` to avoid leaking `any` into inferred entry data;
  - Replace object intersection with `extend()` for the extended post schema;
  - Intentionally keep deprecated string format methods such as `z.string().url()` and `z.string().datetime()` for compatibility with older Astro/Zod versions.

- Add config-specific loader overloads so `fetchThread` and `fetchOnlyAuthorReplies` infer the matching entry data shape. ([`c0089f2`](https://github.com/lin-stephanie/astro-loaders/commit/c0089f260d295aa303b223c9432d9f002956858e))

- Use the public `@atproto/api` `AppBskyFeedDefs` exports and type guards instead of internal `dist/client/types` imports. ([`c0089f2`](https://github.com/lin-stephanie/astro-loaders/commit/c0089f260d295aa303b223c9432d9f002956858e))

- Relax the thread schema for raw nested replies and optional Bluesky author fields that the API can omit. ([`c0089f2`](https://github.com/lin-stephanie/astro-loaders/commit/c0089f260d295aa303b223c9432d9f002956858e))

- Cache by the full parsed loader config instead of only `uris` so rendering and thread option changes trigger a reload. ([`c0089f2`](https://github.com/lin-stephanie/astro-loaders/commit/c0089f260d295aa303b223c9432d9f002956858e))

- Preserve stack traces in loader error logs so failures remain debuggable. ([`c0089f2`](https://github.com/lin-stephanie/astro-loaders/commit/c0089f260d295aa303b223c9432d9f002956858e))

## 1.2.3

### Patch Changes

- Update schema ([`29a885d`](https://github.com/lin-stephanie/astro-loaders/commit/29a885dbbb776e205948b3482ebca9db4331e007))

## 1.2.2

### Patch Changes

- Update the entry Zod schema ([`aec3423`](https://github.com/lin-stephanie/astro-loaders/commit/aec342343b0872dbf2d1eab3132a216230a6a45d))
- Resolve `<Content />` becomes non-functional when `fetchThread: true` is set ([`aec3423`](https://github.com/lin-stephanie/astro-loaders/commit/aec342343b0872dbf2d1eab3132a216230a6a45d))

## 1.2.1

### Patch Changes

- Refactor first parameter type of exported `renderPostAsHtml` from [PostView](https://github.com/bluesky-social/atproto/blob/main/packages/api/src/client/types/app/bsky/feed/defs.ts#L26) to [RichTextProps](https://github.com/bluesky-social/atproto/blob/main/packages/api/src/rich-text/rich-text.ts#L105) ([`981ee1a`](https://github.com/lin-stephanie/astro-loaders/commit/981ee1a25cd856bcb2f77626764f89ecae20aff3))
- Update docs ([`981ee1a`](https://github.com/lin-stephanie/astro-loaders/commit/981ee1a25cd856bcb2f77626764f89ecae20aff3))

## 1.2.0

### Minor Changes

- Support `uris` for direct Bluesky post URLs ([`2140c1c`](https://github.com/lin-stephanie/astro-loaders/commit/2140c1c8cc7a783864cb72b6287706c26826d6b7))
- Skip if `uris` unchanged, unless `src/content/config.ts` or `src/content.config.ts` changes ([`2140c1c`](https://github.com/lin-stephanie/astro-loaders/commit/2140c1c8cc7a783864cb72b6287706c26826d6b7))
- Rename the `linkTextType` option value from `'display-url'` to `'post-text'` ([`2140c1c`](https://github.com/lin-stephanie/astro-loaders/commit/2140c1c8cc7a783864cb72b6287706c26826d6b7))
- Update the `link` field to use `did` instead of `handle` within the post URL string ([`2140c1c`](https://github.com/lin-stephanie/astro-loaders/commit/2140c1c8cc7a783864cb72b6287706c26826d6b7))
- Update the entry Zod schema ([`2140c1c`](https://github.com/lin-stephanie/astro-loaders/commit/2140c1c8cc7a783864cb72b6287706c26826d6b7))

## 1.1.0

### Minor Changes

- Support retrieving post URL (`link`) and rendered HTML (`html`) when `fetchThread: false` or `fetchThread: true` + `fetchOnlyAuthorReplies: true` ([`6f5e32e`](https://github.com/lin-stephanie/astro-loaders/commit/6f5e32edf6b68a160eed1a218c558d641933f969))
- Export `renderPostAsHtml` and `getPostLink` ([`6f5e32e`](https://github.com/lin-stephanie/astro-loaders/commit/6f5e32edf6b68a160eed1a218c558d641933f969))
- Batch process `GET /xrpc/app.bsky.feed.getPosts` to avoid exceeding 25 URIs per request ([`6f5e32e`](https://github.com/lin-stephanie/astro-loaders/commit/6f5e32edf6b68a160eed1a218c558d641933f969))
- Update docs ([`6f5e32e`](https://github.com/lin-stephanie/astro-loaders/commit/6f5e32edf6b68a160eed1a218c558d641933f969))

## 1.0.0

### Major Changes

- Support loading Bluesky posts using [AT-URI](https://atproto.com/specs/at-uri-scheme) ([`bdaeced`](https://github.com/lin-stephanie/astro-loaders/commit/bdaeced70ec65483c742f199d7a15a620d89c138))
  - Customizable HTML generation for posts (e.g., render posts with `<Content />` using `render(entry)`) ([`bdaeced`](https://github.com/lin-stephanie/astro-loaders/commit/bdaeced70ec65483c742f199d7a15a620d89c138))
  - Configurable thread loading and recursive filtering of the post author's replies ([`bdaeced`](https://github.com/lin-stephanie/astro-loaders/commit/bdaeced70ec65483c742f199d7a15a620d89c138))
