import { AstroError } from 'astro/errors'
import { Octokit } from 'octokit'

import { readFileSync } from 'node:fs'

import pkg from '../package.json'
import { GithubPrsLoaderConfigSchema } from './config.js'
import { GithubPrSchema } from './schema.js'

import type { Loader } from 'astro/loaders'
import type { GithubPrsLoaderUserConfig } from './config.js'
import type { GetPrsQuery, GetPrsQueryVariables } from './graphql/types.js'
import type { GithubPr } from './schema.js'

/**
 * Aatro loader for loading GitHub pull reuqests from a given GitHub search string.
 *
 * @see https://github.com/lin-stephanie/astro-loaders/tree/main/packages/astro-loader-github-prs
 */
function githubPrsLoader(userConfig: GithubPrsLoaderUserConfig): Loader {
  const parsedConfig = GithubPrsLoaderConfigSchema.safeParse(userConfig)
  if (!parsedConfig.success) {
    throw new AstroError(
      `The configuration provided in '${pkg.name}' is invalid. Refer to the following error report or access configuration details for this loader here: ${pkg.homepage}#configuration.`,
      `${parsedConfig.error.issues.map((issue) => issue.message).join('\n')}`
    )
  }
  const parsedUserConfig = parsedConfig.data

  return {
    name: pkg.name,
    schema: GithubPrSchema,
    async load({ logger, store, parseData }) {
      const { search, githubToken } = parsedUserConfig
      const prs: GithubPr[] = []
      const query = `type:pr ${search}`
      const getPrsQuery = readFileSync(
        new URL('./graphql/query.graphql', import.meta.url),
        'utf8'
      )
      const octokit = new Octokit({
        auth: githubToken || import.meta.env.GITHUB_TOKEN,
      })

      logger.info(
        `Loading pull reuqests based on the search string: '${query}'.`
      )

      try {
        let hasNextPage = true
        let cursor: string | null = null

        while (hasNextPage) {
          const variables: GetPrsQueryVariables = {
            search: query,
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
      } catch (error) {
        throw new AstroError(
          `Failed to load pull requests: ${(error as Error).message}`
        )
      }

      store.clear()

      for (const item of prs) {
        const parsedItem = await parseData({ id: item.id, data: item })
        store.set({ id: item.id, data: parsedItem })
      }

      logger.info('Successfully loaded the latest pull requests.')
    },
  }
}

export { githubPrsLoader }
export type { GithubPrsLoaderUserConfig } from './config.js'
