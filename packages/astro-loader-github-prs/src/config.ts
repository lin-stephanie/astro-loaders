import { z } from 'astro/zod'

export const GithubPrsLoaderConfigSchema = z.object({
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
  search: z.string(),

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
    .positive({ message: '`monthsBack` must be a positive integer' })
    .optional(),

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

  /**
   * Whether to clear the {@link https://docs.astro.build/en/reference/content-loader-reference/#store store}
   * scoped to the collection before storing newly loaded data.
   *
   * @default false
   */
  clearStore: z.boolean().default(false),
})

export type GithubPrsLoaderUserConfig = z.input<
  typeof GithubPrsLoaderConfigSchema
>
