# astro-loader-ins-medias

[![version][version-badge]][version-link]
[![jsDocs.io][jsdocs-src]][jsdocs-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

This package provides Instagram media loaders for Astro projects using the [Instagram API with Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login). It includes:

- `insMediasLoader`: Loads Instagram media at build time.
- `liveInsMediasLoader`: Fetches Instagram media at runtime on each request.

## Prerequisites

To use this loader, you need to [get an access token](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/get-started#get-an-access-token) from Meta. This requires a few steps:

1. **Instagram Professional Account**: Your Instagram account must be a Business or Creator account. You can [switch your account type](https://help.instagram.com/502981923235522) in the Instagram app settings.
2. **Meta Developer Account**: Register as a developer at [Meta for Developers](https://developers.facebook.com/docs/development/register).
3. **Create a Meta App for Instagram**: In the App Dashboard, [create a Meta app](https://developers.facebook.com/docs/instagram-platform/create-an-instagram-app) to get the token later. You can skip “Connect a business”.
4. **Generate Access Token**: Go to Instagram > API Setup with Instagram Business Login, click Generate Token next to the target Instagram account, log into Instagram Professional Account, and copy the generated access token (valid for 60 days).

## Installation

```sh
npm install astro-loader-ins-medias
```

## Usage

To use the Astro loader, ensure Astro version `>=4.14.0`. For `^4.14.0`, enable the experimental content layer in `astro.config.ts`:

```ts
export default defineConfig({
  experimental: {
    contentLayer: true,
  },
})
```

### `insMediasLoader` (Build-time Collection)

In `src/content/config.ts` (for `^4.14.0`) or `src/content.config.ts` (for `>=5.0.0`), import and configure the build-time loader to define a new content collection:

```ts
import { defineCollection } from "astro:content"
import { insMediasLoader } from "astro-loader-ins-medias"

const insMedias = defineCollection({
  loader: insMediasLoader({
    fields: 'id,permalink,caption,media_url',
    mediaTypes: ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'],
    since: new Date('2024-01-01'),
    until: '2024-12-31',
    limit: 10,
    apiVersion: 'v25.0',
  }),
})

export const collections = { insMedias }
```

[Query the content collection](https://docs.astro.build/en/guides/content-collections/#querying-collections) like any other Astro content collection to render the loaded Instagram medias:

```astro
---
import { getCollection } from "astro:content";

const medias = await getCollection("insMedias");
---

{medias.map((media) => {
  const { permalink, media_url, caption } = media.data;
  return (
    <a href={permalink}>
      <img src={media_url} alt={caption} />
      <p>{caption}</p>
    </a>
  );
})}
```

To update the data, trigger a site rebuild (e.g., using a third-party cron job service), as [the loader fetches data only at build time](https://docs.astro.build/en/reference/content-loader-reference/#object-loaders).

### `liveInsMediasLoader` (Live Collection)

To use live content collections, ensure Astro version `>=5.10.0` and use an adapter that supports [on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/) with [`astro:env/server` runtime support](https://docs.astro.build/en/guides/environment-variables/#type-safe-environment-variables). For `^5.10.0`, [enable the experimental `liveContentCollections` flag](https://v5.docs.astro.build/en/reference/experimental-flags/live-content-collections/) in `astro.config.ts`:

```ts
export default {
  experimental: {
    liveContentCollections: true,
  },
};
```
Starting in `6.0.0`, this feature is no longer experimental. In `src/live.config.ts`, import and configure the live loader to define a new live content collection:

```ts
import { defineLiveCollection } from 'astro:content';
import { liveInsMediasLoader } from 'astro-loader-ins-medias/live';

const liveInsMedias = defineLiveCollection({
  loader: liveInsMediasLoader(),
});

export const collections = { liveInsMedias };
```

Query at runtime using `getLiveCollection()` or `getLiveEntry()`:

```astro
---
export const prerender = false;
import { getLiveCollection, getLiveEntry } from 'astro:content';

// Get medias
const { entries: medias, error } = await getLiveCollection('liveInsMedias',{
  fields: 'id,permalink,caption,media_url',
  mediaTypes: ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'],
  since: new Date('2024-01-01'),
  until: '2024-12-31',
  limit: 10,
  apiVersion: 'v25.0',
});

// Get individual media
/* const { entry: media } = await getLiveEntry('liveInsMedias', {
  mediaId: '17862623307162462',
}); */
---

{
  error ? (
    <p>{error.message}</p>
  ) : (
    <div>
      {medias?.map((media) => {
        const { permalink, media_url, caption } = media.data;
        return (
          <a href={permalink}>
            <img src={media_url} alt={caption} />
            <p>{caption}</p>
          </a>
        );
      })}
    </div>
  )
}
```

## Configuration

### `insMediasLoader` Options

| Option (* required) | Type (default)                                                                       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fields`            | `string` ([default](https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-ins-medias/src/config.ts#L49))                                                                        | A string that specifies which Instagram media fields to fetch, and optionally additional fields from supported edges. Note:<br>- Default fields have exact types defined in the schema, any extra fields you add will be typed as `unknown`.<br>- You can [provide your own schema](https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema), or import and extend `InsMediaSchema`, to validate the data and generate TypeScript types for your collection.<br>- To fetch edge fields, include them in the format `edge{field1,field2}`.<br>Ref: [Fields reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media#fields)、[edges Edges reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media#edges) |
| `mediaTypes`        | `('IMAGE' \| 'VIDEO' \| 'CAROUSEL_ALBUM')[]`(default: `['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM']`) | Filter by media type. If not specified, all media types will be loaded.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `since`             | `Date \| string \| number`                                                           | Only load medias after this date. It must be a valid Date or a value convertible by [`new Date()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date#parameters).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `until`             | `Date \| string \| number`                                                           | Only load medias before this date. It must be a valid Date or a value convertible by [`new Date()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date#parameters).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `limit`             | `number`                                                                             | Maximum number of media items to load.<br>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `apiVersion`        | `string` (`"v25.0"`)                                                                 | The API version to use for the Instagram API.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `instagramToken`    | `string`                                                                             | You need to [get an access token](https://developers.facebook.com/apps) that ensures the loader can access the Instagram API with Instagram Login. Defaults to `INSTAGRAM_TOKEN` via `import.meta.env`. **If configured here, keep confidential and avoid public exposure.** See [how to get one](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/get-started#get-an-access-token) and [configure env vars in an Astro project](https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables).                                                                                                                   |

### `liveInsMediasLoader` Options

| Option (* required) | Type (default)                                                                                                               | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fields`            | `string` ([default](https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-ins-medias/src/config.ts#L49)) | A string that specifies which Instagram media fields to fetch, and optionally additional fields from supported edges. Note:<br>- Default fields have exact types defined in the schema, any extra fields you add will be typed as `unknown`.<br>- You can [provide your own schema](https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema), or import and extend `InsMediaSchema`, to validate the data and generate TypeScript types for your collection.<br>- To fetch edge fields, include them in the format `edge{field1,field2}`.<br>Ref: [Fields reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media#fields)、[edges Edges reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media#edges) |
| `apiVersion`        | `string` (`"v25.0"`)                                                                                                         | The API version to use for the Instagram API.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `instagramToken`    | `string`                                                                                                                     | You need to [get an access token](https://developers.facebook.com/apps) that ensures the loader can access the Instagram API with Instagram Login. Defaults to `INSTAGRAM_TOKEN` via `getSecret()`. **If configured here, keep confidential and avoid public exposure.** See [how to get one](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/get-started#get-an-access-token) and [configure env vars in an Astro project](https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables). Note: Access tokens from the App Dashboard are are **valid for 60 days**.                                                                                                                  |

### `liveInsMediasLoader` Collection Filters

| Option (* required) | Type (default)                                                                                                               | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fields`            | `string` ([default](https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-ins-medias/src/config.ts#L49)) | A string that specifies which Instagram media fields to fetch, and optionally additional fields from supported edges. Note:<br>- Default fields have exact types defined in the schema, any extra fields you add will be typed as `unknown`.<br>- You can [provide your own schema](https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema), or import and extend `InsMediaSchema`, to validate the data and generate TypeScript types for your collection.<br>- To fetch edge fields, include them in the format `edge{field1,field2}`.<br>Ref: [Fields reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media#fields)、[edges Edges reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media#edges) |
| `mediaTypes`        | `('IMAGE' \| 'VIDEO' \| 'CAROUSEL_ALBUM')[]`(default: `['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM']`)                                | Filter by media type. If not specified, all media types will be loaded.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `since`             | `Date \| string \| number`                                                                                                   | Only load medias after this date. It must be a valid Date or a value convertible by [`new Date()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date#parameters).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `until`             | `Date \| string \| number`                                                                                                   | Only load medias before this date. It must be a valid Date or a value convertible by [`new Date()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date#parameters).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `limit`             | `number`                                                                                                                     | Maximum number of media items to load.<br>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

### `liveInsMediasLoader` Entry Filters

| Option (* required) | Type (default)                                                                                                               | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mediaId`*         | `number`                                                                                                                     | The ID of the media item.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `fields`            | `string` ([default](https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-ins-medias/src/config.ts#L49)) | A string that specifies which Instagram media fields to fetch, and optionally additional fields from supported edges. Note:<br>- Default fields have exact types defined in the schema, any extra fields you add will be typed as `unknown`.<br>- You can [provide your own schema](https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema), or import and extend `InsMediaSchema`, to validate the data and generate TypeScript types for your collection.<br>- To fetch edge fields, include them in the format `edge{field1,field2}`.<br>Ref: [Fields reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media#fields)、[edges Edges reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media#edges) |

## Schema

The collection entries use the following Zod schema:

```ts
const InsMediaSchema = z
  .object({
    id: z.string(),
    caption: z.string(),
    comments_count: z.number().int(),
    like_count: z.number().int(),
    media_product_type: z.enum(['AD', 'FEED', 'STORY', 'REELS']),
    media_type: z.enum(['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM']),
    media_url: z.string().url(),
    permalink: z.string().url(),
    timestamp: z.coerce.date(),
    children: z.object({
      data: z.array(
        z
          .object({
            id: z.string(),
            media_type: z.enum(['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM']),
            media_url: z.string().url(),
          })
          .partial()
          .required({ id: true })
          .catchall(z.unknown())
      ),
    }),
    comments: z.object({
      data: z.array(
        z
          .object({
            id: z.string(),
            username: z.string(),
            text: z.string(),
            timestamp: z.coerce.date(),
          })
          .partial()
          .required({ id: true })
          .catchall(z.unknown())
      ),
    }),
  })
  .partial()
  .required({ id: true })
  .catchall(z.unknown())
```

Astro uses these schemas to generate TypeScript interfaces for autocompletion and type safety. When [customizing the collection schema](https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema), keep it compatible with the loader’s built-in Zod schema to avoid errors.

> [!TIP]
> `InsMediaSchema` is exported from both `astro-loader-ins-medias` and `astro-loader-ins-medias/live`. The default `fields` value is a feed-focused subset, not the full Instagram Media field list. If you request extra fields, extend the schema so Astro can infer their types.
>
> ```ts
> import { defineCollection, z } from 'astro:content'
> import { insMediasLoader, InsMediaSchema } from 'astro-loader-ins-medias'
>
> const insMedias = defineCollection({
>   loader: insMediasLoader({
>     fields: 'id,permalink,caption,media_url,thumbnail_url,username,timestamp',
>   }),
>   schema: InsMediaSchema.extend({
>     thumbnail_url: z.string().url().optional(),
>     username: z.string().optional(),
>   }),
> })
>
> export const collections = { insMedias }
> ```

## Live Collections Error Handling

Live loaders may fail due to network, API, or validation errors. [Handle these errors](https://docs.astro.build/en/reference/experimental-flags/live-content-collections/#error-handling) in your components. The live loader also returns specific error codes:

- `INVALID_FILTER`: Missing required filter options.
- `COLLECTION_LOAD_ERROR`: Failed to load collection.
- `ENTRY_LOAD_ERROR`: Failed to load individual entry.
- `INS_API_QUERY_ERROR`: Failed to query Instagram API.

## Changelog

See [CHANGELOG.md](https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-ins-medias/CHANGELOG.md) for the change history of this loader.

## Contribution

If you see any errors or room for improvement, feel free to open an [issues](https://github.com/lin-stephanie/astro-loaders/issues) or [pull request](https://github.com/lin-stephanie/astro-loaders/pulls) . Thank you in advance for contributing! ❤️

<!-- Badges -->

[version-badge]: https://img.shields.io/npm/v/astro-loader-ins-medias?label=release&style=flat&colorA=080f12&colorB=f87171
[version-link]: https://www.npmjs.com/package/astro-loader-ins-medias
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=f87171
[jsdocs-href]: https://www.jsdocs.io/package/astro-loader-ins-medias
[npm-downloads-src]: https://img.shields.io/npm/dm/astro-loader-ins-medias?style=flat&colorA=080f12&colorB=f87171
[npm-downloads-href]: https://npmjs.com/package/astro-loader-ins-medias
