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

/**
 * Aatro loader for loading GitHub release data from a given user or multiple repositories.
 *
 * @see https://github.com/lin-stephanie/astro-loaders/tree/main/packages/astro-loader-github-releases
 */
function githubReleasesLoader(
  userConfig: GithubReleasesLoaderUserConfig
): Loader {
  const parsedConfig = GithubReleasesLoaderConfigSchema.safeParse(userConfig)
  if (!parsedConfig.success) {
    throw new AstroError(
      `The configuration provided in '${pkg.name}' is invalid. Refer to the following error report or access configuration details for this loader here: ${pkg.homepage}#configuration.`,
      `${parsedConfig.error.issues.map((issue) => issue.message).join('\n')}`
    )
  }
  const parsedUserConfig = parsedConfig.data

  return {
    name: pkg.name,
    schema: getEntrySchema(parsedUserConfig),
    async load({ meta, store, logger, parseData /* , generateDigest */ }) {
      if (parsedUserConfig.loadMode === 'userCommit') {
        logger.info(
          `Loading GitHub releases for the user @${parsedUserConfig.modeConfig.username} in 'userCommit' mode.`
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
          for (const item of releases) {
            const parsedItem = await parseData({ id: item.id, data: item })
            store.set({ id: item.id, data: parsedItem })
          }
          logger.info('Successfully loaded the GitHub releases.')
        }
      } else if (parsedUserConfig.loadMode === 'repoList') {
        const repoNum = parsedUserConfig.modeConfig.repos.length
        logger.info(
          `Loading GitHub releases for ${repoNum} ${repoNum > 1 ? 'repositories' : 'repository'} in 'repoList' mode.`
        )

        const modeConfig = {
          ...repoListtDefaultConfig,
          ...parsedUserConfig.modeConfig,
        }
        const releases = await fetchReleasesByRepoList(modeConfig)

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
        logger.info('Successfully loaded the GitHub releases.')
      } else
        throw new AstroError(
          `The configuration provided in '${pkg.name}' is invalid.`,
          "`loadMode` can only be 'userCommit' or 'repoList'."
        )
    },
  }
}

export { githubReleasesLoader }
export type { GithubReleasesLoaderUserConfig } from './config.js'
