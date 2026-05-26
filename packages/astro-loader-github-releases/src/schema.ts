import { z } from 'astro/zod'
import type { GithubReleasesLoaderUserConfig } from './config.js'

// entryReturnType: 'byRelease'
const ReleaseByIdFromReposSchema = z.object({
  id: z.string(),
  url: z.string(),
  name: z.string().optional(),
  tagName: z.string(),
  versionNum: z.string().optional(),
  description: z.string().optional(),
  descriptionHTML: z.string().optional(),
  isDraft: z.boolean(),
  isLatest: z.boolean(),
  isPrerelease: z.boolean(),
  repoOwner: z.string(),
  repoName: z.string(),
  repoNameWithOwner: z.string(),
  repoUrl: z.string(),
  repoStargazerCount: z.number(),
  repoIsInOrganization: z.boolean(),
  createdAt: z.string(),
  publishedAt: z.string().optional(),
})
export type ReleaseByIdFromRepos = z.infer<typeof ReleaseByIdFromReposSchema>

// entryReturnType: 'byRepository'
const ReleaseByRepoFromReposSchema = z.object({
  repo: z.string(),
  releases: z.array(ReleaseByIdFromReposSchema),
})
export type ReleaseByRepoFromRepos = z.infer<
  typeof ReleaseByRepoFromReposSchema
>

/**
 * Retrieves the schema based on the provided user configuration.
 */
export type GithubReleasesEntrySchema<
  TConfig extends GithubReleasesLoaderUserConfig,
> = TConfig extends { entryReturnType: 'byRelease' }
  ? typeof ReleaseByIdFromReposSchema
  : typeof ReleaseByRepoFromReposSchema

export function getEntrySchema<TConfig extends GithubReleasesLoaderUserConfig>(
  userConfig: TConfig
): GithubReleasesEntrySchema<TConfig> {
  const schema =
    userConfig.entryReturnType === 'byRelease'
      ? ReleaseByIdFromReposSchema
      : ReleaseByRepoFromReposSchema

  return schema as GithubReleasesEntrySchema<TConfig>
}
