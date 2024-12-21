import { ApiResponseError, TwitterApi } from 'twitter-api-v2'

import pkg from '../package.json' with { type: 'json' }
import { TweetsLoaderConfigSchema, getTweetsApiOptions } from './config.js'
import { TweetSchema } from './schema.js'
import { processTweetText, processTweets, saveOrUpdateTweets } from './utils.js'

import type { Loader } from 'astro/loaders'
import type { TweetsLoaderUserConfig } from './config.js'
import type { Tweet } from './schema.js'

const MAX_IDS_PER_REQUEST = 100

/**
 * Astro loader for loading tweets by ID.
 *
 * @see https://github.com/lin-stephanie/astro-loaders/tree/main/packages/astro-loader-tweets
 */
function tweetsLoader(userConfig: TweetsLoaderUserConfig): Loader {
  return {
    name: pkg.name,
    schema: TweetSchema,
    async load({ logger, store, parseData, generateDigest }) {
      const parsedConfig = TweetsLoaderConfigSchema.safeParse(userConfig)
      if (!parsedConfig.success) {
        logger.error(
          `The configuration provided is invalid. ${parsedConfig.error.issues.map((issue) => issue.message).join('\n')}.
Check out the configuration: ${pkg.homepage}README.md#configuration.`
        )
        return
      }

      const { ids, storage, storePath, authToken, ...processTweetTextConfig } =
        parsedConfig.data
      const token = authToken || import.meta.env.X_TOKEN

      if (ids.length === 0) {
        logger.warn('No tweet IDs provided and no tweets will be loaded')
        return
      }

      if (!token) {
        logger.error(
          'No X (Twitter) token provided. Please provide a `authToken` or set the `X_TOKEN` environment variable.\nHow to create an X app-only Bearer Token: https://developer.x.com/en/docs/authentication/oauth-2-0/bearer-tokens.\nHow to store token in Astro project environment variables: https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables.'
        )
        return
      }

      logger.info(`Loading ${ids.length} tweets`)

      const tweets: Tweet[] = []
      const client = new TwitterApi(token)

      try {
        let index = 0
        while (index < ids.length) {
          const batchIds = ids.slice(index, index + MAX_IDS_PER_REQUEST)
          const res = await client.v2.tweets(batchIds, getTweetsApiOptions)

          const processedTweets = res.data.map((tweet) =>
            processTweetText(tweet, processTweetTextConfig)
          )
          tweets.push(...processTweets(processedTweets, res.includes))

          index += MAX_IDS_PER_REQUEST
        }

        if (storage === 'default' || storage === 'both') {
          for (const item of tweets) {
            const parsedItem = await parseData({
              id: item.id,
              data: item,
            })
            store.set({
              id: item.id,
              data: parsedItem,
              digest: generateDigest(parsedItem),
              rendered: { html: item.tweet.text_html },
            })
          }
          logger.info(
            `Successfully loaded ${tweets.length} tweets into the Astro store`
          )
        }

        if (storage === 'custom' || storage === 'both') {
          try {
            await saveOrUpdateTweets(tweets, storePath as string)
            logger.info(
              `Successfully loaded ${tweets.length} tweets into '${storePath}'`
            )
          } catch (error) {
            logger.error(
              `Failed to save tweets to '${storePath}'. ${(error as Error).message}`
            )
          }
        }
      } catch (error) {
        if (
          error instanceof ApiResponseError &&
          error.rateLimitError &&
          error.rateLimit
        ) {
          logger.warn(
            `Please try again later as the rate limit of ${error.rateLimit.limit} per 15 minutes is exceeded with ${error.rateLimit.remaining} left`
          )
        } else {
          logger.error(`Failed to load tweets. ${(error as Error).message}`)
        }
      }
    },
  }
}

export { tweetsLoader, TweetSchema }
export type { TweetsLoaderUserConfig } from './config.js'
