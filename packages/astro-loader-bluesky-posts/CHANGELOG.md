# astro-loader-bluesky-posts

## 1.0.0

### Major Changes

- Support loading Bluesky posts using [AT-URI](https://atproto.com/specs/at-uri-scheme) ([`bdaeced`](https://github.com/lin-stephanie/astro-loaders/commit/bdaeced70ec65483c742f199d7a15a620d89c138))
  - Customizable HTML generation for posts (e.g., render posts with `<Content />` using `render(entry)`)
  - Configurable thread loading and recursive filtering of the post author's replies
