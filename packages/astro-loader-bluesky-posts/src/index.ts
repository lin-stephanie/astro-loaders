import { AtpAgent } from '@atproto/api'

import pkg from '../package.json' with { type: 'json' }
import { BlueskyPostsLoaderConfigSchema } from './config.js'
import {
  postViewExtendedSchema,
  postWithThreadViewExtendedSchema,
} from './schema.js'
import { renderPostAsHtml, getPostLink, getOnlyAuthorReplies } from './utils.js'

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
      : postViewExtendedSchema,
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

          // limit to 25 URIs per request to prevent overload
          const chunkSize = 25
          const allPosts: PostView[] = []
          for (let i = 0; i < uris.length; i += chunkSize) {
            const chunk = uris.slice(i, i + chunkSize)
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
            const link = getPostLink(item)
            const html = renderPostAsHtml(item, renderPostAsHtmlConfig)
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
              const link = getPostLink(post)
              const html = renderPostAsHtml(post, renderPostAsHtmlConfig)
              const parsedDate = await parseData({
                id: post.uri,
                data: JSON.parse(
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
                          link: getPostLink(item as PostView),
                          html: renderPostAsHtml(
                            item as PostView,
                            renderPostAsHtmlConfig
                          ),
                        }))
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

export { blueskyPostsLoader, renderPostAsHtml, getPostLink }
export type { BlueskyPostsLoaderUserConfig } from './config.js'
