import { AstroError } from 'astro/errors'
import { TwitterApi, ApiResponseError } from 'twitter-api-v2'

import fs from 'node:fs'

import pkg from '../package.json' with { type: 'json' }
import {
  TweetsLoaderConfigSchema,
  defaultConfig,
  getTweetsApiOptions,
} from './config.js'
import { processTweets, processTweetText } from './utils.js'
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
  const parsedConfig = TweetsLoaderConfigSchema.safeParse(userConfig)
  if (!parsedConfig.success) {
    throw new AstroError(
      `${parsedConfig.error.issues.map((issue) => issue.message).join('\n')}. \nCheck out the configuration for this loader: ${pkg.homepage}README.md#configuration.`
    )
  }
  const parsedUserConfig = parsedConfig.data

  return {
    name: pkg.name,
    schema: TweetSchema,
    async load({ logger, store, parseData }) {
      const config = { ...defaultConfig, ...parsedUserConfig }
      const { tweetIds, authToken, ...processTweetTextConfig } = config

      if (tweetIds.length === 0) {
        logger.warn('No tweet ids provided')
        return
      }

      const token = authToken || import.meta.env.X_TOKEN
      if (!token) {
        throw new AstroError(
          'No X (Twitter) token provided. Please provide a `authToken` or set the `X_TOKEN` environment variable.',
          `How to create an X app-only Bearer Token: https://developer.x.com/en/docs/authentication/oauth-2-0/bearer-tokens.
How to store token in Astro project environment variables: https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables`
        )
      }

      logger.info(`Loading ${tweetIds.length} tweets`)

      const tweets: Tweet[] = []
      const client = new TwitterApi(token)

      try {
        let index = 0
        while (index < tweetIds.length) {
          const batchIds = tweetIds.slice(index, index + MAX_IDS_PER_REQUEST)
          const res = await client.v2.tweets(batchIds, getTweetsApiOptions)

          const processedTweets = res.data.map((tweet) =>
            processTweetText(tweet, processTweetTextConfig)
          )
          tweets.push(...processTweets(processedTweets, res.includes))

          index += MAX_IDS_PER_REQUEST
        }

        store.clear()
        for (const item of tweets) {
          const parsedItem = await parseData({ id: item.tweet.id, data: item })
          store.set({
            id: item.tweet.id,
            data: parsedItem,
            rendered: { html: item.tweet.text_html },
          })
        }

        logger.info(`Successfully loaded ${tweets.length} tweets`)
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

export { tweetsLoader }
export type { TweetsLoaderUserConfig } from './config.js'
