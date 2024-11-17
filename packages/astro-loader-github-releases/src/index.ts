import { AstroError } from 'astro/errors'

import pkg from '../package.json'
import {
  GithubReleasesLoaderConfigSchema,
  repoListtDefaultConfig,
  userCommitDefaultConfig,
} from './config.js'
import {
  fetchReleasesByRepoList,
  fetchReleasesByUserCommit,
} from './releases.js'
import { getEntrySchema } from './schema.js'

import type { Loader } from 'astro/loaders'
import type { GithubReleasesLoaderUserConfig } from './config.js'

function githubReleasesLoader(
  userConfig: GithubReleasesLoaderUserConfig
): Loader {
  const parsedConfig = GithubReleasesLoaderConfigSchema.safeParse(userConfig)
  if (!parsedConfig.success) {
    throw new AstroError(
      `The configuration provided in '${pkg.name}' is invalid. Refer to the following error report
        or access configuration details for this loader here: ${pkg.homepage}#Options.`,
      `${parsedConfig.error.issues.map((issue) => issue.message).join('\n')}`
    )
  }
  const parsedUserConfig = parsedConfig.data

  return {
    name: pkg.name,
    schema: getEntrySchema(parsedUserConfig),
    async load({ meta, store, logger, parseData /* , generateDigest */ }) {
      if (parsedUserConfig.fetchMode === 'userCommit') {
        logger.info(
          `Loading GitHub releases for user @${parsedUserConfig.modeConfig.username} using the 'userCommit' mode.`
        )

        const modeConfig = {
          ...userCommitDefaultConfig,
          ...parsedUserConfig.modeConfig,
        }
        const { status, releases } = await fetchReleasesByUserCommit(
          modeConfig,
          meta
        )

        if (status === 304) logger.info('No new release data since last fetch.')

        if (status === 200) {
          logger.info('Successfully loaded the latest release data.')
          for (const item of releases) {
            const parsedItem = await parseData({ id: item.id, data: item })
            store.set({ id: item.id, data: parsedItem })
          }
        }

        logger.info('Successfully saved the loaded release data to the store.')
      } else if (parsedUserConfig.fetchMode === 'repoList') {
        logger.info(
          `Loading release data for ${parsedUserConfig.modeConfig.repos.join(', ')} using the 'repoList' mode.`
        )

        const modeConfig = {
          ...repoListtDefaultConfig,
          ...parsedUserConfig.modeConfig,
        }
        const releases = await fetchReleasesByRepoList(modeConfig)

        logger.info('Successfully loaded the latest release data.')

        store.clear()
        for (const item of releases) {
          if ('id' in item && modeConfig.entryReturnType === 'byRelease') {
            const parsedItem = await parseData({ id: item.id, data: item })
            store.set({ id: item.id, data: parsedItem })
          } else if ('repo' in item) {
            const parsedItem = await parseData({ id: item.repo, data: item })
            store.set({ id: item.repo, data: parsedItem })
          }
        }

        logger.info('Successfully saved the loaded release data to the store.')
      } else
        throw new AstroError(
          `The configuration provided in '${pkg.name}' is invalid.`,
          "`fetchMode` can only be 'userCommit' or 'repoList'."
        )
    },
  }
}

export default githubReleasesLoader
export type { GithubReleasesLoaderUserConfig } from './config.js'
