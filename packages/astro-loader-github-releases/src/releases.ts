import { readFileSync } from 'node:fs'
import { Octokit, RequestError } from 'octokit'
import { getSinceDate } from './utils.js'

import type { LoaderContext } from 'astro/loaders'
import type { RepoListOutputConfig, UserCommitOutputConfig } from './config.js'
import type {
  GetReleasesQuery,
  GetReleasesQueryVariables,
} from './graphql/types.js'
import type {
  Commit,
  ReleaseByIdFromRepos,
  ReleaseByIdFromUser,
  ReleaseByRepoFromRepos,
} from './schema.js'

const PER_PAGE = 100
const MAX_PAGE = 3

async function fetchReleasesByUserCommit(
  config: Omit<UserCommitOutputConfig, 'mode' | 'clearStore'>,
  meta: LoaderContext['meta'],
  logger: LoaderContext['logger']
): Promise<{
  status?: 200 | 304
  error?: string
  releases: ReleaseByIdFromUser[]
}> {
  const { username, keyword, tagNameRegex, branches } = config

  logger.info(`Loading GitHub releases for the user @${username}`)

  const releases: ReleaseByIdFromUser[] = []
  const etag = meta.get('etag')
  const lastPushTime = meta.get('lastPushTime')
  const octokit = new Octokit()
  const headers = {
    'X-GitHub-Api-Version': '2022-11-28',
    accept: 'application/vnd.github+json',
    ...(etag ? { 'If-None-Match': etag } : {}),
  }

  let latestPushTime = ''

  fetching: for (let page = 1; page <= MAX_PAGE; page++) {
    try {
      const res = await octokit.request('GET /users/{username}/events/public', {
        headers,
        username,
        per_page: PER_PAGE,
        page,
      })

      if (page === 1 && res.headers.etag && etag !== res.headers.etag)
        meta.set('etag', res.headers.etag)

      const filteredData = res.data
        .filter((item) => item.type === 'PushEvent' && item.public)
        .filter((item) => branches.includes((item.payload as any)?.ref))
        .filter((item) => item.created_at !== null)

      for (const item of filteredData) {
        if (lastPushTime && lastPushTime === item.created_at) break fetching
        if (!latestPushTime) latestPushTime = item.created_at as string

        // @ts-expect-error (https://docs.github.com/en/rest/using-the-rest-api/github-event-types?apiVersion=2022-11-28#event-payload-object-for-pushevent)
        const commits = item.payload.commits as Commit[]
        for (const commit of commits) {
          const message = (commit?.message || '').split('\n')[0]
          const tagName = message.match(new RegExp(tagNameRegex))?.[0] || ''
          const versionNum = message.match(new RegExp(tagNameRegex))?.[1] || ''
          const orgLogin = item.org?.login
          const orgAvatarUrl = item.org?.avatar_url

          if (message.includes(keyword) && tagName) {
            releases.push({
              id: item.id,
              url: `https://github.com/${item.repo.name}/releases/tag/${tagName}`,
              tagName: tagName,
              versionNum: versionNum,
              repoOwner: item.repo.name.split('/')[0],
              repoName: item.repo.name.split('/')[1],
              repoNameWithOwner: item.repo.name,
              repoUrl: `https://github.com/${item.repo.name}`,
              commitMessage: message,
              commitSha: commit?.sha || '',
              commitUrl: `https://github.com/${item.repo.name}/commit/${commit?.sha}`,
              actorLogin: item.actor.login,
              actorAvatarUrl: item.actor.avatar_url,
              isOrg: item.org !== undefined,
              ...(orgLogin && { orgLogin }),
              ...(orgAvatarUrl && { orgAvatarUrl }),
              createdAt: item.created_at as string,
            })
          }
        }
      }

      if (res.data.length < PER_PAGE) break
    } catch (error) {
      if (error instanceof RequestError && error.status === 304) {
        return { status: 304, releases: [] }
      }

      return {
        error: `Unexpected error: ${(error as Error).message}`,
        releases: [],
      }
    }
  }

  if (latestPushTime) meta.set('lastPushTime', latestPushTime)

  return { status: 200, releases }
}

async function fetchReleasesByRepoList(
  config: Omit<RepoListOutputConfig, 'mode' | 'clearStore'>,
  logger: LoaderContext['logger']
): Promise<ReleaseByIdFromRepos[] | ReleaseByRepoFromRepos[]> {
  const { repos, sinceDate, monthsBack, entryReturnType, githubToken } = config
  const token = githubToken || import.meta.env.GITHUB_TOKEN

  if (!token)
    throw new Error(
      'No GitHub token provided. Please provide a `githubToken` or set the `GITHUB_TOKEN` environment variable.\nHow to create a GitHub PAT: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic.\nHow to store token in Astro project environment variables: https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables.'
    )

  logger.info(
    `Loading GitHub releases for ${repos.length} ${repos.length > 1 ? 'repositories' : 'repository'}`
  )

  const releasesById: ReleaseByIdFromRepos[] = []
  const releasesByRepo: ReleaseByRepoFromRepos[] = []

  let sinceDateMs: null | number = null
  if (monthsBack || sinceDate)
    sinceDateMs = getSinceDate(monthsBack, sinceDate as Date)

  const getReleasesQuery = readFileSync(
    new URL('./graphql/query.graphql', import.meta.url),
    'utf8'
  )

  const octokit = new Octokit({
    auth: githubToken || import.meta.env.GITHUB_TOKEN,
  })

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
          getReleasesQuery,
          variables
        )

        const nodes = res.repository?.releases.nodes || []
        const releasesPerPage = nodes
          .filter((node) => node !== null)
          .filter(
            (node) =>
              sinceDateMs === null || +new Date(node.publishedAt) >= sinceDateMs
          )
          .map((node) => {
            const versionNum = node.tagName.match(
              /.*(\d+\.\d+\.\d+(?:-[\w.]+)?)(?:\s|$)/
            )
            return {
              id: node.id,
              url: node.url || '',
              name: node.name || '',
              versionNum: versionNum ? versionNum[1] : '',
              tagName: node.tagName,
              description: node.description || '',
              descriptionHTML: node.descriptionHTML || '',
              repoOwner: node.repository.nameWithOwner.split('/')[0],
              repoName: node.repository.name,
              repoNameWithOwner: node.repository.nameWithOwner,
              repoUrl: node.repository.url || '',
              repoStargazerCount: node.repository.stargazerCount,
              repoIsInOrganization: node.repository.isInOrganization,
              publishedAt: node.publishedAt || '',
            }
          })

        let stopFetching = false
        if (
          sinceDateMs !== null &&
          +new Date(nodes[nodes.length - 1]?.publishedAt) < sinceDateMs
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
    throw new Error((error as Error).message)
  }

  return entryReturnType === 'byRelease' ? releasesById : releasesByRepo
}

export { fetchReleasesByUserCommit, fetchReleasesByRepoList }
