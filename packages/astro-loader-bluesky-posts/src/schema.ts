import { z } from 'astro/zod'

const EmbedVideoSchema = z.object({
  $type: z.literal('app.bsky.embed.video'),
  alt: z.string().optional(),
  aspectRatio: z
    .object({
      height: z.number(),
      width: z.number(),
    })
    .optional(),
  video: z.object({
    $type: z.literal('blob'),
    ref: z.object({ $link: z.string() }),
    mimeType: z.string(),
    size: z.number(),
  }),
})

const EmbedVideoViewSchema = z.object({
  $type: z.literal('app.bsky.embed.video#view'),
  cid: z.string(),
  playlist: z.string(),
  thumbnail: z.string().optional(),
  alt: z.string().optional(),
  aspectRatio: z
    .object({
      width: z.number(),
      height: z.number(),
    })
    .optional(),
})

const EmbedExternalSchema = z.object({
  $type: z.literal('app.bsky.embed.external'),
  external: z.object({
    uri: z.string().url(),
    title: z.string().optional(),
    description: z.string().optional(),
    thumb: z
      .object({
        $type: z.literal('blob'),
        ref: z.object({ $link: z.string() }),
        mimeType: z.string(),
        size: z.number(),
      })
      .optional(),
  }),
})

const EmbedExternalViewSchema = z.object({
  $type: z.literal('app.bsky.embed.external#view'),
  external: z.object({
    uri: z.string().url(),
    title: z.string().optional(),
    description: z.string().optional(),
    thumb: z.string().url().optional(),
  }),
})

const EmbedRecordSchema = z.object({
  $type: z.literal('app.bsky.embed.record'),
  record: z.object({
    uri: z.string(),
    cid: z.string(),
  }),
})

const EmbedImagesSchema = z.object({
  $type: z.literal('app.bsky.embed.images'),
  images: z.array(
    z.object({
      alt: z.string(),
      aspectRatio: z
        .object({
          height: z.number(),
          width: z.number(),
        })
        .optional(),
      image: z.object({
        $type: z.literal('blob'),
        ref: z.object({ $link: z.string() }),
        mimeType: z.string(),
        size: z.number(),
      }),
    })
  ),
})

const EmbedImagesViewSchema = z.object({
  $type: z.literal('app.bsky.embed.images#view'),
  images: z.array(
    z.object({
      thumb: z.string().url(),
      fullsize: z.string().url(),
      alt: z.string().optional(),
      aspectRatio: z
        .object({
          width: z.number(),
          height: z.number(),
        })
        .optional(),
    })
  ),
})

const EmbedListSchema = z.object({
  $type: z.literal('app.bsky.embed.list'),
  list: z.object({
    title: z.string(),
    items: z.array(
      z.object({
        uri: z.string(),
        label: z.string(),
      })
    ),
  }),
})

const EmbedListViewSchema = z.object({
  $type: z.literal('app.bsky.embed.list#view'),
  list: z.object({
    title: z.string(),
    items: z.array(
      z.object({
        uri: z.string(),
        label: z.string(),
      })
    ),
  }),
})

const EmbedStarterPackSchema = z.object({
  $type: z.literal('app.bsky.embed.starterPack'),
  starterPack: z.object({
    title: z.string(),
    description: z.string().optional(),
    members: z.array(
      z.object({
        did: z.string(),
        handle: z.string(),
        displayName: z.string().optional(),
        avatar: z.string().url().optional(),
      })
    ),
  }),
})

const EmbedRecordViewSchema = z.object({
  $type: z.literal('app.bsky.embed.record#view'),
  record: z.object({
    uri: z.string(),
    cid: z.string(),
    author: z.object({
      did: z.string(),
      handle: z.string(),
      displayName: z.string(),
      avatar: z.string().url().optional(),
    }),
    value: z.object({
      $type: z.string(),
      createdAt: z.string().datetime(),
      text: z.string().optional(),
    }),
    replyCount: z.number().optional(),
    repostCount: z.number().optional(),
    likeCount: z.number().optional(),
    quoteCount: z.number().optional(),
    indexedAt: z.string(),
  }),
})

const EmbedRecordWithMediaSchema = z.object({
  $type: z.literal('app.bsky.embed.recordWithMedia'),
  record: z.object({
    uri: z.string(),
    cid: z.string(),
    author: z.object({
      did: z.string(),
      handle: z.string(),
      displayName: z.string(),
      avatar: z.string().url().optional(),
    }),
    value: z.object({
      $type: z.string(),
      createdAt: z.string().datetime(),
      text: z.string().optional(),
    }),
  }),
  media: z.union([EmbedExternalSchema, EmbedImagesSchema]),
})

const EmbedRecordWithMediaViewSchema = z.object({
  $type: z.literal('app.bsky.embed.recordWithMedia#view'),
  record: z.object({
    uri: z.string(),
    cid: z.string(),
    author: z.object({
      did: z.string(),
      handle: z.string(),
      displayName: z.string(),
      avatar: z.string().url().optional(),
    }),
    value: z.object({
      $type: z.string(),
      createdAt: z.string().datetime(),
      text: z.string().optional(),
    }),
  }),
  media: z.union([EmbedExternalViewSchema, EmbedImagesViewSchema]),
})

const EmbedStarterPackViewSchema = z.object({
  $type: z.literal('app.bsky.embed.starterPack#view'),
  starterPack: z.object({
    title: z.string(),
    description: z.string().optional(),
    members: z.array(
      z.object({
        did: z.string(),
        handle: z.string(),
        displayName: z.string().optional(),
        avatar: z.string().url().optional(),
      })
    ),
  }),
})

const UnknownEmbedSchema = z
  .object({
    $type: z.string(),
  })
  .passthrough()

const EmbedSchema = z.union([
  EmbedImagesSchema,
  EmbedImagesViewSchema,
  EmbedVideoSchema,
  EmbedVideoViewSchema,
  EmbedExternalSchema,
  EmbedExternalViewSchema,
  EmbedRecordSchema,
  EmbedRecordWithMediaSchema,
  EmbedRecordViewSchema,
  EmbedRecordWithMediaViewSchema,
  EmbedListSchema,
  EmbedListViewSchema,
  EmbedStarterPackSchema,
  EmbedStarterPackViewSchema,
  UnknownEmbedSchema,
])

const PostSchema = z.object({
  uri: z.string(),
  cid: z.string(),
  author: z.object({
    did: z.string(),
    handle: z.string(),
    displayName: z.string(),
    avatar: z.string().url().optional(),
    associated: z
      .object({
        chat: z
          .object({
            allowIncoming: z.enum(['following', 'all', 'none']).optional(),
          })
          .optional(),
      })
      .optional(),
    labels: z.array(z.any()).optional(),
    createdAt: z.string().datetime(),
  }),
  record: z
    .object({
      $type: z.literal('app.bsky.feed.post'),
      createdAt: z.string().datetime(),
      langs: z.array(z.string()).optional(),
      text: z.string().optional(),
      reply: z
        .object({
          parent: z.object({
            cid: z.string(),
            uri: z.string(),
          }),
          root: z.object({
            cid: z.string(),
            uri: z.string(),
          }),
        })
        .optional(),
      embed: EmbedSchema.optional(),
      facets: z
        .array(
          z.object({
            index: z.object({
              byteStart: z.number().nonnegative(),
              byteEnd: z.number().nonnegative(),
            }),
            features: z.array(
              z.union([
                z.object({
                  $type: z.literal('app.bsky.richtext.facet#mention'),
                  did: z.string(),
                }),
                z.object({
                  $type: z.literal('app.bsky.richtext.facet#link'),
                  uri: z.string().url(),
                }),
                z.object({
                  $type: z.literal('app.bsky.richtext.facet#tag'),
                  tag: z.string(),
                }),
                z.object({}).passthrough(),
              ])
            ),
          })
        )
        .optional(),
    })
    .passthrough(),
  embed: EmbedSchema.optional(),
  replyCount: z.number().nonnegative(),
  repostCount: z.number().nonnegative(),
  likeCount: z.number().nonnegative(),
  quoteCount: z.number().nonnegative(),
  indexedAt: z.string().datetime(),
  labels: z.array(z.any()).optional(),
})

const PostViewExtendedSchema = PostSchema.and(
  z.object({
    link: z.string(),
    html: z.string(),
  })
)

const NotFoundPostSchema = z.object({
  $type: z.literal('app.bsky.feed.defs#notFoundPost').optional(),
  uri: z.string(),
  notFound: z.literal(true),
})

const BlockedPostSchema = z.object({
  $type: z.literal('app.bsky.feed.defs#blockedPost').optional(),
  uri: z.string(),
  blocked: z.literal(true),
})

const PostWithThreadViewSchema = z.object({
  uri: z.string(),
  $type: z.literal('app.bsky.feed.defs#threadViewPost').optional(),
  post: PostViewExtendedSchema,
  parent: z
    .union([
      z.lazy(() => ThreadViewPostSchema),
      NotFoundPostSchema,
      BlockedPostSchema,
    ])
    .optional(),
  replies: z
    .array(
      z.union([
        z.lazy(() => ThreadViewPostSchema),
        NotFoundPostSchema,
        BlockedPostSchema,
      ])
    )
    .optional(),
})

interface ThreadViewPost {
  $type?: 'app.bsky.feed.defs#threadViewPost'
  post: z.infer<typeof PostViewExtendedSchema>
  parent?:
    | ThreadViewPost
    | z.infer<typeof NotFoundPostSchema>
    | z.infer<typeof BlockedPostSchema>
  replies?: (
    | ThreadViewPost
    | z.infer<typeof NotFoundPostSchema>
    | z.infer<typeof BlockedPostSchema>
  )[]
}

const ThreadViewPostSchema: z.ZodType<ThreadViewPost> =
  PostWithThreadViewSchema.omit({
    uri: true,
  })

const PostWithThreadViewExtendedSchema = PostWithThreadViewSchema.extend({
  replies: z
    .union([
      z.array(
        z.union([
          z.lazy(() => ThreadViewPostSchema),
          NotFoundPostSchema,
          BlockedPostSchema,
        ])
      ),
      z.array(PostViewExtendedSchema),
    ])
    .optional(),
})

export { PostViewExtendedSchema, PostWithThreadViewExtendedSchema }
