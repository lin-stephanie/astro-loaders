import { z } from 'astro/zod'

const UnknownSchema = z
  .object({
    $type: z.string(),
  })
  .passthrough()

/* author - AppBskyActorDefs.ProfileViewBasic */
const labelSchema = z.object({
  $type: z.literal('com.atproto.label.defs#label').optional(),
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

const listPurposeSchema = z.union([
  z.literal('app.bsky.graph.defs#modlist'),
  z.literal('app.bsky.graph.defs#curatelist'),
  z.literal('app.bsky.graph.defs#referencelist'),
  z.string().and(z.object({})),
])

const listViewerStateSchema = z.object({
  $type: z.literal('app.bsky.graph.defs#listViewerState').optional(),
  muted: z.boolean().optional(),
  blocked: z.string().optional(),
})

const listViewBasicSchema = z.object({
  $type: z.literal('app.bsky.graph.defs#listViewBasic').optional(),
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

const profileAssociatedChatSchema = z.object({
  $type: z.literal('app.bsky.graph.defs#profileAssociatedChat').optional(),
  allowIncoming: z.union([
    z.literal('all'),
    z.literal('none'),
    z.literal('following'),
    z.string().and(z.object({})),
  ]),
})

const profileAssociatedSchema = z.object({
  $type: z.literal('app.bsky.actor.defs#profileAssociated').optional(),
  lists: z.number().optional(),
  feedgens: z.number().optional(),
  starterPacks: z.number().optional(),
  labeler: z.boolean().optional(),
  chat: profileAssociatedChatSchema.optional(),
})

interface ProfileViewBasic {
  $type?: 'app.bsky.actor.defs#profileViewBasic'
  did: string
  handle: string
  displayName?: string
  avatar?: string
  associated?: z.infer<typeof profileAssociatedSchema>
  viewer?: z.infer<typeof viewerStateSchema>
  labels?: z.infer<typeof labelSchema>[]
  createdAt?: string
}

interface KnownFollowers {
  $type?: 'app.bsky.actor.defs#knownFollowers'
  count: number
  followers: ProfileViewBasic[]
}

const knownFollowersSchema: z.ZodType<KnownFollowers> = z.object({
  $type: z.literal('app.bsky.actor.defs#knownFollowers').optional(),
  count: z.number(),
  followers: z.lazy(() => profileViewBasicSchema.array()),
})

const viewerStateSchema = z.object({
  $type: z.literal('app.bsky.actor.defs#viewerState').optional(),
  muted: z.boolean().optional(),
  mutedByList: listViewBasicSchema.optional(),
  blockedBy: z.boolean().optional(),
  blocking: z.string().optional(),
  blockingByList: listViewBasicSchema.optional(),
  following: z.string().optional(),
  followedBy: z.string().optional(),
  knownFollowers: knownFollowersSchema.optional(),
})

// https://github.com/bluesky-social/atproto/blob/main/packages/api/src/client/types/app/bsky/actor/defs.ts#L18
const profileViewBasicSchema = z.object({
  $type: z.literal('app.bsky.actor.defs#profileViewBasic').optional(),
  did: z.string(),
  handle: z.string(),
  displayName: z.string().optional(),
  avatar: z.string().optional(),
  associated: profileAssociatedSchema.optional(),
  viewer: viewerStateSchema.optional(),
  labels: z.array(labelSchema).optional(),
  createdAt: z.string().optional(),
})

/* embed */
const aspectRatioSchema = z.object({
  $type: z.literal('app.bsky.embed.defs#aspectRatio').optional(),
  width: z.number(),
  height: z.number(),
})

/* AppBskyEmbedImages.View */
const viewImageSchema = z.object({
  $type: z.literal('app.bsky.embed.images#viewImage').optional(),
  thumb: z.string(),
  fullsize: z.string(),
  alt: z.string(),
  aspectRatio: aspectRatioSchema.optional(),
})

// https://github.com/bluesky-social/atproto/blob/main/packages/api/src/client/types/app/bsky/embed/images.ts#L47
const embedImagesViewSchema = z.object({
  $type: z.literal('app.bsky.embed.images#view').optional(),
  images: z.array(viewImageSchema),
})

/* AppBskyEmbedVideo.View */
// https://github.com/bluesky-social/atproto/blob/main/packages/api/src/client/types/app/bsky/embed/video.ts#L49
const embedVideoViewSchema = z.object({
  $type: z.literal('app.bsky.embed.video#view').optional(),
  cid: z.string(),
  playlist: z.string(),
  thumbnail: z.string().optional(),
  alt: z.string().optional(),
  aspectRatio: aspectRatioSchema.optional(),
})

/* AppBskyEmbedExternal.View */
const viewExternalSchema = z.object({
  $type: z.literal('app.bsky.embed.external#viewExternal').optional(),
  uri: z.string(),
  title: z.string(),
  description: z.string(),
  thumb: z.string().optional(),
})

// https://github.com/bluesky-social/atproto/blob/main/packages/api/src/client/types/app/bsky/embed/external.ts#L47
const embedExternalViewSchema = z.object({
  $type: z.literal('app.bsky.embed.external#view').optional(),
  external: viewExternalSchema,
})

/* AppBskyEmbedRecord.View */
const profileViewSchema = z.object({
  $type: z.literal('app.bsky.actor.defs#profileView').optional(),
  did: z.string(),
  handle: z.string(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  avatar: z.string().optional(),
  associated: profileAssociatedSchema.optional(),
  indexedAt: z.string().optional(),
  createdAt: z.string().optional(),
  // viewer: viewerStateSchema.optional(),
  labels: z.array(labelSchema).optional(),
})

const byteSliceSchema = z.object({
  $type: z.literal('app.bsky.richtext.facet#byteSlice').optional(),
  byteStart: z.number(),
  byteEnd: z.number(),
})

const mentionSchema = z.object({
  $type: z.literal('app.bsky.richtext.facet#mention').optional(),
  did: z.string(),
})

const linkSchema = z.object({
  $type: z.literal('app.bsky.richtext.facet#link').optional(),
  uri: z.string(),
})

const tagSchema = z.object({
  $type: z.literal('app.bsky.richtext.facet#tag').optional(),
  tag: z.string(),
})

const richTextMainSchema = z.object({
  $type: z.literal('app.bsky.richtext.facet').optional(),
  index: byteSliceSchema,
  features: z.array(z.union([mentionSchema, linkSchema, tagSchema])),
})

const generatorViewerStateSchema = z.object({
  $type: z.literal('app.bsky.feed.defs#generatorViewerState').optional(),
  like: z.string().optional(),
})

const generatorViewSchema = z.object({
  $type: z.literal('app.bsky.feed.defs#generatorView').optional(),
  uri: z.string(),
  cid: z.string(),
  did: z.string(),
  creator: profileViewSchema,
  displayName: z.string(),
  description: z.string().optional(),
  descriptionFacets: z.array(richTextMainSchema).optional(),
  avatar: z.string().optional(),
  likeCount: z.number().optional(),
  acceptsInteractions: z.boolean().optional(),
  labels: z.array(labelSchema).optional(),
  viewer: generatorViewerStateSchema.optional(),
  contentMode: z
    .union([
      z.literal('app.bsky.feed.defs#contentModeUnspecified'),
      z.literal('app.bsky.feed.defs#contentModeVideo'),
      z.string().and(z.object({})),
    ])
    .optional(),
  indexedAt: z.string(),
})

interface ViewRecord {
  uri: string
  cid: string
  author: ProfileViewBasic
  value: { [_ in string]: unknown }
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
    | { $type: string }
  )[]
  indexedAt: string
}

const viewRecordSchema: z.ZodType<ViewRecord> = z.object({
  $type: z.literal('app.bsky.embed.record#viewRecord').optional(),
  uri: z.string(),
  cid: z.string(),
  author: profileViewBasicSchema,
  value: z.record(z.unknown()),
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
      ])
    )
    .optional(),
  indexedAt: z.string(),
})

const viewNotFoundSchema = z.object({
  $type: z.literal('app.bsky.embed.record#viewNotFound').optional(),
  uri: z.string(),
  notFound: z.literal(true),
})

const blockedAuthorSchema = z.object({
  $type: z.literal('app.bsky.feed.defs#blockedAuthor').optional(),
  did: z.string(),
  viewer: viewerStateSchema.optional(),
})

const viewBlockedSchema = z.object({
  $type: z.literal('app.bsky.embed.record#viewBlocked').optional(),
  uri: z.string(),
  blocked: z.literal(true),
  author: blockedAuthorSchema,
})

const viewDetachedSchema = z.object({
  $type: z.literal('app.bsky.embed.record#viewDetached').optional(),
  uri: z.string(),
  detached: z.literal(true),
})

const listViewSchema = z.object({
  $type: z.literal('app.bsky.graph.defs#listView').optional(),
  uri: z.string(),
  cid: z.string(),
  creator: profileViewSchema,
  name: z.string(),
  purpose: listPurposeSchema,
  description: z.string().optional(),
  descriptionFacets: z.array(richTextMainSchema).optional(),
  avatar: z.string().optional(),
  listItemCount: z.number().optional(),
  labels: z.array(labelSchema).optional(),
  viewer: listViewerStateSchema.optional(),
  indexedAt: z.string(),
})

const labelerViewerStateSchema = z.object({
  $type: z.literal('app.bsky.labeler.defs#labelerViewerState').optional(),
  like: z.string().optional(),
})

const labelerViewSchema = z.object({
  $type: z.literal('app.bsky.labeler.defs#labelerView').optional(),
  uri: z.string(),
  cid: z.string(),
  creator: profileViewSchema,
  likeCount: z.number().optional(),
  viewer: labelerViewerStateSchema.optional(),
  indexedAt: z.string(),
  labels: z.array(labelSchema).optional(),
})

const starterPackViewBasicSchema = z.object({
  $type: z.literal('app.bsky.graph.defs#starterPackViewBasic').optional(),
  uri: z.string(),
  cid: z.string(),
  record: z.record(z.unknown()),
  creator: profileViewBasicSchema,
  listItemCount: z.number().optional(),
  joinedWeekCount: z.number().optional(),
  joinedAllTimeCount: z.number().optional(),
  labels: z.array(labelSchema).optional(),
  indexedAt: z.string(),
})

// https://github.com/bluesky-social/atproto/blob/main/packages/api/src/client/types/app/bsky/embed/record.ts#L38
const embedRecordViewSchema = z.object({
  $type: z.literal('app.bsky.embed.record#view').optional(),
  record: z.union([
    viewRecordSchema,
    viewNotFoundSchema,
    viewBlockedSchema,
    viewDetachedSchema,
    generatorViewSchema,
    listViewSchema,
    labelerViewSchema,
    starterPackViewBasicSchema,
  ]),
})

/* AppBskyEmbedRecordWithMedia.View */
const embedRecordWithMediaViewSchema = z.object({
  $type: z.literal('app.bsky.embed.recordWithMedia#view').optional(),
  record: embedRecordViewSchema,
  media: z.union([
    embedImagesViewSchema,
    embedVideoViewSchema,
    embedExternalViewSchema,
  ]),
})

/* post - PostView */
export const strongRefMainSchema = z.object({
  $type: z.literal('com.atproto.repo.strongRef').optional(),
  uri: z.string(),
  cid: z.string(),
})

const replyRefSchema = z.object({
  $type: z.literal('app.bsky.feed.post#replyRef').optional(),
  root: strongRefMainSchema,
  parent: strongRefMainSchema,
})

const selfLabelSchema = z.object({
  $type: z.literal('com.atproto.label.defs#selfLabel').optional(),
  val: z.string(),
})

const selfLabelsSchema = z.object({
  $type: z.literal('com.atproto.label.defs#selfLabels').optional(),
  values: z.array(selfLabelSchema),
})

const recordEmbedImage = z.object({
  $type: z.literal('app.bsky.embed.images'),
  images: z.array(
    z.object({
      alt: z.string().optional(),
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

const recordEmbedVideo = z.object({
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

const recordEmbedExternal = z.object({
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

const recordEmbedRecord = z.object({
  $type: z.literal('app.bsky.embed.record'),
  record: z.object({
    uri: z.string(),
    cid: z.string(),
  }),
})

const EmbedRecordWithMediaSchema = z.object({
  $type: z.literal('app.bsky.embed.recordWithMedia'),
  record: recordEmbedRecord,
  media: z.union([
    recordEmbedImage,
    recordEmbedVideo,
    recordEmbedExternal,
    recordEmbedRecord,
    UnknownSchema,
  ]),
})

// https://github.com/bluesky-social/atproto/blob/main/packages/api/src/client/types/app/bsky/feed/post.ts#L21
const recordSchema = z
  .object({
    $type: z.literal('app.bsky.feed.post'),
    text: z.string(),
    facets: z.array(richTextMainSchema).optional(),
    reply: replyRefSchema.optional(),
    embed: z
      .union([
        recordEmbedImage,
        recordEmbedVideo,
        recordEmbedExternal,
        recordEmbedRecord,
        EmbedRecordWithMediaSchema,
        UnknownSchema,
      ])
      .optional(),
    langs: z.array(z.string()).optional(),
    labels: selfLabelsSchema.optional(),
    tags: z.array(z.string()).optional(),
    createdAt: z.string(),
  })
  .catchall(z.unknown())

const threadgateViewSchema = z.object({
  $type: z.literal('app.bsky.feed.defs#threadgateView').optional(),
  uri: z.string().optional(),
  cid: z.string().optional(),
  record: z.record(z.unknown()).optional(),
  lists: z.array(listViewBasicSchema).optional(),
})

// https://github.com/bluesky-social/atproto/blob/main/packages/api/src/client/types/app/bsky/feed/getPosts.ts#L22
// https://github.com/bluesky-social/atproto/blob/main/packages/api/src/client/types/app/bsky/feed/defs.ts#L22
const postViewSchema = z.object({
  $type: z.literal('app.bsky.feed.defs#postView').optional(),
  uri: z.string(),
  cid: z.string(),
  author: profileViewBasicSchema,
  record: recordSchema,
  embed: z
    .union([
      embedImagesViewSchema,
      embedVideoViewSchema,
      embedExternalViewSchema,
      embedRecordViewSchema,
      embedRecordWithMediaViewSchema,
      UnknownSchema,
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

const postViewExtendedSchema = postViewSchema.and(
  z.object({
    link: z.string(),
    html: z.string(),
  })
)

/* thread */
interface ThreadContext {
  $type?: 'app.bsky.feed.defs#threadContext'
  rootAuthorLike?: string
}

interface ThreadViewPost {
  $type?: 'app.bsky.feed.defs#threadViewPost'
  post: z.infer<typeof postViewSchema>
  parent?:
    | ThreadViewPost
    | z.infer<typeof notFoundPostSchema>
    | z.infer<typeof blockedPostSchema>
    | z.infer<typeof UnknownSchema>
  replies?: (
    | ThreadViewPost
    | z.infer<typeof notFoundPostSchema>
    | z.infer<typeof blockedPostSchema>
    | z.infer<typeof UnknownSchema>
  )[]
  threadContext?: ThreadContext
}

const notFoundPostSchema = z.object({
  $type: z.literal('app.bsky.feed.defs#notFoundPost').optional(),
  uri: z.string(),
  notFound: z.literal(true),
})

const blockedPostSchema = z.object({
  $type: z.literal('app.bsky.feed.defs#blockedPost').optional(),
  uri: z.string(),
  blocked: z.literal(true),
  author: blockedAuthorSchema,
})

// https://github.com/bluesky-social/atproto/blob/main/packages/api/src/client/types/app/bsky/feed/getPostThread.ts#L26
const postWithThreadViewSchema = z.object({
  uri: z.string(),
  post: postViewExtendedSchema,
  parent: z
    .union([
      z.lazy(() => threadViewPostSchema),
      notFoundPostSchema,
      blockedPostSchema,
      UnknownSchema,
    ])
    .optional(),
  replies: z
    .array(
      z.union([
        z.lazy(() => threadViewPostSchema),
        notFoundPostSchema,
        blockedPostSchema,
        UnknownSchema,
      ])
    )
    .optional(),
})

const postWithThreadViewExtendedSchema = postWithThreadViewSchema.extend({
  replies: z
    .union([
      z.array(
        z.union([
          z.lazy(() => threadViewPostSchema),
          notFoundPostSchema,
          blockedPostSchema,
          UnknownSchema,
        ])
      ),
      z.array(postViewExtendedSchema),
    ])
    .optional(),
})

const threadViewPostSchema: z.ZodType<ThreadViewPost> =
  postWithThreadViewSchema.omit({
    uri: true,
  })

export { postViewExtendedSchema, postWithThreadViewExtendedSchema }
