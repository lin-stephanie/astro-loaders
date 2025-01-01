import { z } from 'astro/zod'

const defaultConfig = {
  urlTextType: 'display-url' as const,
  newlineHandling: 'none' as const,
  fetchThread: false,
  threadDepth: 1,
  threadParentHeight: 1,
  fetchOnlyAuthorReplies: false,
}

export const BlueskyPostsLoaderConfigSchema = z.object({
  /**
   * List of post {@link https://atproto.com/specs/at-uri-scheme AT-URIs}
   * to return hydrated views for.
   */
  uris: z.array(z.string()),

  /**
   * The type of text to display for links when generating renderable HTML:
   * - `'domain-path'`: Displays the link's domain and path.
   * - `'display-url'`: Uses the link text as shown in the tweet.
   *
   * @default 'display-url'
   */
  linkTextType: z
    .enum(['domain-path', 'display-url'])
    .default(defaultConfig.urlTextType),

  /**
   * The way for processing `\n` when generating renderable HTML:
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
   * Whether to fetch the post's thread including replies and parents.
   *
   * @default false
   */
  fetchThread: z.boolean().default(defaultConfig.fetchThread),

  /**
   * The depth of the descendant post tree to fetch if fetching the thread.
   * Specifies how many levels of reply depth should be included.
   *
   * @default 1
   */
  threadDepth: z.number().min(0).max(1000).default(defaultConfig.threadDepth),

  /**
   * The height of the ancestor post tree to fetch if fetching the thread.
   * Specifies how many levels of parent posts should be included.
   *
   * @default 1
   */
  threadParentHeight: z
    .number()
    .min(0)
    .max(1000)
    .default(defaultConfig.threadParentHeight),

  /**
   * Whether to include only the replies made by the post author
   * at the specified `threadDepth` if fetching the thread.
   *
   * If `true`, filters replies to include only those authored by the specified DID at any depth
   * and flatten these replies into a single-level array.
   * The specified `threadParentHeight` will be ignored, and the `parent` field will not be returned.
   *
   * By default, it fetches all replies without filtering by author and maintains the nested structure.
   *
   * @default false
   */
  fetchOnlyAuthorReplies: z
    .boolean()
    .default(defaultConfig.fetchOnlyAuthorReplies),
})

export type BlueskyPostsLoaderUserConfig = z.input<
  typeof BlueskyPostsLoaderConfigSchema
>