import { Octokit } from 'octokit'
import { print } from 'graphql'
import { GetReleasesDocument } from './graphql/gen/operations.js'
import { getSinceDate, getValidReleaseNode } from './utils.js'

import type { LoaderContext } from 'astro/loaders'
import type { GithubReleasesLoaderOutputConfig } from './config.js'
import type {
  GetReleasesQuery,
  GetReleasesQueryVariables,
} from './graphql/gen/operations.js'
import type { ReleaseByIdFromRepos, ReleaseByRepoFromRepos } from './schema.js'

const PER_PAGE = 100

export async function fetchReleasesByRepoList(
  config: Omit<GithubReleasesLoaderOutputConfig, 'clearStore'>,
  token: string,
  logger?: LoaderContext['logger']
): Promise<ReleaseByIdFromRepos[] | ReleaseByRepoFromRepos[]> {
  const { repos, sinceDate, monthsBack, entryReturnType } = config

  logger?.info(
    `Loading GitHub releases for ${repos.length} ${repos.length > 1 ? 'repositories' : 'repository'}`
  )

  const releasesById: ReleaseByIdFromRepos[] = []
  const releasesByRepo: ReleaseByRepoFromRepos[] = []

  let sinceDateMs: null | number = null
  if (monthsBack || sinceDate) sinceDateMs = getSinceDate(monthsBack, sinceDate)
  const octokit = new Octokit({ auth: token })

  try {
    for (const repo of repos) {
      const [owner, repoName] = repo.split('/')
      const releasesPreRepo: ReleaseByIdFromRepos[] = []

      let hasNextPage = true
      let cursor: string | null = null

      while (hasNextPage) {
        const variables: GetReleasesQueryVariables = {
          owner,
          repo: repoName,
          first: PER_PAGE,
          cursor,
        }

        const res = await octokit.graphql<GetReleasesQuery>(
          print(GetReleasesDocument),
          {
            headers: {
              'X-Github-Next-Global-ID': '1',
            },
            ...variables,
          }
        )

        const nodes = res.repository?.releases.nodes || []
        const releasesPerPage = nodes
          .map((node) => getValidReleaseNode(node))
          .filter((node) => node !== null)
          .filter(
            (node) =>
              sinceDateMs === null || +new Date(node.createdAt) >= sinceDateMs
          )

        let stopFetching = false
        const lastNode = nodes.at(-1)
        if (
          sinceDateMs !== null &&
          lastNode &&
          +new Date(lastNode.createdAt) < sinceDateMs
        )
          stopFetching = true

        if (entryReturnType === 'byRelease')
          releasesById.push(...releasesPerPage)
        if (entryReturnType === 'byRepository')
          releasesPreRepo.push(...releasesPerPage)

        hasNextPage =
          (res.repository?.releases.pageInfo.hasNextPage && !stopFetching) ||
          false
        cursor = res.repository?.releases.pageInfo.endCursor || null
      }

      if (entryReturnType === 'byRepository') {
        releasesByRepo.push({
          repo: repo,
          releases: releasesPreRepo,
        })
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(message)
  }

  return entryReturnType === 'byRelease' ? releasesById : releasesByRepo
}
