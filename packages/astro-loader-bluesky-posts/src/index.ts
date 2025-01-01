import { AtpAgent } from '@atproto/api'

import pkg from '../package.json' with { type: 'json' }
import { BlueskyPostsLoaderConfigSchema } from './config.js'
import { postViewSchema, postWithThreadViewExtendedSchema } from './schema.js'
import { renderPostAsHtml, getOnlyAuthorReplies } from './utils.js'

import type {
  PostView,
  ThreadViewPost,
} from '@atproto/api/dist/client/types/app/bsky/feed/defs.js'
import type { Loader } from 'astro/loaders'
import type { BlueskyPostsLoaderUserConfig } from './config.js'

/**
 * Astro loader for loading Bluesky posts and threads using AT-URI.
 *
 * @see https://github.com/lin-stephanie/astro-loaders/tree/main/packages/astro-loader-bluesky-posts
 */
function blueskyPostsLoader(userConfig: BlueskyPostsLoaderUserConfig): Loader {
  return {
    name: pkg.name,
    schema: userConfig.fetchThread
      ? postWithThreadViewExtendedSchema
      : postViewSchema,
    async load({ logger, store, parseData, generateDigest }) {
      const parsedConfig = BlueskyPostsLoaderConfigSchema.safeParse(userConfig)
      if (!parsedConfig.success) {
        logger.error(
          `The configuration provided is invalid. ${parsedConfig.error.issues.map((issue) => issue.message).join('\n')}.
Check out the configuration: ${pkg.homepage}README.md#configuration.`
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

      try {
        const agent = new AtpAgent({ service: 'https://public.api.bsky.app' })
        if (!fetchThread) {
          logger.info(`Loading ${uris.length} posts`)

          const getPostsRes = await agent.getPosts({ uris: uris })

          if (getPostsRes.success) {
            const {
              data: { posts },
            } = getPostsRes

            for (const item of posts) {
              const parsedItem = await parseData({
                id: item.uri,
                // Convert `item` to a pure POJO by stripping non-serializable, non-enumerable, and inherited properties,
                // preventing serialization errors 'Cannot stringify arbitrary non-POJOs' caused by devalue library.
                data: JSON.parse(JSON.stringify(item)),
              })
              store.set({
                id: item.uri,
                data: parsedItem,
                digest: generateDigest(parsedItem),
                rendered: {
                  html: renderPostAsHtml(item, renderPostAsHtmlConfig),
                },
              })
            }

            logger.info('Successfully loaded posts')
          } else {
            logger.error('Failed to load posts')
          }
        } else {
          const posts: any[] = []
          let count: number = uris.length
          logger.info(
            `Loading ${count} posts and ${fetchOnlyAuthorReplies ? 'direct replies' : 'threads'}`
          )

          for (const uri of uris) {
            const getPostThreadRes = await agent.getPostThread({
              uri,
              depth: threadDepth,
              parentHeight: fetchOnlyAuthorReplies ? 0 : threadParentHeight,
            })

            if (getPostThreadRes.success) {
              const {
                data: { thread },
              } = getPostThreadRes

              if (thread.notFound && thread.notFound === true) {
                logger.warn(`Post with '${uri}' not found`)
                count--
                continue
              }

              if (thread.blocked && thread.blocked === true) {
                logger.warn(`Post with '${uri}' is blocked`)
                count--
                continue
              }

              const post = thread.post as PostView
              const replies = thread.replies as ThreadViewPost['replies']
              const parsedDate = await parseData({
                id: post.uri,
                data: JSON.parse(
                  JSON.stringify({
                    uri: post.uri,
                    post: post,
                    replies: fetchOnlyAuthorReplies
                      ? getOnlyAuthorReplies(
                          replies,
                          threadDepth,
                          post.author.did
                        )
                      : replies,
                    ...(fetchOnlyAuthorReplies
                      ? {}
                      : { parent: thread.parent }),
                  })
                ),
              })

              store.set({
                id: parsedDate.uri,
                data: parsedDate,
                digest: generateDigest(parsedDate),
                rendered: {
                  html: renderPostAsHtml(
                    parsedDate.post,
                    renderPostAsHtmlConfig
                  ),
                },
              })
            } else {
              logger.warn(`Post with '${uri}' load failed`)
              count--
            }
          }

          logger.info(
            `Successfully loaded ${count === uris.length ? 'all' : `${count}`} posts`
          )
        }
      } catch (error) {
        logger.error(`Failed to load posts. ${(error as Error).message}`)
      }
    },
  }
}

export { blueskyPostsLoader }
export type { BlueskyPostsLoaderUserConfig } from './config.js'
