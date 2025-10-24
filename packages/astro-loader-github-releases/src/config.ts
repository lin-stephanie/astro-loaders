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

const OptionalConfigSchema = z.object({
  /**
   * Whether to clear the {@link https://docs.astro.build/en/reference/content-loader-reference/#store store}
   * scoped to the collection before storing newly loaded data.
   *
   * @default false
   */
  clearStore: z.boolean().default(false),

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

/* Build-time Loader */
export const GithubReleasesLoaderUserConfigSchema = z.discriminatedUnion(
  'mode',
  [
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
      .merge(
        OptionalConfigSchema.pick({
          clearStore: true,
        })
      ),

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
            z.string().regex(/^[^/]+\/[^/]+$/, {
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
          .union([z.date(), z.string(), z.number()])
          .transform((v) => (v instanceof Date ? v : new Date(v)))
          .refine((d) => !Number.isNaN(d.getTime()), {
            message:
              '`sinceDate` must be a valid Date or a value convertible by `new Date()`. See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date#parameters',
          })
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
          .gte(1, '`monthsBack` must be greater than or equal to 1')
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
      })
      .merge(
        OptionalConfigSchema.pick({
          clearStore: true,
          githubToken: true,
        })
      ),
  ]
)

export type GithubReleasesLoaderUserConfig = z.input<
  typeof GithubReleasesLoaderUserConfigSchema
>

const UserCommitConfigSchema = GithubReleasesLoaderUserConfigSchema.options[0]
export type UserCommitOutputConfig = z.output<typeof UserCommitConfigSchema>

const RepoListConfigSchema = GithubReleasesLoaderUserConfigSchema.options[1]
export type RepoListOutputConfig = z.output<typeof RepoListConfigSchema>

/* Live Loader */
export const LiveGithubReleasesLoaderUserConfigSchema =
  OptionalConfigSchema.pick({
    githubToken: true,
  })
export type LiveGithubReleasesLoaderUserConfig = z.input<
  typeof LiveGithubReleasesLoaderUserConfigSchema
>

export const LiveCollectionFilterSchema = z.discriminatedUnion('mode', [
  GithubReleasesLoaderUserConfigSchema.options[0].omit({
    clearStore: true,
  }),
  GithubReleasesLoaderUserConfigSchema.options[1].omit({
    clearStore: true,
    githubToken: true,
  }),
])
export type LiveCollectionFilter = z.input<typeof LiveCollectionFilterSchema>

export const LiveEntryFilterSchema = z.object({
  /**
   * The identifier for a pull request, which can be one of the following:
   *
   * - A Release node ID string: "RE_" + 16 Base64 chars.
   * - A GitHub Release URL: "https://github.com/{owner}/{repo}/releases/tag/{tagName}".
   * - An object with the following fields:
   *   - `owner`: The repository owner.
   *   - `repo`: The repository name.
   *   - `tagName`: The release tag name.
   *
   * @example
   *
   * // Release node ID
   * "RE_kwDOFL76Q84O4ieR"
   *
   * // GitHub Release URL
   * "https://github.com/withastro/astro/releases/tag/astro@5.13.11"
   *
   * // Object
   * { owner: 'withastro', repo: 'astro', tagName: 'astro@5.13.11' }
   */
  identifier: z
    .union([
      z.string(),
      z.object({
        owner: z.string().min(1, '`owner` cannot be empty'),
        repo: z.string().min(1, '`repo` cannot be empty'),
        tagName: z.string().min(1, '`tagName` cannot be empty'),
      }),
    ])
    .superRefine((val, ctx) => {
      if (typeof val === 'string') {
        if (/^RE_[A-Za-z0-9+/=]{16}$/.test(val)) return
        const match = val.match(
          /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/releases\/tag\/([^/]+)\/?$/
        )
        if (match) return
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Invalid identifier string: expected Release node ID (start with "RE_" followed by 16 Base64 characters) or GitHub Release URL',
        })
      }
    })
    .transform((val) => {
      if (typeof val === 'string') {
        const urlMatch = val.match(
          /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/releases\/tag\/([^/]+)\/?$/
        )
        if (urlMatch) {
          const [, owner, repo, tagName] = urlMatch
          return { owner, repo, tagName }
        }
        if (/^RE_[A-Za-z0-9+/=]{16}$/.test(val)) return val
      }
      return val
    }),
})
export type LiveEntryFilter = z.input<typeof LiveEntryFilterSchema>
