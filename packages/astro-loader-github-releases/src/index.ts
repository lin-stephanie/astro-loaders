import { AstroError } from 'astro/errors'

import pkg from '../package.json' with { type: 'json' }
import {
  GithubReleasesLoaderConfigSchema,
  repoListDefaultConfig,
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
 * Aatro loader for loading GitHub releases from a given user or multiple repositories.
 *
 * @see https://github.com/lin-stephanie/astro-loaders/tree/main/packages/astro-loader-github-releases
 */
function githubReleasesLoader(
  userConfig: GithubReleasesLoaderUserConfig
): Loader {
  const parsedConfig = GithubReleasesLoaderConfigSchema.safeParse(userConfig)
  if (!parsedConfig.success) {
    throw new AstroError(
      `${parsedConfig.error.issues.map((issue) => issue.message).join('\n')}. \nCheck out the configuration for this loader: ${pkg.homepage}#configuration.`
    )
  }
  const parsedUserConfig = parsedConfig.data

  return {
    name: pkg.name,
    schema: getEntrySchema(parsedUserConfig),
    async load({ meta, store, logger, parseData /* , generateDigest */ }) {
      if (parsedUserConfig.loadMode === 'userCommit') {
        logger.info(
          `Loading GitHub releases for the user @${parsedUserConfig.modeConfig.username}`
        )

        const modeConfig = {
          ...userCommitDefaultConfig,
          ...parsedUserConfig.modeConfig,
        }
        const { status, releases } = await fetchReleasesByUserCommit(
          modeConfig,
          meta
        )

        if (status === 304)
          logger.info('No new GitHub releases since last fetch')

        if (status === 200) {
          for (const item of releases) {
            const parsedItem = await parseData({ id: item.id, data: item })
            store.set({ id: item.id, data: parsedItem })
          }
          logger.info('Successfully loaded GitHub releases')
        }
      }

      if (parsedUserConfig.loadMode === 'repoList') {
        const repoNum = parsedUserConfig.modeConfig.repos.length
        logger.info(
          `Loading GitHub releases for ${repoNum} ${repoNum > 1 ? 'repositories' : 'repository'}`
        )

        const modeConfig = {
          ...repoListDefaultConfig,
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
        logger.info('Successfully loaded GitHub releases')
      }
    },
  }
}

export { githubReleasesLoader }
export type { GithubReleasesLoaderUserConfig } from './config.js'
