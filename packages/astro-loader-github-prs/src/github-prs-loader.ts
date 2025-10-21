import { Octokit } from 'octokit'
import { print } from 'graphql'

import { GetPrsDocument } from './graphql/gen/operations.js'
import { GithubPrsLoaderUserConfigSchema } from './config.js'
import { GithubPrSchema } from './schema.js'
import { getQueryWithMonthsBack, getValidPrNode } from './utils.js'

import type { Loader } from 'astro/loaders'
import type { GithubPrsLoaderUserConfig } from './config.js'
import type { GithubPr } from './schema.js'
import type {
  GetPrsQuery,
  GetPrsQueryVariables,
} from './graphql/gen/operations.js'

/**
 * Build-time Astro loader that loads multiple PRs at build time using a search query.
 *
 * @see https://github.com/lin-stephanie/astro-loaders/tree/main/packages/astro-loader-github-prs#githubprsloader-build-time-collection
 */
export function githubPrsLoader(userConfig: GithubPrsLoaderUserConfig): Loader {
  return {
    name: 'github-prs',
    schema: GithubPrSchema,
    async load({ logger, store, parseData, generateDigest }) {
      const parsed = GithubPrsLoaderUserConfigSchema.safeParse(userConfig)
      if (!parsed.success) {
        logger.error(
          `The configuration provided is invalid. ${parsed.error.issues
            .map((issue) => issue.message)
            .join(
              '\n'
            )}. Check out the configuration: https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-github-prs/README.md#githubprsloader-options.`
        )
        return
      }

      const { search, monthsBack, maxEntries, clearStore, githubToken } =
        parsed.data
      const token = githubToken || import.meta.env.GITHUB_TOKEN

      if (search.length === 0) {
        logger.warn(
          'Search string is empty and no pull requests will be loaded'
        )
        return
      }

      if (!token) {
        logger.warn(
          'No GitHub token provided. Please provide a `githubToken` or set the `GITHUB_TOKEN` environment variable.\nHow to create a GitHub PAT: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic.\nHow to store token in Astro project environment variables: https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables.'
        )
        return
      }

      const prs: GithubPr[] = []
      const parsedSearch = getQueryWithMonthsBack(search, monthsBack)
      const octokit = new Octokit({ auth: token })

      logger.info(
        `Loading GitHub pull requests with a search query: '${parsedSearch}'`
      )

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
            res.search.nodes
              ?.map((node) => getValidPrNode(node))
              .filter((node) => node !== null) || []

          if (maxEntries && count + prsPerPage.length > maxEntries) {
            prsPerPage.splice(maxEntries - count)
          }

          prs.push(...prsPerPage)
          count += prsPerPage.length

          hasNextPage = res.search.pageInfo.hasNextPage
          cursor = res.search.pageInfo.endCursor || null
        } while (hasNextPage && (!maxEntries || count < maxEntries))

        if (clearStore) store.clear()
        for (const item of prs) {
          const parsedItem = await parseData({ id: item.id, data: item })
          store.set({
            id: item.id,
            data: parsedItem,
            rendered: { html: item.bodyHTML },
            digest: generateDigest(parsedItem),
          })
        }

        logger.info('Successfully loaded GitHub pull requests')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        logger.error(`Failed to load GitHub pull requests. ${message}`)
      }
    },
  }
}
