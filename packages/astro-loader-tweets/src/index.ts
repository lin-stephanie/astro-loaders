import { TwitterApi, ApiResponseError } from 'twitter-api-v2'

import pkg from '../package.json' with { type: 'json' }
import { TweetsLoaderConfigSchema, getTweetsApiOptions } from './config.js'
import { processTweets, processTweetText, saveOrUpdateTweets } from './utils.js'
import { TweetSchema } from './schema.js'

import type { Loader } from 'astro/loaders'
import type { TweetsLoaderUserConfig } from './config.js'
import type { Tweet } from './schema.js'

const MAX_IDS_PER_REQUEST = 100

/**
 * Aatro loader for loading tweets from multiple tweet ids.
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
      const parsedUserConfig = parsedConfig.data
      const { ids, storage, storePath, authToken, ...processTweetTextConfig } =
        parsedUserConfig
      const token = authToken || import.meta.env.X_TOKEN

      if (ids.length === 0) {
        logger.warn('No tweet ids provided')
        return
      }

      if (!token) {
        logger.error(
          'No X (Twitter) token provided. Please provide a `authToken` or set the `X_TOKEN` environment variable.\nHow to create an X app-only Bearer Token: https://developer.x.com/en/docs/authentication/oauth-2-0/bearer-tokens.\nHow to store token in Astro project environment variables: https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables.'
        )
        return
      }

      logger.info(`Loading ${ids.length} tweets...`)

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
            const res = store.set({
              id: item.id,
              data: parsedItem,
              digest: generateDigest(parsedItem),
              rendered: { html: item.tweet.text_html },
            })
            console.log('id', item.tweet.id)
            console.log('res', res)
          }
        }

        if (storage === 'custom' || storage === 'both') {
          const result = await saveOrUpdateTweets(tweets, storePath as string)
          if (!result.success) {
            logger.error((result.error as Error).message)
            return
          }
        }

        logger.info(
          `Successfully loaded ${tweets.length} tweets${storage === 'custom' || storage === 'both' ? `, exported to '${storePath}'` : ''}`
        )
      } catch (error) {
        if (
          error instanceof ApiResponseError &&
          error.rateLimitError &&
          error.rateLimit
        ) {
          logger.warn(
            `Rate limit exceeded with ${error.rateLimit.limit} requests/15min, ${error.rateLimit.remaining} remaining`
          )
        } else {
          logger.error(`Failed to load tweets: ${(error as Error).message}`)
        }
      }
    },
  }
}

export { tweetsLoader, TweetSchema }
export type { TweetsLoaderUserConfig } from './config.js'
