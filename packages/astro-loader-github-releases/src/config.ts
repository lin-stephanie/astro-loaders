import { z } from 'astro/zod'

const userCommitDefaultConfig = {
  keyword: 'release',
  tagNameRegex: 'v?(\\d+\\.\\d+\\.\\d+(?:-[\\w.]+)?)(?:\\s|$)',
  branches: [
    'refs/heads/main',
    'refs/heads/master',
    'refs/heads/latest',
    'refs/heads/stable',
    'refs/heads/release',
    'refs/heads/dev',
  ],
}

const repoListDefaultConfig = {
  entryReturnType: 'byRepository' as const,
}

const BaseFields = z.object({
  /**
   * Whether to clear the {@link https://docs.astro.build/en/reference/content-loader-reference/#store store}
   * scoped to the collection before storing newly loaded data.
   *
   * @default false
   */
  clearStore: z.boolean().default(false),
})

export const GithubReleasesLoaderConfigSchema = z.discriminatedUnion('mode', [
  z
    .object({
      /**
       * Loads GitHub releases from commit messages in push events for a specific GitHub user
       * via the GitHub REST API endpoint: {@link https://docs.github.com/en/rest/activity/events?apiVersion=2022-11-28#list-public-events-for-a-user `GET /users/<username>/events/public`}.
       *
       * Only events from the past 90 days can be retrieved in this mode.
       * {@link https://docs.github.com/en/rest/activity/events?apiVersion=2022-11-28#about-github-events Learn more.}
       */
      mode: z.literal('userCommit'),

      /**
       * The username used to identify a specific GitHub account.
       */
      username: z.string().min(1, '`username` cannot be empty'),

      /**
       * Regular expression for matching tag name in commit messages.
       * The first capturing group in the regex will be used as `versionNum` field.
       *
       * @default
       * 'v?(\\d+\\.\\d+\\.\\d+(?:-[\\w.]+)?)(?:\\s|$)' // Matches 'v1.2.3' or '1.2.3' or '1.0.0-beta.1'
       *
       * @example
       * '(?:[a-zA-Z-]+@)?(\\d+\\.\\d+\\.\\d+(?:-[\\w.]+)?)(?:\\s|$)' // Matches 'xxx-xxx@1.2.3'
       */
      tagNameRegex: z
        .string()
        .min(1, '`tagNameRegex` cannot be empty')
        .default(userCommitDefaultConfig.tagNameRegex),

      /**
       * The keyword to filter push events' commit messages for releases.
       * Can be empty, meaning no filtering.
       *
       * @default 'release'
       */
      keyword: z.string().default(userCommitDefaultConfig.keyword),

      /**
       * The branches to monitor for push events.
       * Filters out activities from other forks based on these refs.
       *
       * @default
       * ['refs/heads/main', 'refs/heads/master', 'refs/heads/latest',
       * 'refs/heads/stable', 'refs/heads/release', 'refs/heads/dev']
       */
      branches: z.array(z.string()).default(userCommitDefaultConfig.branches),
    })
    .merge(BaseFields),

  z
    .object({
      /**
       * Loads GitHub releases from a specified list of repositories using the GitHub GraphQL API for querying.
       */
      mode: z.literal('repoList'),

      /**
       * The repositories from which to load releases, each formatted as `'owner/repo'`.
       */
      repos: z
        .array(
          z.string().regex(/^[^\/]+\/[^\/]+$/, {
            message: "Repository name must follow the 'owner/repo' format",
          })
        )
        .nonempty({
          message: 'At least one repository must be provided',
        }),

      /**
       * The date from which to start loading releases. If not specified, load all.
       * If both `monthsBack` and `sinceDate` are configured, the more recent date will be used.
       */
      sinceDate: z
        .union([
          z.coerce.date(),
          z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
            message: 'Invalid date string in `sinceDate`.',
          }),
        ])
        .optional(),

      /**
       * The number of recent months to load releases, including the current month.
       * If both `monthsBack` and `sinceDate` are configured, the more recent date will be used.
       *
       * For example, setting to `3` on December 4, 2024, will include releases
       * from October 1, 2024, to December 4, 2024.
       */
      monthsBack: z
        .number()
        .int({ message: '`monthsBack` must be an integer' })
        .positive({ message: '`monthsBack` must be a positive integer' })
        .optional(),

      /**
       * Determines whether entries are returned per repository or per individual release item.
       * - `'byRepository'`: Return entries per repository.
       * - `'byRelease'`: Return entries per individual release item.
       *
       * This option influences the entries' Zod Schema.
       *
       * @default 'byRepository'
       */
      entryReturnType: z
        .enum(['byRepository', 'byRelease'], {
          message:
            '`entryReturnType` must be either `byRepository` or `byRelease`',
        })
        .default(repoListDefaultConfig.entryReturnType),

      /**
       * In this mode, you need to {@link https://github.com/settings/tokens create a GitHub PAT}
       * with at least `repo` scope permissions to authenticate requests to the GraphQL API.
       *
       * This is optional; by default, it reads from the `GITHUB_TOKEN` environment variable.
       * You may also configure it directly here (not recommended; if you do, ensure it is not exposed
       * in public code repositories).
       *
       * @see
       * - {@link https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic How to create a GitHub PAT (classic)}
       * - {@link https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables How to store GitHub PAT in Astro project environment variables}
       */
      githubToken: z.string().optional(),
    })
    .merge(BaseFields),
])

export type GithubReleasesLoaderUserConfig = z.input<
  typeof GithubReleasesLoaderConfigSchema
>

const UserCommitConfigSchema = GithubReleasesLoaderConfigSchema.options[0]
export type UserCommitOutputConfig = z.output<typeof UserCommitConfigSchema>

const RepoListConfigSchema = GithubReleasesLoaderConfigSchema.options[1]
export type RepoListOutputConfig = z.output<typeof RepoListConfigSchema>
