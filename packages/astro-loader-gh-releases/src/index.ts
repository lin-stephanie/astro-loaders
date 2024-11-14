import { AstroError } from 'astro/errors'
import {
  GithubReleasesLoaderConfigSchema,
  userCommitDefaultConfig,
} from './config.js'
import { UserCommitReleaseItemSchema } from './schema.js'
import { fetchReleasesByUserCommit } from './releases.js'
import pkg from '../package.json'

import type { Loader } from 'astro/loaders'
import type { GithubReleasesLoaderUserConfig } from './config.js'

function githubReleasesLoader(
  userConfig: GithubReleasesLoaderUserConfig
): Loader {
  // check and retrieve user configuration
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
    schema: UserCommitReleaseItemSchema,
    async load({ meta, store, logger, parseData, generateDigest }) {
      if (parsedUserConfig.fetchMode === 'userCommit') {
        logger.info(
          `Loading release data for user @${parsedUserConfig.modeConfig.username} in 'userCommit' mode.`
        )

        const modeConfig = {
          ...userCommitDefaultConfig,
          ...parsedUserConfig.modeConfig,
        }

        const { status, releases } = await fetchReleasesByUserCommit(
          modeConfig,
          meta,
          logger
        )

        if (status === 304) logger.info('Release data not modified, skipping')

        if (status === 200) {
          logger.info('Successfully loaded the latest release data.')

          // store.clear()

          for (const item of releases) {
            const parsedItem = await parseData({ id: item.id, data: item })
            store.set({ id: item.id, data: parsedItem })
          }
        }
      } else if (parsedUserConfig.fetchMode === 'repoList') {
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
