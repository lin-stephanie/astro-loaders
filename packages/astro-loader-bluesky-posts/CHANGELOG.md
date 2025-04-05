# astro-loader-bluesky-posts

## 1.2.1

### Patch Changes

- Refactor first parameter type of exported `renderPostAsHtml` from [PostView](https://github.com/bluesky-social/atproto/blob/main/packages/api/src/client/types/app/bsky/feed/defs.ts#L26) to [RichTextProps](https://github.com/bluesky-social/atproto/blob/main/packages/api/src/rich-text/rich-text.ts#L105) ([`981ee1a`](https://github.com/lin-stephanie/astro-loaders/commit/981ee1a25cd856bcb2f77626764f89ecae20aff3))
  Update docs

## 1.2.0

### Minor Changes ([`2140c1c`](https://github.com/lin-stephanie/astro-loaders/commit/2140c1c8cc7a783864cb72b6287706c26826d6b7))

- Support `uris` for direct Bluesky post URLs
- Skip if `uris` unchanged, unless `src/content/config.ts` or `src/content.config.ts` changes
- Rename the `linkTextType` option value from `'display-url'` to `'post-text'`
- Update the `link` field to use `did` instead of `handle` within the post URL string
- Update the entry Zod schema

## 1.1.0

### Minor Changes ([`6f5e32e`](https://github.com/lin-stephanie/astro-loaders/commit/6f5e32edf6b68a160eed1a218c558d641933f969))

- Support retrieving post URL (`link`) and rendered HTML (`html`) when `fetchThread: false` or `fetchThread: true` + `fetchOnlyAuthorReplies: true`
- Export `renderPostAsHtml` and `getPostLink`
- Batch process `GET /xrpc/app.bsky.feed.getPosts` to avoid exceeding 25 URIs per request
- Update docs

## 1.0.0

### Major Changes

- Support loading Bluesky posts using [AT-URI](https://atproto.com/specs/at-uri-scheme) ([`bdaeced`](https://github.com/lin-stephanie/astro-loaders/commit/bdaeced70ec65483c742f199d7a15a620d89c138))
  - Customizable HTML generation for posts (e.g., render posts with `<Content />` using `render(entry)`)
  - Configurable thread loading and recursive filtering of the post author's replies
