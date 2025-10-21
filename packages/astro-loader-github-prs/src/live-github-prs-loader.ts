import { Octokit } from 'octokit'
import { print } from 'graphql'

import {
  GetPrsDocument,
  GetPrByNumberDocument,
  GetPrByIdDocument,
} from './graphql/gen/operations.js'
import {
  LiveGithubPrsLoaderUserConfigSchema,
  LiveCollectionFilterSchema,
  LiveEntryFilterSchema,
} from './config.js'
import { getQueryWithMonthsBack, getValidPrNode } from './utils.js'

import type { LiveLoader } from 'astro/loaders'
import type {
  LiveGithubPrsLoaderUserConfig,
  LiveCollectionFilter,
  LiveEntryFilter,
} from './config.js'
import type { GithubPr } from './schema.js'
import type {
  GetPrsQuery,
  GetPrsQueryVariables,
  GetPrByNumberQuery,
  GetPrByNumberQueryVariables,
  GetPrByIdQuery,
  GetPrByIdQueryVariables,
} from './graphql/gen/operations.js'

export class LiveGithubPrsLoaderError extends Error {
  constructor(
    message: string,
    public code?: string,
    public identifier?: string
  ) {
    super(message)
    this.name = 'LiveGithubPrsLoaderError'
  }
}

/**
 * Live Astro loader that fetches PRs at runtime on each request — multiple PRs by search query or a single PR by identifier.
 *
 * @see https://github.com/lin-stephanie/astro-loaders/tree/main/packages/astro-loader-github-prs#livegithubprsloader-live-collection-experimental
 */
export function liveGithubPrsLoader(
  userConfig?: LiveGithubPrsLoaderUserConfig
): LiveLoader<
  GithubPr,
  LiveEntryFilter,
  LiveCollectionFilter,
  LiveGithubPrsLoaderError
> {
  let githubToken: string | undefined
  if (userConfig) {
    const parsed = LiveGithubPrsLoaderUserConfigSchema.safeParse(userConfig)
    if (!parsed.success)
      throw new LiveGithubPrsLoaderError(
        `The configuration provided is invalid. ${parsed.error.issues
          .map((issue) => issue.message)
          .join(
            '\n'
          )}. Check out the configuration: https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-github-prs/README.md#livegithubprsloader-options.`,
        'INVALID_CONFIG'
      )

    githubToken = parsed.data.githubToken
  }

  const token = githubToken || import.meta.env.GITHUB_TOKEN
  if (!token) {
    throw new LiveGithubPrsLoaderError(
      'No GitHub token provided. Please provide a `githubToken` or set the `GITHUB_TOKEN` environment variable.\nHow to create a GitHub PAT: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic.\nHow to store token in Astro project environment variables: https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables.',
      'MISSING_TOKEN'
    )
  }

  return {
    name: 'live-github-prs',

    async loadCollection({ filter }) {
      const parsedFilter = LiveCollectionFilterSchema.safeParse(filter)
      if (!parsedFilter.success)
        return {
          error: new LiveGithubPrsLoaderError(
            `The filter provided is invalid. ${parsedFilter.error.issues
              .map((issue) => issue.message)
              .join(
                '\n'
              )}. Check out the filter: https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-github-prs/README.md#livegithubprsloader-collection-filters.`,
            'INVALID_FILTER'
          ),
        }

      const { search, monthsBack, maxEntries } = parsedFilter.data

      const prs: GithubPr[] = []
      const parsedSearch = getQueryWithMonthsBack(search, monthsBack)

      const octokit = new Octokit({ auth: token })

      try {
        let hasNextPage: boolean
        let cursor: string | null = null
        let count = 0

        do {
          const variables: GetPrsQueryVariables = {
            search: parsedSearch,
            first: 100,
            cursor,
          }
          const res = await octokit.graphql<GetPrsQuery>(
            print(GetPrsDocument),
            {
              headers: {
                'X-Github-Next-Global-ID': '1',
              },
              ...variables,
            }
          )

          const prsPerPage =
            res.search.nodes?.filter(
              (node) =>
                node !== null &&
                node !== undefined &&
                typeof node === 'object' &&
                'id' in node
            ) || []

          if (maxEntries && count + prsPerPage.length > maxEntries) {
            prsPerPage.splice(maxEntries - count)
          }

          prs.push(...prsPerPage)
          count += prsPerPage.length

          hasNextPage = res.search.pageInfo.hasNextPage
          cursor = res.search.pageInfo.endCursor || null
        } while (hasNextPage && (!maxEntries || count < maxEntries))

        return {
          entries: prs.map((pr) => ({
            id: pr.id,
            data: pr,
            rendered: { html: pr.bodyHTML },
          })),
        }
      } catch (error) {
        return {
          error: new LiveGithubPrsLoaderError(
            'Failed to load pull requests.',
            'COLLECTION_LOAD_ERROR'
          ),
        }
      }
    },

    async loadEntry({ filter }) {
      const parsedFilter = LiveEntryFilterSchema.safeParse(filter)
      if (!parsedFilter.success)
        return {
          error: new LiveGithubPrsLoaderError(
            `The filter provided is invalid. ${parsedFilter.error.issues
              .map((issue) => issue.message)
              .join(
                '\n'
              )}. Check out the filter: https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-github-prs/README.md#livegithubprsloader-entry-filters.`,
            'INVALID_FILTER'
          ),
        }

      const { identifier } = parsedFilter.data

      const octokit = new Octokit({ auth: token })

      try {
        if (typeof identifier === 'string') {
          const variables: GetPrByIdQueryVariables = {
            id: identifier,
          }
          const res = await octokit.graphql<GetPrByIdQuery>(
            print(GetPrByIdDocument),
            {
              headers: {
                'X-Github-Next-Global-ID': '1',
              },
              ...variables,
            }
          )

          const pr = getValidPrNode(res.node)
          if (!pr) return undefined
          return {
            id: pr.id,
            data: pr,
            rendered: { html: pr.bodyHTML },
          }
        }

        if (typeof identifier === 'object') {
          const variables: GetPrByNumberQueryVariables = {
            owner: identifier.owner,
            repo: identifier.repo,
            number: identifier.number,
          }
          const res = await octokit.graphql<GetPrByNumberQuery>(
            print(GetPrByNumberDocument),
            {
              headers: {
                'X-Github-Next-Global-ID': '1',
              },
              ...variables,
            }
          )

          const pr = getValidPrNode(res.repository?.pullRequest)
          if (!pr) return undefined
          return {
            id: pr.id,
            data: pr,
            rendered: { html: pr.bodyHTML },
          }
        }
      } catch (error) {
        return {
          error: new LiveGithubPrsLoaderError(
            'Failed to load pull request.',
            'ENTRY_LOAD_ERROR',
            String(identifier)
          ),
        }
      }
    },
  }
}
