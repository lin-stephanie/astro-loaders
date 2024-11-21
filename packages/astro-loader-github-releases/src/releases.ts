import { AstroError } from 'astro/errors'
import { Octokit } from 'octokit'

import { readFileSync } from 'node:fs'

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
  config: UserCommitOutputConfig['modeConfig'],
  meta: LoaderContext['meta']
): Promise<{
  status: 200 | 304
  releases: ReleaseByIdFromUser[]
}> {
  const { username, keyword, versionRegex, branches, prependV } = config

  const releases: ReleaseByIdFromUser[] = []
  const etag = meta.get('etag')
  const lastPushTime = meta.get('lastPushTime')
  const octokit = new Octokit(/* { auth: import.meta.env.GITHUB_TOKEN } */)
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

      if (res.status === (304 as number)) return { status: 304, releases }

      const filteredData = res.data
        // only care about push events for releases
        .filter((item) => item.type === 'PushEvent' && item.public)
        // filter out activities from other forks by checking the ref when syncing PRs
        .filter((item) => branches.includes((item.payload as any)?.ref))
        .filter((item) => item.created_at !== null)

      for (const item of filteredData) {
        if (lastPushTime && lastPushTime === item.created_at) break fetching
        if (!latestPushTime) latestPushTime = item.created_at as string

        // https://docs.github.com/en/rest/using-the-rest-api/github-event-types?apiVersion=2022-11-28#event-payload-object-for-pushevent
        // @ts-expect-error
        const commits = item.payload.commits as Commit[]
        for (const commit of commits) {
          const message = (commit?.message || '').split('\n')[0]
          const version = message.match(new RegExp(versionRegex))?.[1] || ''
          const tag = prependV ? `v${version}` : version
          const orgLogin = item.org?.login
          const orgAvatarUrl = item.org?.avatar_url

          if (message.includes(keyword) && version) {
            releases.push({
              id: item.id,
              repoName: item.repo.name,
              repoUrl: `https://github.com/${item.repo.name}`,
              releaseVersion: version,
              releaseUrl: `https://github.com/${item.repo.name}/releases/tag/${tag}`,
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
      throw new AstroError(
        `Failed to load release data in 'userCommit' mode: ${(error as Error).message}`
      )
    }
  }

  if (latestPushTime) meta.set('lastPushTime', latestPushTime)

  return { status: 200, releases }
}

async function fetchReleasesByRepoList(
  config: RepoListOutputConfig['modeConfig']
): Promise<ReleaseByIdFromRepos[] | ReleaseByRepoFromRepos[]> {
  const { repos, sinceDate, entryReturnType, githubToken } = config

  const releasesById: ReleaseByIdFromRepos[] = []
  const releasesByRepo: ReleaseByRepoFromRepos[] = []
  const filterDate = sinceDate === null ? sinceDate : +new Date(sinceDate)
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

        const releasesPerPage =
          res.repository?.releases.nodes
            ?.filter((node) => node !== null)
            .map((node) => {
              return {
                id: node.id,
                repoName: node.repository.nameWithOwner,
                repoUrl: node.repository.url,
                releaseVersion: node.tagName,
                releaseUrl: node.url,
                releaseTitle: node.name || '',
                releaseDesc: node.description || '',
                releaseDescHtml: node.descriptionHTML,
                publishedAt: node.publishedAt,
              }
            }) || []

        let stopFetching = false
        if (filterDate !== null) {
          releasesPerPage.filter((release) => {
            return +new Date(release.publishedAt) >= filterDate
          })

          if (
            +new Date(releasesPerPage[releasesPerPage.length - 1].publishedAt) <
            filterDate
          ) {
            stopFetching = true
          }
        }

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
          repoReleases: releasesPreRepo,
        })
      }
    }
  } catch (error) {
    throw new AstroError(
      `Failed to load release data in 'repoList' mode: ${(error as Error).message}`
    )
  }

  return entryReturnType === 'byRelease' ? releasesById : releasesByRepo
}

export { fetchReleasesByUserCommit, fetchReleasesByRepoList }
