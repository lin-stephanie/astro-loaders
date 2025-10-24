import { Octokit } from 'octokit'
import { print } from 'graphql'

import {
  LiveGithubReleasesLoaderUserConfigSchema,
  LiveCollectionFilterSchema,
  LiveEntryFilterSchema,
} from './config.js'
import {
  fetchReleasesByRepoList,
  fetchReleasesByUserCommit,
} from './releases.js'
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
import type {
  ReleaseByIdFromRepos,
  ReleaseByIdFromUser,
  ReleaseByRepoFromRepos,
} from './schema.js'

type LiveGithubReleasesEntry =
  | ReleaseByIdFromUser
  | ReleaseByIdFromRepos
  | ReleaseByRepoFromRepos

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
 * Supports the same two modes when fetching multiple releases, or fetches a single release by its identifier.
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
        `1The configuration provided is invalid. ${parsedConfig.error.issues
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

      if (parsed.mode === 'userCommit') {
        const { mode, ...config } = parsed
        const { status, releases, error } =
          await fetchReleasesByUserCommit(config)

        if (status === 200)
          return {
            entries: releases.map((release) => ({
              id: release.id,
              data: release,
            })),
          }

        if (status === 304)
          return {
            error: new LiveGithubReleasesLoaderError(
              'No new GitHub releases since last fetch',
              'NO_NEW_RELEASES'
            ),
          }

        return {
          error: new LiveGithubReleasesLoaderError(
            error || 'Unknown error',
            'COLLECTION_LOAD_ERROR'
          ),
        }
      }

      if (parsed.mode === 'repoList') {
        const { mode, ...config } = parsed
        const token = githubToken || import.meta.env.GITHUB_TOKEN
        if (!token)
          return {
            error: new LiveGithubReleasesLoaderError(
              'No GitHub token provided. Please provide a `githubToken` or set the `GITHUB_TOKEN` environment variable.\nHow to create a GitHub PAT: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic.\nHow to store token in Astro project environment variables: https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables.',
              'MISSING_TOKEN'
            ),
          }

        try {
          const releases = await fetchReleasesByRepoList(config)

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
      }

      return {
        error: new LiveGithubReleasesLoaderError(
          'Unknown error',
          'COLLECTION_LOAD_ERROR'
        ),
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

      const token = githubToken || import.meta.env.GITHUB_TOKEN
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
            print(GetReleaseByIdDocument),
            {
              headers: {
                'X-Github-Next-Global-ID': '1',
              },
              ...variables,
            }
          )

          const release = getValidReleaseNode(res.node)
          if (!release) return
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
            print(GetReleaseByTagNameDocument),
            {
              headers: {
                'X-Github-Next-Global-ID': '1',
              },
              ...variables,
            }
          )

          const release = getValidReleaseNode(res.repository?.release)
          if (!release) return
          return {
            id: release.id,
            data: release,
            rendered: { html: release.descriptionHTML || '' },
          }
        }
      } catch (error) {
        return {
          error: new LiveGithubReleasesLoaderError(
            'Failed to load pull request.',
            'ENTRY_LOAD_ERROR',
            String(identifier)
          ),
        }
      }
    },
  }
}
