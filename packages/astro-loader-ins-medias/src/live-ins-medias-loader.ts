import {
  DEFAULT_BASE_URL,
  LiveInsMediasLoaderUserConfigSchema,
  LiveCollectionFilterSchema,
  LiveEntryFilterSchema,
} from './config.js'
import { fetchMedias, requestInsApi } from './utils.js'

import type { LiveLoader } from 'astro/loaders'
import type {
  LiveInsMediasLoaderUserConfig,
  LiveCollectionFilter,
  LiveEntryFilter,
} from './config.js'
import type { InsMedia } from './schema.js'

/**
 * Live Astro loader that loads Instagram medias on each request.
 *
 * @see https://github.com/lin-stephanie/astro-loaders/tree/main/packages/astro-loader-ins-medias
 */
export class LiveInsMediasLoaderError extends Error {
  constructor(
    message: string,
    public code?: string,
    public mediaId?: string
  ) {
    super(message)
    this.name = 'LiveInsMediasLoaderError'
  }
}

export function liveInsMediasLoader(
  userConfig: LiveInsMediasLoaderUserConfig
): LiveLoader<
  InsMedia,
  LiveEntryFilter,
  LiveCollectionFilter,
  LiveInsMediasLoaderError
> {
  const baseUrl = DEFAULT_BASE_URL

  const parsed = LiveInsMediasLoaderUserConfigSchema.safeParse(userConfig)
  if (!parsed.success)
    throw new LiveInsMediasLoaderError(
      `The configuration provided is invalid. ${parsed.error.issues
        .map((issue) => issue.message)
        .join(
          '\n'
        )}. Check out the configuration: https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-ins-medias/README.md#liveinsmediasloader-options.`,
      'INVALID_CONFIG'
    )

  const { fields: defaultFields, apiVersion, instagramToken } = parsed.data

  const token = instagramToken || import.meta.env.INSTAGRAM_TOKEN
  if (!token) {
    throw new LiveInsMediasLoaderError(
      'No Instagram token provided. Please provide a `instagramToken` or set the `INSTAGRAM_TOKEN` environment variable.\nHow to get an access token via the App Dashboard: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/get-started.\nHow to store token in Astro project environment variables: https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables.',
      'MISSING_TOKEN'
    )
  }

  return {
    name: 'live-ins-medias',

    loadCollection: async ({ filter }) => {
      const parsedFilter = LiveCollectionFilterSchema.safeParse(filter)
      if (!parsedFilter.success) {
        return {
          error: new LiveInsMediasLoaderError(
            `The filter provided is invalid. ${parsedFilter.error.issues
              .map((issue) => issue.message)
              .join(
                '\n'
              )}. Check out the filter: https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-ins-medias/README.md#liveinsmediasloader-collection-filters.`,
            'INVALID_FILTER'
          ),
        }
      }

      const { fields, mediaTypes, since, until, limit } = parsedFilter.data
      const usedFields = fields || defaultFields

      try {
        const items = await fetchMedias({
          baseUrl: baseUrl,
          version: apiVersion,
          token: token,
          fields: usedFields,
          mediaTypes: mediaTypes,
          since: since,
          until: until,
          limit: limit,
          isLive: true,
          isIncremental: false,
        })

        return {
          entries: items.map((item) => ({ id: item.id, data: item })),
        }
      } catch (error) {
        if (
          error instanceof Error &&
          'code' in error &&
          error.code === 'INS_API_QUERY_ERROR'
        ) {
          return {
            error: new LiveInsMediasLoaderError(error.message, error.code),
          }
        }

        return {
          error: new LiveInsMediasLoaderError(
            'Failed to load Instagram medias.',
            'COLLECTION_LOAD_ERROR'
          ),
        }
      }
    },

    loadEntry: async ({ filter }) => {
      const parsedFilter = LiveEntryFilterSchema.safeParse(filter)
      if (!parsedFilter.success) {
        return {
          error: new LiveInsMediasLoaderError(
            `The filter provided is invalid. ${parsedFilter.error.issues
              .map((issue) => issue.message)
              .join(
                '\n'
              )}. Check out the filter: https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-ins-medias/README.md#liveinsmediasloader-entry-filters.`,
            'INVALID_FILTER'
          ),
        }
      }

      const { mediaId, fields } = parsedFilter.data
      const usedFields = fields || defaultFields

      try {
        const url = new URL(`${baseUrl}/${apiVersion}/${mediaId}`)
        url.searchParams.set('access_token', token)
        url.searchParams.set('fields', usedFields)

        const media = await requestInsApi<InsMedia>(url.toString(), true)

        return {
          id: media.id,
          data: media,
        }
      } catch (error) {
        if (
          error instanceof Error &&
          'code' in error &&
          error.code === 'INS_API_QUERY_ERROR'
        ) {
          return {
            error: new LiveInsMediasLoaderError(error.message, error.code),
          }
        }

        return {
          error: new LiveInsMediasLoaderError(
            'Failed to load Instagram media.',
            'ENTRY_LOAD_ERROR',
            String(mediaId)
          ),
        }
      }
    },
  }
}
