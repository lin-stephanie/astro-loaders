# astro-loader-bluesky-posts

[![version][version-badge]][version-link]
[![jsDocs.io][jsdocs-src]][jsdocs-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![demo][demo-logo]][demo-link]

This package provides a Bluesky posts loader for Astro, supporting both post URLs and [AT-URIs](https://atproto.com/specs/at-uri-scheme) to fetch posts for use in Astro projects. Features include customizable HTML rendering, optional threaded loading, and targeted fetching of author-specific replies.

## Installation

```sh
npm install -D astro-loader-bluesky-posts
```

## Usage

To use the Astro loader, ensure Astro version `^4.14.0 || ^5.0.0`. For `^4.14.0`, enable the [experimental content layer](https://v4.docs.astro.build/en/reference/configuration-reference/#experimentalcontentlayer) in `astro.config.ts`:

```ts
export default defineConfig({
  experimental: {
    contentLayer: true,
  },
})
```

In `src/content/config.ts` (for `^4.14.0`) or `src/content.config.ts` (for `^5.0.0`), import and configure the loader to define a new content collection:

```ts
import { defineCollection } from "astro:content"
import { BlueskyPostsLoader } from "astro-loader-bluesky-posts"

const posts = defineCollection({
  loader: BlueskyPostsLoader({
    uris: [
      'https://bsky.app/profile/bsky.app/post/3l6oveex3ii2l'
      // 'https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur/post/3l6oveex3ii2l'
      // 'at://bsky.app/app.bsky.feed.post/3l6oveex3ii2l'
      // 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3l6oveex3ii2l'
    ],
    // Check the configuration below
  }),
})

export const collections = { posts }
```

[Query the content collection](https://docs.astro.build/en/guides/content-collections/#querying-collections) like any other Astro content collection to render the loaded posts:

```astro
---
import { getCollection } from "astro:content"

const posts = await getCollection("posts")
// Check the entries' Zod schema for available fields below
---

{
  posts.map(async (post) => {
    const { Content } = await render(post)
    return (
      <section>
        <Content />
        <p>{post.data.indexedAt}</p>
      </section>
    )
  })
}
```

To update the data, trigger a site rebuild, as [the loader fetches data only at build time](https://docs.astro.build/en/reference/content-loader-reference/#object-loaders).

## Configuration

This loader retrieves posts via the Bluesky API [`GET /xrpc/app.bsky.feed.getPosts`](https://docs.bsky.app/docs/api/app-bsky-feed-get-posts) and [`GET /xrpc/app.bsky.feed.getPostThread`](https://docs.bsky.app/docs/api/app-bsky-feed-get-post-thread). Options include:

| Option (* required)      | Type (default)                                              | Description                                                                                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uris`*                  | `string[]`                                                  | List of Bluesky post URLs or [AT-URIs](https://atproto.com/specs/at-uri-scheme).                                                                                                                                       |
| `linkTextType`           | `'domain-path' \| 'post-text'` (default: `'post-text'`) | The type of text to display for links when generating renderable HTML:<br>`'domain-path'`: Displays the link's domain and path.<br>`'post-text'`: Uses the link text as shown in the tweet.                          |
| `newlineHandling`        | `'none' \| 'break' \| 'paragraph'` (default: `'none'`)      | The way for processing `\n` when generating renderable HTML:<br>`'none'`: Keep as is.<br>`'break'`: Replace consecutive `\n` with `<br>`.<br>`'paragraph'`: Wrap paragraphs with `<p>` while removing standalone `\n`. |
| `fetchThread`            | `boolean` (default: `false`)                                | Whether to fetch the post's thread including replies and parents.                                                                                                                                                      |
| `threadDepth`            | number (default: `1`)                                       | The depth of the descendant post tree to fetch if fetching the thread. Specifies how many levels of reply depth should be included.                                                                                    |
| `threadParentHeight`     | number (default: `1`)                                       | The height of the ancestor post tree to fetch if fetching the thread. Specifies how many levels of parent posts should be included.                                                                                    |
| `fetchOnlyAuthorReplies` | `boolean` (default: `false`)                                | Whether to fetch only the post author's replies at the specified `threadDepth`. When `true`, it returns only the author's replies as a flat array, ignoring `threadParentHeight` and `parent`.                         |

## Schema

See the [source code](https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-bluesky-posts/src/schema.ts) for the Zod schema of loaded entries. Astro automatically applies this schema to generate TypeScript interfaces, enabling autocompletion and type-checking for collection queries.

To [customize the schema](https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema), ensure compatibility with the loader's built-in Zod schema to prevent errors. For additional fields, consider opening an issue.

## Changelog

See [CHANGELOG.md](https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-bluesky-posts/CHANGELOG.md) for the change history of this loader.

## Contribution

If you see any errors or room for improvement, feel free to open an [issues](https://github.com/lin-stephanie/astro-loaders/issues) or [pull request](https://github.com/lin-stephanie/astro-loaders/pulls) . Thank you in advance for contributing! ❤️

<!-- Badges -->

[version-badge]: https://img.shields.io/npm/v/astro-loader-bluesky-posts?label=release&style=flat&colorA=080f12&colorB=f87171
[version-link]: https://www.npmjs.com/package/astro-loader-bluesky-posts
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=f87171
[jsdocs-href]: https://www.jsdocs.io/package/astro-loader-bluesky-posts
[npm-downloads-src]: https://img.shields.io/npm/dm/astro-loader-bluesky-posts?style=flat&colorA=080f12&colorB=f87171
[npm-downloads-href]: https://npmjs.com/package/astro-loader-bluesky-posts
[demo-logo]: https://img.shields.io/badge/see-demo-080f12?style=flat&colorA=080f12&colorB=f87171
[demo-link]: https://astro-antfustyle-theme.vercel.app/highlights/
