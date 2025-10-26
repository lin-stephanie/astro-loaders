import { z } from 'astro/zod'

// https://developers.facebook.com/docs/instagram-platform/reference/instagram-media#fields
export const InsMediaSchema = z
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
          .passthrough()
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
          .passthrough()
      ),
    }),
  })
  .partial()
  .required({ id: true })
  .passthrough()

export type InsMedia = z.infer<typeof InsMediaSchema>
