import { z } from 'astro/zod'

export const AllConfigSchema = z.object({
  /**
   * The identifier for a pull request, which can be one of the following:
   *
   * - A PR node ID string: "PR_" + 16 Base64 chars.
   * - A GitHub PR URL: "https://github.com/{owner}/{repo}/pull/{number}".
   * - An object with the following fields:
   *   - `owner`: The repository owner.
   *   - `repo`: The repository name.
   *   - `number`: The pull request number.
   *
   * @example
   *
   * // PR node ID
   * "PR_kwDOFL76Q86uDYLC"
   *
   * // GitHub PR URL
   * "https://github.com/withastro/astro/pull/1"
   *
   * // Object
   * { owner: 'withastro', repo: 'astro', number: 1 }
   */
  identifier: z
    .union([
      z.string(),
      z.object({
        owner: z.string().min(1, '`owner` cannot be empty'),
        repo: z.string().min(1, '`repo` cannot be empty'),
        number: z.number().int().gte(1, '`number` must be >= 1'),
      }),
    ])
    .superRefine((val, ctx) => {
      if (typeof val === 'string') {
        if (/^PR_[A-Za-z0-9+/=]{16}$/.test(val)) return
        const match = val.match(
          /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)\/?$/
        )
        if (match) return
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Invalid identifier string: expected PR node ID (start with "PR_" followed by 16 Base64 characters) or GitHub PR URL',
        })
      }
    })
    .transform((val) => {
      if (typeof val === 'string') {
        const urlMatch = val.match(
          /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)\/?$/
        )
        if (urlMatch) {
          const [, owner, repo, number] = urlMatch
          return { owner, repo, number: Number(number) }
        }
        if (/^PR_[A-Za-z0-9+/=]{16}$/.test(val)) return val
      }
      return val
    }),

  /**
   * The user-defined search string for querying pull requests on GitHub.
   * This string will be concatenated with "type:pr" to form the complete search query.
   *
   * For more information:
   * - {@link https://docs.github.com/en/graphql/reference/queries#search GitHub GraphQL API - Perform a search across resources}
   * - {@link https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests How to search pull requests}
   *
   * @example
   * - 'author:xxx created:>=2024-01-01': matches prs written by xxx that were created after 2024.
   * - 'author:xxx -user:xxx': matches prs written by xxx, but not to their own repositories.
   */
  search: z.string().min(1, '`search` cannot be empty.'),

  /**
   * The number of recent months to load pull requests, including the current month.
   * The loader automatically converts this to a date for the 'created' qualifier in the search query.
   *
   * If the {@link https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests#search-by-when-an-issue-or-pull-request-was-created-or-last-updated 'created'}
   * qualifier is defined in `search` option, it will override this value.
   *
   * For example, setting to `3` on December 4, 2024, would yield: 'type:pr created:>=2024-10-01 ...'.
   */
  monthsBack: z
    .number()
    .int({ message: '`monthsBack` must be an integer' })
    .gte(1, '`monthsBack` must be greater than or equal to 1')
    .optional(),

  /**
   * Maximum number of pull requests to load.
   *
   * - Based on GitHub GraphQL search ({@link https://docs.github.com/en/graphql/reference/queries#search max 1,000 results}).
   * - Returns up to `maxEntries`, or fewer if fewer exist.
   * - If `monthsBack` is set and results exceed `maxEntries`, only `maxEntries` are returned.
   */
  maxEntries: z
    .number()
    .int()
    .gte(1, '`maxEntries` must be greater than or equal to 1')
    .lte(1000, '`maxEntries` must be less than or equal to 1000')
    .optional(),

  /**
   * Whether to clear the {@link https://docs.astro.build/en/reference/content-loader-reference/#store store}
   * scoped to the collection before storing newly loaded data.
   *
   * @default false
   */
  clearStore: z.boolean().default(false),

  /**
   * You need to {@link https://github.com/settings/tokens create a GitHub PAT}
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

/* Built-in Loader */
export const GithubPrsLoaderUserConfigSchema = AllConfigSchema.pick({
  search: true,
  monthsBack: true,
  maxEntries: true,
  githubToken: true,
  clearStore: true,
})
export type GithubPrsLoaderUserConfig = z.input<
  typeof GithubPrsLoaderUserConfigSchema
>

/* Live Loader */
export const LiveGithubPrsLoaderUserConfigSchema = AllConfigSchema.pick({
  githubToken: true,
})
export type LiveGithubPrsLoaderUserConfig = z.input<
  typeof LiveGithubPrsLoaderUserConfigSchema
>

export const LiveCollectionFilterSchema = AllConfigSchema.pick({
  search: true,
  monthsBack: true,
  maxEntries: true,
})
export type LiveCollectionFilter = z.input<typeof LiveCollectionFilterSchema>

export const LiveEntryFilterSchema = AllConfigSchema.pick({
  identifier: true,
})
export type LiveEntryFilter = z.input<typeof LiveEntryFilterSchema>
