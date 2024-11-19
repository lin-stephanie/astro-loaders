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
  prependV: false,
}

export const repoListtDefaultConfig = {
  sinceDate: null,
  entryReturnType: 'byRepository' as const,
}

export const GithubReleasesLoaderConfigSchema = z.discriminatedUnion(
  'loadMode',
  [
    z.object({
      /**
       * Loads release data from commit messages in push events for a specific GitHub user via the GitHub REST API endpoint: {@link https://docs.github.com/en/rest/activity/events?apiVersion=2022-11-28#list-public-events-for-a-user `GET /users/<username>/events/public`}.
       *
       * @remark Only release data from the past 90 days can be retrieved in this mode.
       * {@link https://docs.github.com/en/rest/activity/events?apiVersion=2022-11-28#about-github-events Learn more.}
       */
      loadMode: z.literal('userCommit'),

      /**
       * Configuration options specific to the selected `loadMode`.
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
        prependV: z.boolean().default(userCommitDefaultConfig.prependV),
      }),
    }),

    z.object({
      /**
       * Loads release data from a specified list of repositories using the GitHub GraphQL API for querying.
       */
      loadMode: z.literal('repoList'),

      /**
       * Configuration options specific to the selected `loadMode`.
       */
      modeConfig: z.object({
        /**
         * The repositories from which to load release data, each formatted as "owner/repo".
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
         * The date from which to start loading release data.
         *
         * @remark If not specified, load all.
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

export type GithubReleasesLoaderUserConfig = z.input<
  typeof GithubReleasesLoaderConfigSchema
>

const UserCommitConfigSchema = GithubReleasesLoaderConfigSchema.options[0]
export type UserCommitOutputConfig = z.output<typeof UserCommitConfigSchema>

const RepoListConfigSchema = GithubReleasesLoaderConfigSchema.options[1]
export type RepoListOutputConfig = z.output<typeof RepoListConfigSchema>
