import { z } from 'astro/zod'

/* author - AppBskyActorDefs.ProfileViewBasic */
const labelSchema = z.record(z.unknown()).and(
  z.object({
    ver: z.number().optional(),
    src: z.string(),
    uri: z.string(),
    cid: z.string().optional(),
    val: z.string(),
    neg: z.boolean().optional(),
    cts: z.string(),
    exp: z.string().optional(),
    sig: z.instanceof(Uint8Array).optional(),
  })
)

const listPurposeSchema = z.union([
  z.literal('app.bsky.graph.defs#modlist'),
  z.literal('app.bsky.graph.defs#curatelist'),
  z.literal('app.bsky.graph.defs#referencelist'),
  z.string().and(z.object({})),
])

const listViewerStateSchema = z.record(z.unknown()).and(
  z.object({
    muted: z.boolean().optional(),
    blocked: z.string().optional(),
  })
)

const listViewBasicSchema = z.record(z.unknown()).and(
  z.object({
    uri: z.string(),
    cid: z.string(),
    name: z.string(),
    purpose: listPurposeSchema,
    avatar: z.string().optional(),
    listItemCount: z.number().optional(),
    labels: z.array(labelSchema).optional(),
    viewer: listViewerStateSchema.optional(),
    indexedAt: z.string().optional(),
  })
)

const profileAssociatedChatSchema = z.record(z.unknown()).and(
  z.object({
    allowIncoming: z.union([
      z.literal('all'),
      z.literal('none'),
      z.literal('following'),
      z.string().and(z.object({})),
    ]),
  })
)

const profileAssociatedSchema = z.record(z.unknown()).and(
  z.object({
    lists: z.number().optional(),
    feedgens: z.number().optional(),
    starterPacks: z.number().optional(),
    labeler: z.boolean().optional(),
    chat: profileAssociatedChatSchema.optional(),
  })
)

interface ProfileViewBasic {
  did: string
  handle: string
  displayName?: string
  avatar?: string
  associated?: z.infer<typeof profileAssociatedSchema>
  viewer?: z.infer<typeof viewerStateSchema>
  labels?: z.infer<typeof labelSchema>[]
  createdAt?: string
  [k: string]: unknown
}

interface KnownFollowers {
  count: number
  followers: ProfileViewBasic[]
  [k: string]: unknown
}

const knownFollowersSchema: z.ZodType<KnownFollowers> = z
  .record(z.unknown())
  .and(
    z.object({
      count: z.number(),
      followers: z.lazy(() => profileViewBasicSchema.array()),
    })
  )

const viewerStateSchema = z.record(z.unknown()).and(
  z.object({
    muted: z.boolean().optional(),
    mutedByList: listViewBasicSchema.optional(),
    blockedBy: z.boolean().optional(),
    blocking: z.string().optional(),
    blockingByList: listViewBasicSchema.optional(),
    following: z.string().optional(),
    followedBy: z.string().optional(),
    knownFollowers: knownFollowersSchema.optional(),
  })
)

const profileViewBasicSchema = z.record(z.unknown()).and(
  z.object({
    did: z.string(),
    handle: z.string(),
    displayName: z.string().optional(),
    avatar: z.string().optional(),
    associated: profileAssociatedSchema.optional(),
    viewer: viewerStateSchema.optional(),
    labels: z.array(labelSchema).optional(),
    createdAt: z.string().optional(),
  })
)

/* embed */
const aspectRatioSchema = z.record(z.unknown()).and(
  z.object({
    width: z.number(),
    height: z.number(),
  })
)

/* AppBskyEmbedImages.View */
const viewImageSchema = z.record(z.unknown()).and(
  z.object({
    thumb: z.string(),
    fullsize: z.string(),
    alt: z.string(),
    aspectRatio: aspectRatioSchema.optional(),
  })
)

const embedImagesViewSchema = z.record(z.unknown()).and(
  z.object({
    images: z.array(viewImageSchema),
  })
)

/* AppBskyEmbedVideo.View */
const embedVideoViewSchema = z.record(z.unknown()).and(
  z.object({
    cid: z.string(),
    playlist: z.string(),
    thumbnail: z.string().optional(),
    alt: z.string().optional(),
    aspectRatio: aspectRatioSchema.optional(),
  })
)

/* AppBskyEmbedExternal.View */
const viewExternalSchema = z.record(z.unknown()).and(
  z.object({
    uri: z.string(),
    title: z.string(),
    description: z.string(),
    thumb: z.string().optional(),
  })
)

const embedExternalViewSchema = z.record(z.unknown()).and(
  z.object({
    external: viewExternalSchema,
  })
)

/* AppBskyEmbedRecord.View */
const byteSliceSchema = z.record(z.unknown()).and(
  z.object({
    byteStart: z.number(),
    byteEnd: z.number(),
  })
)

const mentionSchema = z.record(z.unknown()).and(
  z.object({
    did: z.string(),
  })
)

const linkSchema = z.record(z.unknown()).and(
  z.object({
    uri: z.string(),
  })
)

const tagSchema = z.record(z.unknown()).and(
  z.object({
    tag: z.string(),
  })
)

const mainSchema = z.record(z.unknown()).and(
  z.object({
    index: byteSliceSchema,
    features: z.array(
      z.union([
        mentionSchema,
        linkSchema,
        tagSchema,
        z.record(z.unknown()).and(
          z.object({
            $type: z.string(),
          })
        ),
      ])
    ),
  })
)

const profileViewSchema = z.record(z.unknown()).and(
  z.object({
    did: z.string(),
    handle: z.string(),
    displayName: z.string().optional(),
    description: z.string().optional(),
    avatar: z.string().optional(),
    associated: profileAssociatedSchema.optional(),
    indexedAt: z.string().optional(),
    createdAt: z.string().optional(),
    labels: z.array(labelSchema).optional(),
  })
)

const labelerViewerStateSchema = z.record(z.unknown()).and(
  z.object({
    like: z.string().optional(),
  })
)

const listViewSchema = z.record(z.unknown()).and(
  z.object({
    uri: z.string(),
    cid: z.string(),
    creator: profileViewSchema,
    name: z.string(),
    purpose: listPurposeSchema,
    description: z.string().optional(),
    descriptionFacets: z.array(mainSchema).optional(),
    avatar: z.string().optional(),
    listItemCount: z.number().optional(),
    labels: z.array(labelSchema).optional(),
    viewer: listViewerStateSchema.optional(),
    indexedAt: z.string(),
  })
)

const labelerViewSchema = z.record(z.unknown()).and(
  z.object({
    uri: z.string(),
    cid: z.string(),
    creator: profileViewSchema,
    likeCount: z.number().optional(),
    viewer: labelerViewerStateSchema.optional(),
    indexedAt: z.string(),
    labels: z.array(labelSchema).optional(),
  })
)

const starterPackViewBasicSchema = z.record(z.unknown()).and(
  z.object({
    uri: z.string(),
    cid: z.string(),
    record: z.object({}),
    creator: profileViewBasicSchema,
    listItemCount: z.number().optional(),
    joinedWeekCount: z.number().optional(),
    joinedAllTimeCount: z.number().optional(),
    labels: z.array(labelSchema).optional(),
    indexedAt: z.string(),
  })
)

const blockedAuthorSchema = z.record(z.unknown()).and(
  z.object({
    did: z.string(),
    viewer: viewerStateSchema.optional(),
  })
)

const generatorViewerStateSchema = z.record(z.unknown()).and(
  z.object({
    like: z.string().optional(),
  })
)

const generatorViewSchema = z.record(z.unknown()).and(
  z.object({
    uri: z.string(),
    cid: z.string(),
    did: z.string(),
    creator: profileViewSchema,
    displayName: z.string(),
    description: z.string().optional(),
    descriptionFacets: z.array(mainSchema).optional(),
    avatar: z.string().optional(),
    likeCount: z.number().optional(),
    acceptsInteractions: z.boolean().optional(),
    labels: z.array(labelSchema).optional(),
    viewer: generatorViewerStateSchema.optional(),
    indexedAt: z.string(),
  })
)

interface ViewRecord {
  uri: string
  cid: string
  author: ProfileViewBasic
  value: {}
  labels?: z.infer<typeof labelSchema>[]
  replyCount?: number
  repostCount?: number
  likeCount?: number
  quoteCount?: number
  embeds?: (
    | z.infer<typeof embedImagesViewSchema>
    | z.infer<typeof embedVideoViewSchema>
    | z.infer<typeof embedExternalViewSchema>
    | z.infer<typeof embedRecordViewSchema>
    | z.infer<typeof embedRecordWithMediaViewSchema>
    | { $type: string; [k: string]: unknown }
  )[]
  indexedAt: string
  [k: string]: unknown
}

const viewRecordSchema: z.ZodType<ViewRecord> = z.record(z.unknown()).and(
  z.object({
    uri: z.string(),
    cid: z.string(),
    author: profileViewBasicSchema,
    value: z.object({}),
    labels: z.array(labelSchema).optional(),
    replyCount: z.number().optional(),
    repostCount: z.number().optional(),
    likeCount: z.number().optional(),
    quoteCount: z.number().optional(),
    embeds: z
      .array(
        z.union([
          embedImagesViewSchema,
          embedVideoViewSchema,
          embedExternalViewSchema,
          z.lazy(() => embedRecordViewSchema),
          z.lazy(() => embedRecordWithMediaViewSchema),
          z.record(z.unknown()).and(
            z.object({
              $type: z.string(),
            })
          ),
        ])
      )
      .optional(),
    indexedAt: z.string(),
  })
)

const viewNotFoundSchema = z.record(z.unknown()).and(
  z.object({
    uri: z.string(),
    notFound: z.literal(true),
  })
)

const viewBlockedSchema = z.record(z.unknown()).and(
  z.object({
    uri: z.string(),
    blocked: z.literal(true),
    author: blockedAuthorSchema,
  })
)

const viewDetachedSchema = z.record(z.unknown()).and(
  z.object({
    uri: z.string(),
    detached: z.literal(true),
  })
)

const embedRecordViewSchema = z.record(z.unknown()).and(
  z.object({
    record: z.union([
      viewRecordSchema,
      viewNotFoundSchema,
      viewBlockedSchema,
      viewDetachedSchema,
      generatorViewSchema,
      listViewSchema,
      labelerViewSchema,
      starterPackViewBasicSchema,
      z.record(z.unknown()).and(
        z.object({
          $type: z.string(),
        })
      ),
    ]),
  })
)

/* AppBskyEmbedRecordWithMedia.View */
const embedRecordWithMediaViewSchema = z.record(z.unknown()).and(
  z.object({
    record: embedRecordViewSchema,
    media: z.union([
      embedImagesViewSchema,
      embedVideoViewSchema,
      embedExternalViewSchema,
      z.record(z.unknown()).and(
        z.object({
          $type: z.string(),
        })
      ),
    ]),
  })
)

/* post - PostView */
const threadgateViewSchema = z.record(z.unknown()).and(
  z.object({
    uri: z.string().optional(),
    cid: z.string().optional(),
    record: z.object({}).optional(),
    lists: z.array(listViewBasicSchema).optional(),
  })
)

const postViewSchema = z.record(z.unknown()).and(
  z.object({
    uri: z.string(),
    cid: z.string(),
    author: profileViewBasicSchema,
    record: z.object({}),
    embed: z
      .union([
        embedImagesViewSchema,
        embedVideoViewSchema,
        embedExternalViewSchema,
        embedRecordViewSchema,
        embedRecordWithMediaViewSchema,
        z.record(z.unknown()).and(
          z.object({
            $type: z.string(),
          })
        ),
      ])
      .optional(),
    replyCount: z.number().optional(),
    repostCount: z.number().optional(),
    likeCount: z.number().optional(),
    quoteCount: z.number().optional(),
    indexedAt: z.string(),
    viewer: viewerStateSchema.optional(),
    label: z.array(labelSchema).optional(),
    threadgate: threadgateViewSchema.optional(),
  })
)

const postViewExtendedSchema = postViewSchema.and(
  z.object({
    link: z.string(),
    html: z.string(),
  })
)

/* thread */
const notFoundPostSchema = z.record(z.unknown()).and(
  z.object({
    uri: z.string(),
    notFound: z.literal(true),
  })
)

const blockedPostSchema = z.record(z.unknown()).and(
  z.object({
    uri: z.string(),
    author: blockedAuthorSchema,
    blocked: z.literal(true),
  })
)

interface ThreadViewPost {
  post: z.infer<typeof postViewSchema>
  parent?:
    | ThreadViewPost
    | z.infer<typeof notFoundPostSchema>
    | z.infer<typeof blockedPostSchema>
    | { $type: string; [k: string]: unknown }
  replies?: (
    | ThreadViewPost
    | z.infer<typeof notFoundPostSchema>
    | z.infer<typeof blockedPostSchema>
    | { $type: string; [k: string]: unknown }
  )[]
  [k: string]: unknown
}

const postWithThreadViewSchema = z.object({
  uri: z.string(),
  post: postViewExtendedSchema,
  parent: z
    .union([
      z.lazy(() => threadViewPostSchema),
      notFoundPostSchema,
      blockedPostSchema,
      z.record(z.unknown()).and(
        z.object({
          $type: z.string(),
        })
      ),
    ])
    .optional(),
  replies: z
    .array(
      z.union([
        z.lazy(() => threadViewPostSchema),
        notFoundPostSchema,
        blockedPostSchema,
        z.record(z.unknown()).and(
          z.object({
            $type: z.string(),
          })
        ),
      ])
    )
    .optional(),
})

const postWithThreadViewExtendedSchema = postWithThreadViewSchema.extend({
  replies: z
    .union([
      z
        .array(
          z.union([
            z.lazy(() => threadViewPostSchema),
            notFoundPostSchema,
            blockedPostSchema,
            z.record(z.unknown()).and(
              z.object({
                $type: z.string(),
              })
            ),
          ])
        )
        .optional(),
      z.array(postViewExtendedSchema).optional(),
    ])
    .optional(),
})

const threadViewPostSchema: z.ZodType<ThreadViewPost> = z
  .record(z.unknown())
  .and(
    postWithThreadViewSchema.omit({
      uri: true,
    })
  )

export { postViewExtendedSchema, postWithThreadViewExtendedSchema }
