import { z } from 'astro/zod'
import { toUnixTimestamp } from './utils.js'

export const DEFAULT_BASE_URL = 'https://graph.instagram.com'

const DateLike = z
  .union([z.date(), z.string(), z.number()])
  .transform((v) => (v instanceof Date ? v : new Date(v)))
  .refine((d) => !Number.isNaN(d.getTime()), {
    message:
      '`since`/`until` must be a valid Date or a value convertible by `new Date()`. See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date#parameters',
  })

const AllConfigSchema = z.object({
  /**
   * The ID of the media item.
   */
  mediaId: z.number(),

  /**
   * A string that specifies which Instagram media fields to fetch,
   * and optionally additional fields from supported edges.
   *
   * Note:
   *
   * - Default fields have exact types defined in the schema, any extra fields you add will be typed as `unknown`.
   * - You can provide your own {@link https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema `schema`}, or import and extend `InsMediaSchema`,
   *   to validate the data and generate TypeScript types for your collection.
   * - To fetch edge fields, include them in the format `edge{field1,field2}`.
   *
   * @see
   * - {@link https://developers.facebook.com/docs/instagram-platform/reference/instagram-media#fields Fields reference}
   * - {@link https://developers.facebook.com/docs/instagram-platform/reference/instagram-media#edges Edges reference}
   *
   * @type {string}
   * @default "id,media_product_type,media_type,caption,permalink,media_url,like_count,timestamp,children{media_type,media_url},comments{id,username,text,timestamp}"
   *
   * @example
   * // Basic fields only
   * "id,caption,media_url,timestamp"
   *
   * @example
   * // With edge expansion (comments)
   * "id,media_type,media_url,comments{id,username,text,timestamp}"
   */
  fields: z
    .string()
    .default(
      'id,media_product_type,media_type,caption,permalink,media_url,like_count,timestamp,children{media_type,media_url},comments{id,username,text,timestamp}'
    ),

  /**
   * Filter by media type. If not specified, all media types will be loaded.
   *
   * @default
   * ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM']
   */
  mediaTypes: z
    .array(
      z.enum(['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'], {
        message:
          '`mediaTypes` must be one of `IMAGE`, `VIDEO`, or `CAROUSEL_ALBUM`',
      })
    )
    .min(1, '`mediaTypes` must contain at least one media type')
    .default(['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM']),

  /**
   * Only load medias after this date.
   */
  since: DateLike.transform(toUnixTimestamp).optional(),

  /**
   * Only load medias before this date.
   */
  until: DateLike.transform(toUnixTimestamp).optional(),

  /**
   * Maximum number of media items to load.
   */
  limit: z
    .number()
    .int()
    .gte(1, '`limit` must be a positive integer')
    .optional(),

  /**
   * The API version to use for the Instagram API.
   *
   * @default "v23.0"
   */
  apiVersion: z.string().startsWith('v').default('v23.0'),

  /**
   * You need to {@link https://developers.facebook.com/apps get an access token} that
   * ensures the loader can access the Instagram API with Instagram Login.
   *
   * This is optional; by default, it reads from the `INSTAGRAM_TOKEN` environment variable.
   * You may also configure it directly here (not recommended; if you do, ensure it is not exposed
   * in public code repositories).
   *
   * Note: Access tokens from the App Dashboard are long-lived and are **valid for 60 days**.
   *
   * @see
   * - {@link https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/get-started#get-an-access-token Get an access token}
   * - {@link https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables How to store token in Astro project environment variables}
   */
  instagramToken: z.string().optional(),
})

/* Build-time Loader */
export const InsMediasLoaderConfigSchema = AllConfigSchema.pick({
  fields: true,
  mediaTypes: true,
  since: true,
  until: true,
  limit: true,
  apiVersion: true,
  instagramToken: true,
}).refine((o) => !(o.since != null && o.until != null) || o.since <= o.until, {
  message: '`since` must be earlier than `until`',
})
export type InsMediasLoaderUserConfig = z.input<
  typeof InsMediasLoaderConfigSchema
>

/* Live Loader */
export const LiveInsMediasLoaderUserConfigSchema = AllConfigSchema.pick({
  fields: true,
  apiVersion: true,
  instagramToken: true,
})
export type LiveInsMediasLoaderUserConfig = z.input<
  typeof LiveInsMediasLoaderUserConfigSchema
>

export const LiveCollectionFilterSchema = AllConfigSchema.pick({
  fields: true,
  mediaTypes: true,
  since: true,
  until: true,
  limit: true,
}).refine((o) => (o.since && o.until ? o.since <= o.until : true), {
  message: '`since` must be earlier than `until`',
})
export type LiveCollectionFilter = z.input<typeof LiveCollectionFilterSchema>

export const LiveEntryFilterSchema = AllConfigSchema.pick({
  mediaId: true,
  fields: true,
})
export type LiveEntryFilter = z.input<typeof LiveEntryFilterSchema>
