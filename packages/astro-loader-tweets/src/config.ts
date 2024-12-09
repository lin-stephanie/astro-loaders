import { z } from 'astro/zod'
import type { Tweetv2FieldsParams } from 'twitter-api-v2'

export const defaultConfig = {
  removeTrailingUrls: true,
  urlTextType: 'display-url' as const,
  newlineHandling: 'none' as const,
}

export const TweetsLoaderConfigSchema = z.object({
  /**
   * An array of Tweet IDs to fetch content for.
   */
  tweetIds: z.array(z.string()),

  /**
   * Whether to remove trailing URLs from the tweet text in the generated `text_html` and `text_markdown`,
   * typically used for views or referenced tweets.
   *
   * @default true
   */
  removeTrailingUrls: z.boolean().default(defaultConfig.removeTrailingUrls),

  /**
   * The type of text to display for links when generating `text_html` and `text_markdown`:
   * - `'domain-path'`: Displays the link's domain and path.
   * - `'display-url'`: Uses the link text as shown in the tweet.
   *
   * @default 'display-url'
   */
  linkTextType: z
    .enum(['domain-path', 'display-url'])
    .default(defaultConfig.urlTextType),

  /**
   * The way for processing `\n` in `text_html` generation:
   * - `'none'`: Keep as is.
   * - `'break'`: Replace `\n` with `<br>`.
   * - `'paragraph'`: Wrap paragraphs with `<p>` while removing standalone `\n`.
   *
   * @default 'none'
   */
  newlineHandling: z
    .enum(['none', 'break', 'paragraph'])
    .default(defaultConfig.newlineHandling),

  /**
   * The X app-only Bearer Token for authentication.
   *
   * This is optional; by default, it reads from the `X_TOKEN` environment variable.
   * You may also configure it directly here (not recommended; if you do, ensure it is not exposed
   * in public code repositories).
   *
   * @see
   * - {@link https://developer.x.com/en/docs/authentication/oauth-2-0/bearer-tokens How to create an X app-only Bearer Token}
   * - {@link https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables How to store token in Astro project environment variables}
   */
  authToken: z.string().default(import.meta.env.X_TOKEN),
})

export type TweetsLoaderUserConfig = z.input<typeof TweetsLoaderConfigSchema>

export const getTweetsApiOptions: Partial<Tweetv2FieldsParams> = {
  expansions: [
    'author_id',
    'geo.place_id',
    'attachments.media_keys',
    'attachments.poll_ids',
  ],
  'tweet.fields': [
    'id',
    'text',
    'attachments',
    'author_id',
    'conversation_id',
    'created_at',
    'entities',
    'geo' /* (lib extra) */,
    'in_reply_to_user_id',
    'lang',
    'public_metrics',
    'referenced_tweets',
  ],
  'user.fields': [
    'id',
    'name',
    'username',
    'connection_status',
    'created_at',
    'description',
    'entities',
    'profile_image_url',
    'public_metrics',
    'url',
  ],
  'place.fields': [
    'id',
    'full_name',
    'contained_within',
    'country',
    'country_code',
    'geo',
    'name',
    'place_type',
  ],
  'media.fields': [
    'media_key',
    'type',
    'url',
    'preview_image_url',
    'height',
    'width',
    'alt_text',
    'duration_ms',
    'public_metrics',
    'variants',
  ],
  'poll.fields': [
    'id',
    'options',
    'duration_minutes',
    'end_datetime',
    'voting_status',
  ],
}
