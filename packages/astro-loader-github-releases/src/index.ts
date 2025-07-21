import { GithubReleasesLoaderConfigSchema } from './config.js'
import {
  fetchReleasesByRepoList,
  fetchReleasesByUserCommit,
} from './releases.js'
import { getEntrySchema } from './schema.js'

import type { Loader } from 'astro/loaders'
import type { GithubReleasesLoaderUserConfig } from './config.js'

/**
 * Astro loader for loading GitHub releases from a user's commit history or a list of repositories.
 *
 * @see https://github.com/lin-stephanie/astro-loaders/tree/main/packages/astro-loader-github-releases
 */
function githubReleasesLoader(
  userConfig: GithubReleasesLoaderUserConfig
): Loader {
  return {
    name: 'astro-loader-github-releases',
    schema: getEntrySchema(userConfig),
    async load({ meta, store, logger, parseData, generateDigest }) {
      const parsedConfig =
        GithubReleasesLoaderConfigSchema.safeParse(userConfig)
      if (!parsedConfig.success) {
        logger.error(
          `The configuration provided is invalid. ${parsedConfig.error.issues.map((issue) => issue.message).join('\n')}. Check out the configuration: https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-github-releases/README.md#configuration.`
        )
        return
      }

      const parsedUserConfig = parsedConfig.data
      if (parsedUserConfig.mode === 'userCommit') {
        const { mode, clearStore, ...config } = parsedUserConfig
        const { status, releases, error } = await fetchReleasesByUserCommit(
          config,
          meta,
          logger
        )

        if (status === 304) {
          logger.info('No new GitHub releases since last fetch')
        } else if (status === 200) {
          if (clearStore) store.clear()
          for (const item of releases) {
            const parsedItem = await parseData({ id: item.id, data: item })
            store.set({
              id: item.id,
              data: parsedItem,
              digest: generateDigest(parsedItem),
            })
          }
          logger.info('Successfully loaded GitHub releases')
        } else {
          logger.error(`Failed to load GitHub releases. ${error}`)
        }
      }

      if (parsedUserConfig.mode === 'repoList') {
        try {
          const { mode, clearStore, ...config } = parsedUserConfig
          const token = config.githubToken || import.meta.env.GITHUB_TOKEN
          if (!token) {
            logger.warn(
              'No GitHub token provided. Please provide a `githubToken` or set the `GITHUB_TOKEN` environment variable.\nHow to create a GitHub PAT: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic.\nHow to store token in Astro project environment variables: https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables.'
            )
            return
          }

          const releases = await fetchReleasesByRepoList(config, logger)

          if (clearStore) store.clear()
          for (const item of releases) {
            if ('id' in item && config.entryReturnType === 'byRelease') {
              const parsedItem = await parseData({ id: item.id, data: item })
              store.set({
                id: item.id,
                data: parsedItem,
                digest: generateDigest(parsedItem),
                rendered: { html: item.descriptionHTML },
              })
            } else if (
              'repo' in item &&
              config.entryReturnType === 'byRepository'
            ) {
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
          logger.error(`Failed to load GitHub releases. ${error}`)
        }
      }
    },
  }
}

export { githubReleasesLoader }
export type { GithubReleasesLoaderUserConfig } from './config.js'
