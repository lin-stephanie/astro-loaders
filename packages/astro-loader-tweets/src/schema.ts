import { z } from 'astro/zod'

// tweet
export const TweetV2Schema = z.object({
  id: z.string(),
  text: z.string(),
  edit_history_tweet_ids: z.array(z.string()),
  attachments: z
    .object({
      media_keys: z.array(z.string()).optional(),
      poll_ids: z.array(z.string()).optional(),
    })
    .optional(),
  author_id: z.string().optional(),
  conversation_id: z.string().optional(),
  created_at: z.string().optional(),
  entities: z
    .object({
      annotations: z
        .array(
          z.object({
            start: z.number(),
            end: z.number(),
            probability: z.number(),
            type: z.string(),
            normalized_text: z.string(),
          })
        )
        .optional(),
      urls: z
        .array(
          z.object({
            start: z.number(),
            end: z.number(),
            url: z.string(),
            expanded_url: z.string(),
            display_url: z.string(),
            unwound_url: z.string().optional(),
            title: z.string().optional(),
            description: z.string().optional(),
            status: z.union([z.string(), z.number()]).optional(),
            // mismatch field
            media_key: z.string().optional(),
            images: z
              .array(
                z.object({
                  url: z.string(),
                  width: z.number(),
                  height: z.number(),
                })
              )
              .optional(),
          })
        )
        .optional(),
      hashtags: z
        .array(
          z.object({
            start: z.number(),
            end: z.number(),
            tag: z.string(),
          })
        )
        .optional(),
      cashtags: z
        .array(
          z.object({
            start: z.number(),
            end: z.number(),
            tag: z.string(),
          })
        )
        .optional(),
      mentions: z
        .array(
          z.object({
            start: z.number(),
            end: z.number(),
            username: z.string(),
            id: z.string(),
          })
        )
        .optional(),
    })
    .optional(),
  geo: z
    .object({
      coordinates: z.object({
        type: z.string(),
        coordinates: z.tuple([z.number(), z.number()]).nullable(),
      }),
      place_id: z.string(),
    })
    .optional(),
  in_reply_to_user_id: z.string().optional(),
  lang: z.string().optional(),
  public_metrics: z
    .object({
      retweet_count: z.number(),
      reply_count: z.number(),
      like_count: z.number(),
      quote_count: z.number(),
      impression_count: z.number(),
      bookmark_count: z.number().optional(),
    })
    .optional(),
  referenced_tweets: z
    .array(
      z
        .object({
          type: z.union([
            z.literal('retweeted'),
            z.literal('quoted'),
            z.literal('replied_to'),
          ]),
          id: z.string(),
        })
        .optional()
    )
    .optional(),
  source: z.string().optional(),
})

export const TweetV2WithRichContentSchema = TweetV2Schema.extend({
  text_html: z.string(),
  text_markdown: z.string(),
  view_type: z.enum(['none', 'media', 'link']),
  url_for_link_view: z.string().optional(),
})

// user
const EntitySchema = z.object({
  start: z.number(),
  end: z.number(),
})

const UrlEntitySchema = EntitySchema.extend({
  url: z.string(),
  expanded_url: z.string(),
  display_url: z.string(),
})

const HashtagEntitySchema = EntitySchema.extend({
  // mismatch field
  tag: z.string().optional(),
  hashtag: z.string().optional(),
})

const CashtagEntitySchema = EntitySchema.extend({
  // mismatch field
  tag: z.string().optional(),
  cashtag: z.string().optional(),
})

const MentionEntitySchema = EntitySchema.extend({
  username: z.string().optional(),
})

const UserV2Schema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  connection_status: z.array(z.string()).optional(),
  created_at: z.string().optional(),
  description: z.string().optional(),
  entities: z
    .object({
      url: z
        .object({
          urls: z.array(UrlEntitySchema),
        })
        .optional(),
      description: z.object({
        urls: z.array(UrlEntitySchema).optional(),
        hashtags: z.array(HashtagEntitySchema).optional(),
        cashtags: z.array(CashtagEntitySchema).optional(),
        mentions: z.array(MentionEntitySchema).optional(),
      }),
    })
    .optional(),
  profile_image_url: z.string().optional(),
  public_metrics: z
    .object({
      followers_count: z.number().optional(),
      following_count: z.number().optional(),
      tweet_count: z.number().optional(),
      listed_count: z.number().optional(),
      like_count: z.number().optional(),
      // mismatch field
      media_count: z.number().optional(),
    })
    .optional(),
  url: z.string().optional(),
})

// place
const PlaceV2Schema = z.object({
  id: z.string(),
  full_name: z.string(),
  contained_within: z.array(z.string()).optional(),
  country: z.string().optional(),
  country_code: z.string().optional(),
  geo: z
    .object({
      type: z.string(),
      bbox: z.array(z.number()),
      properties: z.any(),
    })
    .optional(),
  name: z.string().optional(),
  place_type: z.string().optional(),
})

// media
const MediaVariantsV2Schema = z.object({
  bit_rate: z.number().optional(),
  content_type: z.union([
    z.literal('video/mp4'),
    z.literal('application/x-mpegURL'),
    z.string(),
  ]),
  url: z.string(),
})

const MediaObjectV2Schema = z.object({
  media_key: z.string(),
  type: z.union([
    z.literal('video'),
    z.literal('animated_gif'),
    z.literal('photo'),
    z.string(),
  ]),
  url: z.string().optional(),
  preview_image_url: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  alt_text: z.string().optional(),
  duration_ms: z.number().optional(),
  public_metrics: z
    .object({
      view_count: z.number(),
    })
    .optional(),
  variants: z.array(MediaVariantsV2Schema).optional(),
})

// poll
const PollV2Schema = z.object({
  id: z.string(),
  options: z.array(
    z.object({
      position: z.number(),
      label: z.string(),
      votes: z.number(),
    })
  ),
  duration_minutes: z.number().optional(),
  end_datetime: z.string().optional(),
  voting_status: z.string().optional(),
})

const ResIncludesSchema = z.object({
  users: z.array(UserV2Schema).optional(),
  places: z.array(PlaceV2Schema).optional(),
  media: z.array(MediaObjectV2Schema).optional(),
  polls: z.array(PollV2Schema).optional(),
})

export const TweetSchema = z.object({
  id: z.string(),
  tweet: TweetV2WithRichContentSchema,
  user: z.union([UserV2Schema, z.null()]),
  place: z.union([PlaceV2Schema, z.null()]),
  media: z.union([z.array(MediaObjectV2Schema), z.null()]),
  poll: z.union([z.array(PollV2Schema), z.null()]),
})

export type ResData = z.infer<typeof TweetV2Schema>
export type ResIncludes = z.infer<typeof ResIncludesSchema>
export type Tweet = z.infer<typeof TweetSchema>
