import { AppBskyFeedDefs, AtpAgent } from '@atproto/api'

import { BlueskyPostsLoaderConfigSchema } from './config.js'
import {
  PostViewExtendedSchema,
  PostWithThreadViewExtendedSchema,
  PostWithOnlyAuthorRepliesExtendedSchema,
} from './schema.js'
import {
  getAtUri,
  atUriToPostUri,
  renderPostAsHtml,
  getOnlyAuthorReplies,
} from './utils.js'

import type { Loader } from 'astro/loaders'
import type { BlueskyPostsLoaderUserConfig } from './config.js'

/**
 * Astro loader for loading Bluesky posts and threads using post URLs or AT-URIs.
 *
 * @see https://github.com/lin-stephanie/astro-loaders/tree/main/packages/astro-loader-bluesky-posts
 */
function blueskyPostsLoader(
  userConfig: BlueskyPostsLoaderUserConfig & {
    fetchThread: true
    fetchOnlyAuthorReplies: true
  }
): Loader & { schema: typeof PostWithOnlyAuthorRepliesExtendedSchema }
function blueskyPostsLoader(
  userConfig: BlueskyPostsLoaderUserConfig & {
    fetchThread: true
    fetchOnlyAuthorReplies?: false | undefined
  }
): Loader & { schema: typeof PostWithThreadViewExtendedSchema }
function blueskyPostsLoader(
  userConfig: BlueskyPostsLoaderUserConfig & {
    fetchThread?: false | undefined
  }
): Loader & { schema: typeof PostViewExtendedSchema }
function blueskyPostsLoader(
  userConfig: BlueskyPostsLoaderUserConfig
): Loader & {
  schema:
    | typeof PostWithOnlyAuthorRepliesExtendedSchema
    | typeof PostWithThreadViewExtendedSchema
    | typeof PostViewExtendedSchema
}
function blueskyPostsLoader(
  userConfig: BlueskyPostsLoaderUserConfig
): Loader & {
  schema:
    | typeof PostWithOnlyAuthorRepliesExtendedSchema
    | typeof PostWithThreadViewExtendedSchema
    | typeof PostViewExtendedSchema
} {
  return {
    name: 'astro-loader-bluesky-posts',
    schema: userConfig.fetchThread
      ? userConfig.fetchOnlyAuthorReplies
        ? PostWithOnlyAuthorRepliesExtendedSchema
        : PostWithThreadViewExtendedSchema
      : PostViewExtendedSchema,
    async load({ logger, store, parseData, generateDigest, meta }) {
      const parsedConfig = BlueskyPostsLoaderConfigSchema.safeParse(userConfig)
      if (!parsedConfig.success) {
        logger.error(
          `The configuration provided is invalid. ${parsedConfig.error.issues.map((issue) => issue.message).join('\n')}. Check out the configuration: https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-bluesky-posts/README.md#configuration.`
        )
        return
      }

      const {
        uris,
        fetchThread,
        threadDepth,
        threadParentHeight,
        fetchOnlyAuthorReplies,
        ...renderPostAsHtmlConfig
      } = parsedConfig.data
      if (uris.length === 0) {
        logger.warn('No AT-URIs provided and no posts will be loaded')
        return
      }

      const preConfig = meta.get('config')
      const configDigest = generateDigest(JSON.stringify(parsedConfig.data))
      if (preConfig && preConfig === configDigest) {
        logger.info('Configuration unchanged, skipping')
        return
      }

      try {
        const agent = new AtpAgent({ service: 'https://public.api.bsky.app' })
        const atUris = await Promise.all(
          uris.map((uri) => getAtUri(uri, agent))
        )

        if (!fetchThread) {
          logger.info(`Loading ${atUris.length} posts`)

          // limit to 25 URIs per request to prevent overload
          const chunkSize = 25
          const allPosts: AppBskyFeedDefs.PostView[] = []
          for (let i = 0; i < atUris.length; i += chunkSize) {
            const chunk = atUris.slice(i, i + chunkSize)
            const getPostsRes = await agent.getPosts({ uris: chunk })

            if (getPostsRes.success) {
              allPosts.push(...getPostsRes.data.posts)
            } else {
              throw new Error(
                `Loading posts ${i + 1} to ${i + chunk.length} encountered unknown errors`
              )
            }
          }

          for (const item of allPosts) {
            const link = atUriToPostUri(item.uri)
            const html = renderPostAsHtml(
              item.record as any,
              renderPostAsHtmlConfig
            )
            const parsedItem = await parseData({
              id: item.uri,
              // convert `item` to a pure POJO by stripping non-serializable, non-enumerable, and inherited properties,
              // preventing serialization errors 'Cannot stringify arbitrary non-POJOs' caused by devalue library.
              data: JSON.parse(JSON.stringify({ ...item, link, html })),
            })

            store.set({
              id: item.uri,
              data: parsedItem,
              digest: generateDigest(parsedItem),
              rendered: { html },
            })
          }

          logger.info('Successfully loaded all posts')
        } else {
          let count: number = atUris.length
          logger.info(
            `Loading ${count} posts and ${fetchOnlyAuthorReplies ? 'direct replies' : 'threads'}`
          )

          for (const uri of atUris) {
            const getPostThreadRes = await agent.getPostThread({
              uri,
              depth: threadDepth,
              parentHeight: fetchOnlyAuthorReplies ? 0 : threadParentHeight,
            })

            if (getPostThreadRes.success) {
              const {
                data: { thread },
              } = getPostThreadRes

              if (AppBskyFeedDefs.isNotFoundPost(thread)) {
                logger.warn(`Post with '${uri}' not found`)
                count--
                continue
              }

              if (AppBskyFeedDefs.isBlockedPost(thread)) {
                logger.warn(`Post with '${uri}' is blocked`)
                count--
                continue
              }

              if (AppBskyFeedDefs.isThreadViewPost(thread)) {
                const post = thread.post
                const replies = thread.replies
                const link = atUriToPostUri(post.uri)
                const html = renderPostAsHtml(
                  post.record as any,
                  renderPostAsHtmlConfig
                )

                const data = JSON.parse(
                  JSON.stringify({
                    uri: post.uri,
                    post: { ...post, link, html },
                    replies: fetchOnlyAuthorReplies
                      ? getOnlyAuthorReplies(
                          replies,
                          threadDepth,
                          post.author.did
                        ).map((item) => ({
                          ...item,
                          link: atUriToPostUri(item.uri),
                          html: renderPostAsHtml(
                            item.record as any,
                            renderPostAsHtmlConfig
                          ),
                        }))
                      : replies,
                    ...(fetchOnlyAuthorReplies
                      ? {}
                      : { parent: thread.parent }),
                  })
                )

                const parsedDate = await parseData({
                  id: post.uri,
                  data: data,
                })

                store.set({
                  id: parsedDate.uri,
                  data: parsedDate,
                  digest: generateDigest(parsedDate),
                  rendered: { html },
                })
              }
            } else {
              logger.warn(`Post with '${uri}' load failed`)
              count--
            }
          }

          logger.info(
            `Successfully loaded ${count === atUris.length ? 'all' : `${count}`} posts`
          )
        }
        meta.set('config', configDigest)
      } catch (error) {
        if (error instanceof Error) {
          logger.error(error.stack ?? error.message)
        } else {
          logger.error('Failed to load posts.')
        }
      }
    },
  } satisfies Loader
}

export { blueskyPostsLoader, renderPostAsHtml, atUriToPostUri }
export type { BlueskyPostsLoaderUserConfig } from './config.js'
