import { readFileSync } from 'node:fs'

import { Octokit } from 'octokit'

import pkg from '../package.json' with { type: 'json' }
import { GithubPrsLoaderConfigSchema } from './config.js'
import { GithubPrSchema } from './schema.js'
import { getQueryWithMonthsBack } from './utils.js'

import type { Loader } from 'astro/loaders'
import type { GithubPrsLoaderUserConfig } from './config.js'
import type { GetPrsQuery, GetPrsQueryVariables } from './graphql/types.js'
import type { GithubPr } from './schema.js'

/**
 * Astro loader for loading GitHub pull requests with a search query.
 *
 * @see https://github.com/lin-stephanie/astro-loaders/tree/main/packages/astro-loader-github-prs
 */
function githubPrsLoader(userConfig: GithubPrsLoaderUserConfig): Loader {
  return {
    name: 'astro-loader-github-prs',
    schema: GithubPrSchema,
    async load({ logger, store, parseData, generateDigest }) {
      const parsedConfig = GithubPrsLoaderConfigSchema.safeParse(userConfig)
      if (!parsedConfig.success) {
        logger.error(
          `The configuration provided is invalid. ${parsedConfig.error.issues.map((issue) => issue.message).join('\n')}. Check out the configuration: https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-github-prs/README.md#configuration.`
        )
        return
      }

      const { search, monthsBack, githubToken, clearStore } = parsedConfig.data
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
      const getPrsQuery = readFileSync(
        new URL('./graphql/query.graphql', import.meta.url),
        'utf8'
      )
      const octokit = new Octokit({ auth: token })

      logger.info(
        `Loading GitHub pull requests with a search query: '${parsedSearch}'`
      )

      try {
        let hasNextPage = true
        let cursor: string | null = null

        while (hasNextPage) {
          const variables: GetPrsQueryVariables = {
            search: parsedSearch,
            first: 100,
            cursor,
          }
          const res = await octokit.graphql<GetPrsQuery>(getPrsQuery, variables)

          const prsPerPage =
            res.search.nodes
              ?.filter(
                (node) =>
                  node !== null &&
                  node !== undefined &&
                  typeof node === 'object' &&
                  'id' in node
              )
              .map((node) => {
                return {
                  id: node.id,
                  url: node.url || '',
                  title: node.title,
                  titleHTML: node.titleHTML || '',
                  number: node.number,
                  state: node.state,
                  isDraft: node.isDraft,
                  body: node.body,
                  bodyHTML: node.bodyHTML || '',
                  bodyText: node.bodyText,
                  author: {
                    login: node.author?.login || '',
                    url: node.author?.url || '',
                    avatarUrl: node.author?.avatarUrl || '',
                  },
                  repository: {
                    name: node.repository.name,
                    nameWithOwner: node.repository.nameWithOwner,
                    url: node.repository.url || '',
                    stargazerCount: node.repository.stargazerCount,
                    isInOrganization: node.repository.isInOrganization,
                    owner: {
                      login: node.repository.owner.login || '',
                      url: node.repository.owner.url || '',
                      avatarUrl: node.repository.owner.avatarUrl || '',
                    },
                  },
                  createdAt: node.createdAt || '',
                  mergedAt: node.mergedAt || '',
                }
              }) || []

          prs.push(...prsPerPage)

          hasNextPage = res.search.pageInfo.hasNextPage || false
          cursor = res.search.pageInfo.endCursor || null
        }

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
        logger.error(
          `Failed to load GitHub pull requests. ${(error as Error).message}`
        )
      }
    },
  }
}

export { githubPrsLoader }
export type { GithubPrsLoaderUserConfig } from './config.js'
