import { z } from 'astro/zod'

export const userCommitDefaultConfig = {
  keyword: 'release',
  versionRegex: 'v?(\\d+\\.\\d+\\.\\d+(?:-[\\w.]+)?)(?:\\s|$)',
  branches: [
    'refs/heads/main',
    'refs/heads/master',
    'refs/heads/latest',
    'refs/heads/stable',
    'refs/heads/release',
    'refs/heads/dev',
  ],
}

export const repoListtDefaultConfig = {
  sinceDate: null,
  entryReturnType: 'byRepository' as const,
}

export const GithubReleasesLoaderConfigSchema = z.discriminatedUnion(
  'fetchMode',
  [
    z.object({
      /**
       * Fetch release data based on commit messages in push events from a specific GitHub user.
       * (Uses the GitHub API endpoint: {@link https://docs.github.com/en/rest/activity/events?apiVersion=2022-11-28#list-public-events-for-a-user `GET /users/<username>/events/public`})
       *
       * @remark Only release data from the past 90 days can be retrieved in this mode.
       * {@link https://docs.github.com/en/rest/activity/events?apiVersion=2022-11-28#about-github-events Learn more.}
       */
      fetchMode: z.literal('userCommit'),

      /**
       * Configuration options specific to the selected `mode`.
       */
      modeConfig: z.object({
        /**
         * The unique username used to identify a specific GitHub account.
         */
        username: z.string(),

        /**
         * The keyword to filter push events' commit messages for releases.
         *
         * @default 'release'
         */
        keyword: z.string().default(userCommitDefaultConfig.keyword),

        /**
         * Regular expression for matching version numbers in commit messages.
         *
         * @remark The first capturing group in the regex will be used for the `releaseVersion` field.
         *
         * @default 'v?(\\d+\\.\\d+\\.\\d+(?:-[\\w.]+)?)(?:\\s|$)'
         */
        versionRegex: z
          .string()
          .regex(/.*/)
          .default(userCommitDefaultConfig.versionRegex),

        /**
         * The branches to monitor for push events.
         * Filters out activities from other forks based on these refs.
         */
        branches: z.array(z.string()).default(userCommitDefaultConfig.branches),

        /**
         * Whether to prepend "v" to the `releaseVersion` field value.
         */
        prependV: z.boolean().default(true),
      }),
    }),

    z.object({
      /**
       * Fetch release data from specified 'owner/repo' combinations.
       * (Uses the GitHub API endpoint: {@link https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28#list-releases `GET /repos/<owner>/<repo>/releases`})
       */
      fetchMode: z.literal('repoList'),

      /**
       * Configuration options specific to the selected `mode`.
       */
      modeConfig: z.object({
        /**
         * Specifies the repositories from which to fetch release data, each formatted as "owner/repo".
         */
        repos: z
          .array(
            z.string().regex(/^[^\/]+\/[^\/]+$/, {
              message: 'Repository name must follow the "owner/repo" format',
            })
          )
          .nonempty({
            message: 'At least one repository must be provided',
          }),

        /**
         * Specifies the date from which to start fetching release data.
         *
         * @remark If not specified, fetch all.
         */
        sinceDate: z
          .union([z.coerce.date(), z.null()])
          .default(repoListtDefaultConfig.sinceDate),

        /**
         * Determines whether entries are returned per repository or per individual release item.
         * - 'byRepository': Return entries per repository.
         * - 'byRelease': Return entries per individual release item.
         *
         * @remark This option influences the Zod Schema of the loaded entries and how the data is processed afterward.
         *
         * @default 'byRepository'
         */
        entryReturnType: z
          .union([z.literal('byRepository'), z.literal('byRelease')])
          .default(repoListtDefaultConfig.entryReturnType),
      }),
    }),
  ]
)

/* Github Releases Loader Config */
export type GithubReleasesLoaderUserConfig = z.input<
  typeof GithubReleasesLoaderConfigSchema
>
// export type GithubReleasesLoaderConfig = z.output<
//   typeof GithubReleasesLoaderConfigSchema
// >

/* User Commit Config */
const UserCommitConfigSchema = GithubReleasesLoaderConfigSchema.options[0]
// export type UserCommitInputConfig = z.input<typeof UserCommitConfigSchema>
export type UserCommitOutputConfig = z.output<typeof UserCommitConfigSchema>

/* Repo List Config */
const RepoListConfigSchema = GithubReleasesLoaderConfigSchema.options[1]
// export type RepoListInputConfig = z.input<typeof RepoListConfigSchema>
export type RepoListOutputConfig = z.output<typeof RepoListConfigSchema>
