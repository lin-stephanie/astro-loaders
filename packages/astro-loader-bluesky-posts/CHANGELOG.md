# astro-loader-bluesky-posts

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
