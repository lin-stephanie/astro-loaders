import pkg from '../package.json' with { type: 'json' }
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
    name: pkg.name,
    schema: getEntrySchema(userConfig),
    async load({ meta, store, logger, parseData, generateDigest }) {
      const parsedConfig =
        GithubReleasesLoaderConfigSchema.safeParse(userConfig)
      if (!parsedConfig.success) {
        logger.error(
          `The configuration provided is invalid. ${parsedConfig.error.issues.map((issue) => issue.message).join('\n')}.
Check out the configuration: ${pkg.homepage}README.md#configuration.`
        )
        return
      }

      const parsedUserConfig = parsedConfig.data
      if (parsedUserConfig.loadMode === 'userCommit') {
        const { status, releases, error } = await fetchReleasesByUserCommit(
          parsedUserConfig.modeConfig,
          meta,
          logger
        )

        if (status === 304) {
          logger.info('No new GitHub releases since last fetch')
        } else if (status === 200) {
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

      if (parsedUserConfig.loadMode === 'repoList') {
        try {
          const releases = await fetchReleasesByRepoList(
            parsedUserConfig.modeConfig,
            logger
          )

          for (const item of releases) {
            if (
              'id' in item &&
              parsedUserConfig.modeConfig.entryReturnType === 'byRelease'
            ) {
              const parsedItem = await parseData({ id: item.id, data: item })
              store.set({
                id: item.id,
                data: parsedItem,
                digest: generateDigest(parsedItem),
                rendered: { html: item.descriptionHTML },
              })
            } else if (
              'repo' in item &&
              parsedUserConfig.modeConfig.entryReturnType === 'byRepository'
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
