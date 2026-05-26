import { fetchReleasesByRepoList } from './releases.js'
import { getEntrySchema } from './schema.js'
import { GithubReleasesLoaderUserConfigSchema } from './config.js'

import type { Loader } from 'astro/loaders'
import type { GithubReleasesLoaderUserConfig } from './config.js'
import type { GithubReleasesEntrySchema } from './schema.js'

/**
 * Build-time Astro loader that loads multiple GitHub releases at build time.
 * Loads releases from a list of repositories.
 *
 * @see https://github.com/lin-stephanie/astro-loaders/tree/main/packages/astro-loader-github-releases#githubreleasesloader-build-time-collection
 */
export function githubReleasesLoader<
  TConfig extends GithubReleasesLoaderUserConfig,
>(
  userConfig: TConfig
): Loader & { schema: GithubReleasesEntrySchema<TConfig> } {
  return {
    name: 'github-releases',
    schema: getEntrySchema(userConfig),
    async load({ store, logger, parseData, generateDigest }) {
      const parsed = GithubReleasesLoaderUserConfigSchema.safeParse(userConfig)
      if (!parsed.success) {
        logger.error(
          `The configuration provided is invalid. ${parsed.error.issues
            .map((issue) => issue.message)
            .join(
              '\n'
            )}. Check out the configuration: https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-github-releases/README.md#configuration.`
        )
        return
      }

      try {
        const { clearStore, ...config } = parsed.data
        const token = config.githubToken || import.meta.env.GITHUB_TOKEN
        if (!token) {
          logger.warn(
            'No GitHub token provided. Please provide a `githubToken` or set the `GITHUB_TOKEN` environment variable.\nHow to create a GitHub PAT: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic.\nHow to store token in Astro project environment variables: https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables.'
          )
          return
        }

        const releases = await fetchReleasesByRepoList(config, token, logger)

        if (clearStore) store.clear()
        for (const item of releases) {
          if ('id' in item && config.entryReturnType === 'byRelease') {
            const parsedItem = await parseData({ id: item.id, data: item })
            store.set({
              id: item.id,
              data: parsedItem,
              digest: generateDigest(parsedItem),
              rendered: { html: item.descriptionHTML || '' },
            })
          }

          if ('repo' in item && config.entryReturnType === 'byRepository') {
            const parsedItem = await parseData({ id: item.repo, data: item })
            store.set({
              id: item.repo,
              data: parsedItem,
              digest: generateDigest(parsedItem),
            })
          }
        }
        logger.info('Successfully loaded GitHub releases')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        logger.error(`Failed to load GitHub releases. ${message}`)
      }
    },
  } satisfies Loader
}
