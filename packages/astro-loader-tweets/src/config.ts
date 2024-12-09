import { z } from 'astro/zod'
import type { Tweetv2FieldsParams } from 'twitter-api-v2'

export const defaultConfig = {
  removeTrailingUrls: true,
  urlTextType: 'display-url' as const,
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
   * The X app-only Bearer Token for authentication.
   *
   * @remarks This is optional; by default, it reads from the `X_TOKEN` environment variable.
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
    // 'edit_history_tweet_ids', /* (default, lib missing) */
    'attachments',
    'author_id',
    // 'context_annotations',
    'conversation_id',
    'created_at',
    // 'edit_controls',
    'entities',
    'geo' /* (lib extra) */,
    'in_reply_to_user_id',
    'lang',
    // 'non_public_metrics', /* (requires user context auth) */
    // 'note_tweet', /* (lib extra) */
    // 'organic_metrics',  /* (requires user context auth) */
    // 'possibly_sensitive',
    // 'promoted_metrics',  /* (requires user context auth) */
    'public_metrics',
    'referenced_tweets',
    // 'reply_settings',
    'source' /* (lib extra) */,
    // 'withheld',
  ],
  'user.fields': [
    'id',
    'name',
    'username',
    'connection_status',
    'created_at',
    'description',
    'entities',
    // 'location',
    // 'most_recent_tweet_id', /* (lib extra) */
    // 'pinned_tweet_id',
    'profile_image_url',
    // 'protected',
    'public_metrics',
    'url',
    // 'verified', /* (deprecated in V2) */
    // 'verified_type', /* (lib extra) */
    // 'withheld',
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
    // 'non_public_metrics',
    // 'organic_metrics',
    // 'promoted_metrics',
  ],
  'poll.fields': [
    'id',
    'options',
    'duration_minutes',
    'end_datetime',
    'voting_status',
  ],
}
