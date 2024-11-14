import { Octokit } from 'octokit'
import type { LoaderContext } from 'astro/loaders'
import type { UserCommitReleaseItem, Commit } from './schema.js'
import type { UserCommitOutputConfig } from './config.js'

interface FetchReleasesByUserCommit {
  status: 200 | 304
  releases: UserCommitReleaseItem[]
}

const PER_PAGE = 100
const PAGE = 3

async function fetchReleasesByUserCommit(
  config: UserCommitOutputConfig['modeConfig'],
  meta: LoaderContext['meta'],
  logger: LoaderContext['logger']
): Promise<FetchReleasesByUserCommit> {
  let latestPushTime = ''
  const releases: UserCommitReleaseItem[] = []
  const { username, keyword, versionRegex, branches, prependV } = config

  const etag = meta.get('etag')
  const lastPushTime = meta.get('lastPushTime')
  // const lastPushTime = +new Date(meta.get('lastPushTime') || 0)

  const octokit = new Octokit(/* { auth: import.meta.env.GITHUB_TOKEN } */)

  const headers = {
    'X-GitHub-Api-Version': '2022-11-28',
    accept: 'application/vnd.github+json',
    ...(etag ? { 'If-None-Match': etag } : {}),
  }

  fetching: for (let page = 1; page <= 3; page++) {
    try {
      const res = await octokit.request('GET /users/{username}/events/public', {
        headers,
        username,
        per_page: PER_PAGE,
        page: PAGE,
      })

      if (res.status === (304 as number)) return { status: 304, releases }

      const filteredData = res.data
        // only care about push events for releases
        .filter((item) => item.type === 'PushEvent' && item.public)

        // filter out activities from other forks by checking the ref when syncing PRs
        // biome-ignore lint/suspicious/noExplicitAny: fix the missing ref field in the type definition at push event.
        .filter((item) => branches.includes((item.payload as any)?.ref))

        .filter((item) => item.created_at != null)

      for (const item of filteredData) {
        if (lastPushTime && lastPushTime === item.created_at) break fetching
        if (!latestPushTime) latestPushTime = item.created_at as string

        // @ts-expect-error
        const commits = item.payload.commits as Commit[]
        for (const commit of commits) {
          const message = (commit?.message || '').split('\n')[0]
          const version = message.match(new RegExp(versionRegex))?.[1] || ''

          if (message.includes(keyword) && version) {
            releases.push({
              id: item.id,
              repoName: item.repo.name,
              repoUrl: `https://github.com/${item.repo.name}`,
              releaseVersion: prependV ? `v${version}` : version,
              commitMessage: message,
              commitSha: commit?.sha || '',
              commitUrl: `https://github.com/${item.repo.name}/commit/${commit?.sha}`,
              actorLogin: item.actor.login,
              actorAvatarUrl: item.actor.avatar_url,
              isOrg: item.org !== undefined,
              OrgLogin: item.org?.login,
              OrgAvatarUrl: item.org?.avatar_url,
              created_at: item.created_at as string,
            })
          }
        }
      }
    } catch (error) {
      logger.error(
        `Failed to load release data in 'userCommit' mode. ${(error as Error).message}`
      )
    }
  }

  if (latestPushTime) meta.set('lastPushTime', latestPushTime)

  return { status: 200, releases }
}

export { fetchReleasesByUserCommit }
