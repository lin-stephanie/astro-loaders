import { z } from 'astro/zod'
import type { GithubReleasesLoaderUserConfig } from './config.js'

/* User Commit Mode */
const CommitAuthorSchema = z.object({
  name: z.string(),
  email: z.string(),
})
const CommitSchema = z.object({
  sha: z.string(),
  message: z.string(),
  author: CommitAuthorSchema,
  url: z.string().url(),
  distinct: z.boolean(),
})
export type Commit = z.infer<typeof CommitSchema>

export const ReleaseByIdFromUserSchema = z.object({
  id: z.string(),
  repoName: z.string(),
  repoUrl: z.string(),
  releaseVersion: z.string(),
  releaseUrl: z.string(),
  commitMessage: z.string(),
  commitSha: z.string(),
  commitUrl: z.string(),
  actorLogin: z.string(),
  actorAvatarUrl: z.string(),
  isOrg: z.boolean(),
  orgLogin: z.string().optional(),
  orgAvatarUrl: z.string().optional(),
  createdAt: z.string(),
})
export type ReleaseByIdFromUser = z.infer<typeof ReleaseByIdFromUserSchema>

/* Repo List Mode */
// entryReturnType: 'byRelease'
const ReleaseByIdFromReposSchema = z.object({
  id: z.string(),
  repoName: z.string(),
  repoUrl: z.string(),
  releaseVersion: z.string(),
  releaseUrl: z.string(),
  releaseTitle: z.string(),
  releaseDesc: z.string(),
  releaseDescHtml: z.string(),
  publishedAt: z.string(),
})
export type ReleaseByIdFromRepos = z.infer<typeof ReleaseByIdFromReposSchema>

// entryReturnType: 'byRepository'
const ReleaseByRepoFromReposSchema = z.object({
  repo: z.string(),
  repoReleases: z.array(ReleaseByIdFromReposSchema),
})
export type ReleaseByRepoFromRepos = z.infer<
  typeof ReleaseByRepoFromReposSchema
>

/**
 * Retrieves the schema based on the provided user configuration.
 */
export function getEntrySchema(userConfig: GithubReleasesLoaderUserConfig) {
  const schema =
    userConfig.fetchMode === 'userCommit'
      ? ReleaseByIdFromUserSchema
      : userConfig.modeConfig.entryReturnType === 'byRelease'
        ? ReleaseByIdFromReposSchema
        : ReleaseByRepoFromReposSchema

  return schema
}
