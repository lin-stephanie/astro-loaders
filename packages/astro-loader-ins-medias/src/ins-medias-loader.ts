import { DEFAULT_BASE_URL, InsMediasLoaderConfigSchema } from './config.js'
import { InsMediaSchema } from './schema.js'
import { fetchMedias } from './utils.js'

import type { Loader } from 'astro/loaders'
import type { InsMediasLoaderUserConfig } from './config.js'

/**
 * Build-time Astro loader that loads Instagram medias between builds.
 *
 * @see https://github.com/lin-stephanie/astro-loaders/tree/main/packages/astro-loader-ins-medias
 */
export function insMediasLoader(userConfig: InsMediasLoaderUserConfig): Loader {
  return {
    name: 'ins-medias',
    schema: InsMediaSchema,
    async load({ meta, store, logger, parseData, generateDigest }) {
      const parsed = InsMediasLoaderConfigSchema.safeParse(userConfig)
      if (!parsed.success) {
        logger.error(
          `The configuration provided is invalid. ${parsed.error.issues
            .map((issue) => issue.message)
            .join(
              '\n'
            )}. Check out the configuration: https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-ins-medias/README.md#insmediasloader-options.`
        )
        return
      }

      const {
        fields,
        apiVersion,
        instagramToken,
        since,
        until,
        limit,
        mediaTypes,
      } = parsed.data

      const token = instagramToken || import.meta.env.INSTAGRAM_TOKEN
      if (!token) {
        logger.warn(
          'No Instagram token provided. Please provide a `instagramToken` or set the `INSTAGRAM_TOKEN` environment variable.\nHow to get an access token via the App Dashboard: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/get-started.\nHow to store token in Astro project environment variables: https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables.'
        )
        return
      }

      // Resume from the last fetched timestamp if available
      let effectiveSince = since
      const lastFetched = meta.get('lastFetched')
      if (!effectiveSince && lastFetched) {
        effectiveSince = Number(lastFetched)
      }

      try {
        const { items, newLastFetched } = await fetchMedias({
          baseUrl: DEFAULT_BASE_URL,
          version: apiVersion,
          token: token,
          fields: fields,
          mediaTypes: mediaTypes,
          since: effectiveSince,
          until: until,
          limit: limit,
          isIncremental: true,
        })

        for (const item of items) {
          const parsedItem = await parseData({ id: item.id, data: item })
          store.set({
            id: item.id,
            data: parsedItem,
            digest: generateDigest(parsedItem),
          })
        }

        if (newLastFetched) {
          meta.set('lastFetched', newLastFetched)
        }

        logger.info('Successfully loaded Instagram medias')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        logger.error(`Failed to load Instagram medias. ${message}`)
      }
    },
  }
}
