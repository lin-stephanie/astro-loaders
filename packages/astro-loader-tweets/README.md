# astro-loader-tweets

[![version][version-badge]][version-link]
[![jsDocs.io][jsdocs-src]][jsdocs-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

This package provides a tweets loader for Astro, fetching tweets from X (formerly Twitter) by their IDs for use in Astro projects. It supports customizable HTML/Markdown generation and saving tweets to a custom JSON file.

## Installation

```sh
npm install -D astro-loader-tweets
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
// Check the entries' Zod schema for available fields below
---

{
  tweets.map(async (tweet) => {
    const { Content } = await render(tweet)
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

This loader retrieves tweets via the X API V2 [`GET /2/tweets`](https://developer.x.com/en/docs/x-api/tweets/lookup/api-reference/get-tweets) endpoint, requiring an X app-only Bearer Token for authentication. Options include:

| Option (* required)  | Type (default)                                              | Description                                                                                                                                                                                                                                                                                                                                                 |
| -------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ids`*               | `string[]`                                                  | An array of Tweet IDs to fetch content for.                                                                                                                                                                                                                                                                                                                 |
| `storage`            | `'default' \| 'custom' \| 'both'` (default: `'default'`)    | The method to store the loaded tweets:<br>`'default'`: Uses Astro's default KV store.<br>`'custom'`: Use a custom JSON file path.<br>`'both'`: Both default and custom path.                                                                                                                             |
| `storePath`          | `string` (default: `'src/data/tweets.json'`)                | The custom output path for storing tweets, either absolute or relative to the Astro project root. Must end with `.json`. Required if `storage` is `'custom'` or `'both'`.                                                                                                                                                                             |
| `removeTrailingUrls` | `boolean` (default: `true`)                                 | Whether to remove trailing URLs from the tweet text in the generated `text_html` and `text_markdown`, typically used for views or referenced tweets.                                                                                                                                                                                                        |
| `linkTextType`       | `'domain-path' \| 'display-url'` (default: `'display-url'`) | The type of text to display for links when generating `text_html` and `text_markdown`:<br>`'domain-path'`: Displays the link's domain and path.<br>`'display-url'`: Uses the link text as shown in the tweet.                                                                                                                                               |
| `newlineHandling`    | `'none' \| 'break' \| 'paragraph'` (default: `'none'`)      | The way for processing `\n` in `text_html` generation:<br>`'none'`: Keep as is.<br>`'break'`: Replace `\n` with `<br>`.<br>`'paragraph'`: Wrap paragraphs with `<p>` while removing standalone `\n`.                                                                                                                                                        |
| `authToken`          | `string` (Defaults to the `X_TOKEN` environment variable)   | The X app-only Bearer Token for authentication. **If configured here, keep confidential and avoid public exposure.** See [how to create one](https://developer.x.com/en/docs/authentication/oauth-2-0/bearer-tokens) and [configure env vars in an Astro project](https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables). |

### About the `storage` Configuration

**Why not use the Astro default store?**

- Each time the `content.config.ts` file is modified, Astro clears the [store](https://docs.astro.build/en/reference/content-loader-reference/#datastore) (i.e., `.astro/data-store.json` file).  
- Under the X API V2 free plan, the endpoint requested are limited: only **1 request per 15 minutes** is allowed, with a maximum of **100 tweets retrievable per month**.

**Benefits of custom JSON file storage**

- Newly loaded Tweets are appended or updated in the specified JSON file.  
- Data can be edited while retaining the `id` attribute and structure, but repeated requests for the same Tweet ID will overwrite existing data.  
- Stored tweets persist unless the file is manually deleted, allowing up to 100 unique Tweets to be loaded monthly.

**Creating content collection from JSON file**

After storing tweets in a custom JSON file, you will need to define an additional content collection for rendering purposes:

```ts
import { tweetsLoader, TweetSchema } from 'astro-loader-tweets'

const savedTweets = defineCollection({
  loader: file("src/data/tweets.json"),
  schema: TweetSchema
})

export const collections = { ..., savedTweets }
```

Additionally, use [`set:html`](https://docs.astro.build/en/reference/directives-reference/#sethtml) to embed tweets formatted in HTML instead of using the `<Content />` component.

```astro
---
import { getCollection } from "astro:content"

const savedTweets = await getCollection("savedTweets")
---

{
  savedTweets.map(async (t) => {
    return (
      <section>
        <Fragment set:html={t.data.tweet.text_html}></Fragment>
        <p>{tweet.data.tweet.created_at}</p>
      </section>
    )
  })
}
```

## Schema

Refer to the [source code](https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-tweets/src/schema.ts#L269) for the Zod schema used for loaded collection entries. Astro automatically applies this schema to generate TypeScript interfaces, enabling autocompletion and type-checking for collection queries.

In addition to API-fetched fields, the loader extends fields defined in the [`TweetV2ExtendedSchema`](https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-tweets/src/schema.ts#L124), simplifying the control over tweet content display.

To [customize the schema](https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema), ensure compatibility with the loader's built-in Zod schema to prevent errors. For additional fields, consider [opening an issue](https://github.com/lin-stephanie/astro-loaders/issues).

[version-badge]: https://img.shields.io/npm/v/astro-loader-tweets?label=release&style=flat&colorA=080f12&colorB=ef7575
[version-link]: https://www.npmjs.com/package/astro-loader-tweets
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=ef7575
[jsdocs-href]: https://www.jsdocs.io/package/astro-loader-tweets
[npm-downloads-src]: https://img.shields.io/npm/dm/astro-loader-tweets?style=flat&colorA=080f12&colorB=ef7575
[npm-downloads-href]: https://npmjs.com/package/astro-loader-tweets
