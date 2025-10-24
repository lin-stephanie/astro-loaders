import { Octokit, RequestError } from 'octokit'
import { print } from 'graphql'
import { GetReleasesDocument } from './graphql/gen/operations.js'
import { getSinceDate, getValidReleaseNode } from './utils.js'

import type { LoaderContext } from 'astro/loaders'
import type { RepoListOutputConfig, UserCommitOutputConfig } from './config.js'
import type {
  GetReleasesQuery,
  GetReleasesQueryVariables,
} from './graphql/gen/operations.js'
import type {
  Commit,
  ReleaseByIdFromRepos,
  ReleaseByIdFromUser,
  ReleaseByRepoFromRepos,
} from './schema.js'

const PER_PAGE = 100
const MAX_PAGE = 3

export async function fetchReleasesByUserCommit(
  config: Omit<UserCommitOutputConfig, 'mode' | 'clearStore'>,
  meta?: LoaderContext['meta'],
  logger?: LoaderContext['logger']
): Promise<{
  status?: 200 | 304
  error?: string
  releases: ReleaseByIdFromUser[]
}> {
  const { username, keyword, tagNameRegex, branches } = config

  logger?.info(`Loading GitHub releases for the user @${username}`)

  const releases: ReleaseByIdFromUser[] = []
  const etag = meta?.get('etag')
  const lastPushTime = meta?.get('lastPushTime')
  const octokit = new Octokit()
  const headers = {
    'X-GitHub-Api-Version': '2022-11-28',
    'X-Github-Next-Global-ID': '1',
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
        meta?.set('etag', res.headers.etag)

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
        error: 'Unknown error',
        releases: [],
      }
    }
  }

  if (latestPushTime) meta?.set('lastPushTime', latestPushTime)

  return { status: 200, releases }
}

export async function fetchReleasesByRepoList(
  config: Omit<RepoListOutputConfig, 'mode' | 'clearStore'>,
  logger?: LoaderContext['logger']
): Promise<ReleaseByIdFromRepos[] | ReleaseByRepoFromRepos[]> {
  const { repos, sinceDate, monthsBack, entryReturnType, githubToken } = config

  logger?.info(
    `Loading GitHub releases for ${repos.length} ${repos.length > 1 ? 'repositories' : 'repository'}`
  )

  const releasesById: ReleaseByIdFromRepos[] = []
  const releasesByRepo: ReleaseByRepoFromRepos[] = []

  let sinceDateMs: null | number = null
  if (monthsBack || sinceDate) sinceDateMs = getSinceDate(monthsBack, sinceDate)

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
