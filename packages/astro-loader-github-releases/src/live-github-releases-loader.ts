import { getSecret } from 'astro:env/server'
import { Octokit } from 'octokit'

import {
  LiveGithubReleasesLoaderUserConfigSchema,
  LiveCollectionFilterSchema,
  LiveEntryFilterSchema,
} from './config.js'
import { fetchReleasesByRepoList } from './releases.js'
import {
  GetReleaseByIdDocument,
  GetReleaseByTagNameDocument,
} from './graphql/gen/operations.js'
import { getValidReleaseNode } from './utils.js'

import type { LiveLoader } from 'astro/loaders'
import type {
  LiveGithubReleasesLoaderUserConfig,
  LiveCollectionFilter,
  LiveEntryFilter,
} from './config.js'
import type {
  GetReleaseByIdQuery,
  GetReleaseByIdQueryVariables,
  GetReleaseByTagNameQuery,
  GetReleaseByTagNameQueryVariables,
} from './graphql/gen/operations.js'
import type { ReleaseByIdFromRepos, ReleaseByRepoFromRepos } from './schema.js'

type LiveGithubReleasesEntry = ReleaseByIdFromRepos | ReleaseByRepoFromRepos

export class LiveGithubReleasesLoaderError extends Error {
  constructor(
    message: string,
    public code?: string,
    public identifier?: string
  ) {
    super(message)
    this.name = 'LiveGithubReleasesLoaderError'
  }
}

/**
 * Live Astro loader that fetches releases at runtime on each request.
 * Fetches releases from repository lists or a single release by its identifier.
 *
 * @see https://github.com/lin-stephanie/astro-loaders/tree/main/packages/astro-loader-github-releases#livegithubreleasesloader-live-collection-experimental
 */
export function liveGithubReleasesLoader(
  userConfig?: LiveGithubReleasesLoaderUserConfig
): LiveLoader<
  LiveGithubReleasesEntry,
  LiveEntryFilter,
  LiveCollectionFilter,
  LiveGithubReleasesLoaderError
> {
  let githubToken: string | undefined
  if (userConfig) {
    const parsedConfig =
      LiveGithubReleasesLoaderUserConfigSchema.safeParse(userConfig)
    if (!parsedConfig.success)
      throw new LiveGithubReleasesLoaderError(
        `The configuration provided is invalid. ${parsedConfig.error.issues
          .map((issue) => issue.message)
          .join(
            '\n'
          )}. Check out the configuration: https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-github-releases/README.md#livegithubreleasesloader-options.`,
        'INVALID_CONFIG'
      )

    githubToken = parsedConfig.data.githubToken
  }

  return {
    name: 'live-github-releases',

    async loadCollection({ filter }) {
      const parsedFilter = LiveCollectionFilterSchema.safeParse(filter)
      if (!parsedFilter.success)
        return {
          error: new LiveGithubReleasesLoaderError(
            `The filter provided is invalid. ${parsedFilter.error.issues
              .map((issue) => issue.message)
              .join(
                '\n'
              )}. Check out the filter: https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-github-releases/README.md#livegithubreleasesloader-collection-filters.`,
            'INVALID_FILTER'
          ),
        }

      const parsed = parsedFilter.data

      const config = parsed
      const token = githubToken || getSecret('GITHUB_TOKEN')
      if (!token)
        return {
          error: new LiveGithubReleasesLoaderError(
            'No GitHub token provided. Please provide a `githubToken` or set the `GITHUB_TOKEN` environment variable.\nHow to create a GitHub PAT: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic.\nHow to store token in Astro project environment variables: https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables.',
            'MISSING_TOKEN'
          ),
        }

      try {
        const releases = await fetchReleasesByRepoList(config, token)

        return {
          entries: releases.map((release) => ({
            id: 'id' in release ? release.id : release.repo,
            data: release,
            rendered:
              'descriptionHTML' in release
                ? { html: release.descriptionHTML || '' }
                : undefined,
          })),
        }
      } catch (error) {
        return {
          error: new LiveGithubReleasesLoaderError(
            'Failed to load GitHub releases.',
            'COLLECTION_LOAD_ERROR'
          ),
        }
      }
    },

    async loadEntry({ filter }) {
      const parsedFilter = LiveEntryFilterSchema.safeParse(filter)
      if (!parsedFilter.success)
        return {
          error: new LiveGithubReleasesLoaderError(
            `The filter provided is invalid. ${parsedFilter.error.issues
              .map((issue) => issue.message)
              .join(
                '\n'
              )}. Check out the filter: https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-github-releases/README.md#livegithubreleasesloader-entry-filters.`,
            'INVALID_FILTER'
          ),
        }

      const token = githubToken || getSecret('GITHUB_TOKEN')
      if (!token) {
        return {
          error: new LiveGithubReleasesLoaderError(
            'No GitHub token provided. Please provide a `githubToken` or set the `GITHUB_TOKEN` environment variable.\nHow to create a GitHub PAT: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic.\nHow to store token in Astro project environment variables: https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables.',
            'MISSING_TOKEN'
          ),
        }
      }

      const { identifier } = parsedFilter.data

      const octokit = new Octokit({ auth: token })

      try {
        if (typeof identifier === 'string') {
          const variables: GetReleaseByIdQueryVariables = {
            id: identifier,
          }
          const res = await octokit.graphql<GetReleaseByIdQuery>(
            String(GetReleaseByIdDocument),
            {
              headers: {
                'X-Github-Next-Global-ID': '1',
              },
              ...variables,
            }
          )

          const release = getValidReleaseNode(res.node)
          if (!release) {
            return {
              error: new LiveGithubReleasesLoaderError(
                `The identifier '${identifier}' did not resolve to a GitHub Release.`,
                'INVALID_IDENTIFIER',
                identifier
              ),
            }
          }

          return {
            id: release.id,
            data: release,
            rendered: { html: release.descriptionHTML || '' },
          }
        }

        if (typeof identifier === 'object') {
          const variables: GetReleaseByTagNameQueryVariables = {
            owner: identifier.owner,
            repo: identifier.repo,
            tagName: identifier.tagName,
          }
          const res = await octokit.graphql<GetReleaseByTagNameQuery>(
            String(GetReleaseByTagNameDocument),
            {
              headers: {
                'X-Github-Next-Global-ID': '1',
              },
              ...variables,
            }
          )

          const release = getValidReleaseNode(res.repository?.release)
          if (!res.repository || !release) {
            return {
              error: new LiveGithubReleasesLoaderError(
                `The identifier '${identifier}' did not resolve to a GitHub Release.`,
                'INVALID_IDENTIFIER',
                String(identifier)
              ),
            }
          }

          return {
            id: release.id,
            data: release,
            rendered: { html: release.descriptionHTML || '' },
          }
        }
      } catch (error) {
        return {
          error: new LiveGithubReleasesLoaderError(
            'Failed to load GitHub release.',
            'ENTRY_LOAD_ERROR',
            String(identifier)
          ),
        }
      }
    },
  }
}
