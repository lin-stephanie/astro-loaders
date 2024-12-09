# astro-loader-tweets

[![version][version-badge]][version-link]
[![jsDocs.io][jsdocs-src]][jsdocs-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

This package provides a tweets loader for Astro, fetching tweets from X (formerly Twitter) by their IDs for use in Astro projects. It also supports customizable configurations to generate HTML and Markdown for direct rendering.

## Installation

```sh
npm install -D astro-loader-tweets
```

## Usage

To use the Astro loader, ensure Astro version `^4.14.0 || ^5.0.0`. For `^4.14.0`, enable the [experimental content layer](https://docs.astro.build/en/reference/configuration-reference/#experimentalcontentlayer) in `astro.config.ts`:

```ts
export default defineConfig({
  experimental: {
    contentLayer: true,
  },
})
```

In `src/content/config.ts`, import and configure the loader to define a new content collection:

```ts
import { defineCollection } from "astro:content"
import { tweetsLoader } from "astro-loader-tweets"

const tweets = defineCollection({
  loader: tweetsLoader({
    tweetIds: ['1865968097976586582'],
    // Check the configuration below
  }),
})

export const collections = { tweets }
```

[Query the content collection](https://docs.astro.build/en/guides/content-collections/#querying-collections) like any other Astro content collection to render the loaded GitHub PRs:

```astro
---
import { getCollection } from "astro:content"

const tweets = await getCollection("tweets")
---

{
  tweets.map(async (tweet) => {
    const { Content } = await render(tweet)
    // Check the entries' Zod schema for available props below
    return (
      <section>
        <Content />
        <p>{tweet.data.tweet.created_at}</p>
      </section>
    )
  })
}
```

To update the data, trigger a site rebuild, as [the loader fetches data only at build time](https://docs.astro.build/en/reference/content-loader-reference/#object-loaders).

## Configuration

This loader retrieves tweets via the X API V2 [`GET /2/tweets`](https://developer.x.com/en/docs/x-api/tweets/lookup/api-reference/get-tweets) endpoint, requiring an X app-only Bearer Token for authentication.

Please note that under the X API V2 free plan, the endpoint is limited to 1 request per 15 minutes and a maximum of 100 posts per month. If you have a more scalable solution, please share to help overcome these limitations. Options include:

| Option (* required)  | Type (defaults)                                              | Description                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tweetIds`*          | `string[]`                                                   | An array of Tweet IDs to fetch content for.                                                                                                                                                                                                                                                                                                                                                                 |
| `removeTrailingUrls` | `boolean` (defaults: `true`)                                 | Whether to remove trailing URLs from the tweet text in the generated `text_html` and `text_markdown`, typically used for views or referenced tweets.                                                                                                                                                                                                                                                        |
| `linkTextType`       | `'domain-path' \| 'display-url'` (defaults: `'display-url'`) | The type of text to display for links when generating `text_html` and `text_markdown`:<br>`'domain-path'`: Displays the link's domain and path.<br>`'display-url'`: Uses the link text as shown in the tweet.                                                                                                                                                                                               |
| `newlineHandling`    | `'none' \| 'break' \| 'paragraph'` (defaults: `'none'`)      | The way for processing `\n` in `text_html` generation:<br>`'none'`: Keep as is.<br>`'break'`: Replace `\n` with `<br>`.<br>`'paragraph'`: Wrap paragraphs with `<p>` while removing standalone `\n`.                                                                                                                                                                                                        |
| `authToken`          | `string` (defaults: `'import.meta.env.X_TOKEN'`)             | The X app-only Bearer Token for authentication. Defaults to the `X_TOKEN` environment variable. **If configured here, keep confidential and avoid public exposure.** See [how to create one](https://developer.x.com/en/docs/authentication/oauth-2-0/bearer-tokens) and [configure env vars in an Astro project](https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables). |


## Schema

Check the Zod schema for loaded collection entries in the [source code](https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-tweets/src/schema.ts).

Astro automatically applies this schema to generate TypeScript interfaces, providing full support for autocompletion and type-checking when querying the collection.

If you need to [customize the collection schema](https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema), ensure it remains compatible with the built-in Zod schema of the loader to avoid errors. For additional fields you'd like to fetch, feel free to [open an issue](https://github.com/lin-stephanie/astro-loaders/issues).


[version-badge]: https://img.shields.io/npm/v/astro-loader-tweets?label=release&style=flat&colorA=080f12&colorB=ef7575
[version-link]: https://www.npmjs.com/package/astro-loader-tweets
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=ef7575
[jsdocs-href]: https://www.jsdocs.io/package/astro-loader-tweets
[npm-downloads-src]: https://img.shields.io/npm/dm/astro-loader-tweets?style=flat&colorA=080f12&colorB=ef7575
[npm-downloads-href]: https://npmjs.com/package/astro-loader-tweets


<!-- Rendering posts -->
