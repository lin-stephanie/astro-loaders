import { z } from 'astro/zod'

export const GithubPrsLoaderConfigSchema = z.object({
  /**
   * The user-defined search string for querying pull requests on GitHub.
   * This string will be concatenated with "type:pr" to form the complete search query.
   *
   * @remarks
   * For more information, see:
   * - {@link https://docs.github.com/en/graphql/reference/queries#search GitHub GraphQL API - Perform a search across resources}
   * - {@link https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests How to search pull requests}
   *
   * @example
   * - `'author:xxx created:>=2024-01-01'`: matches prs written by xxx that were created after 2024.
   * - `'author:xxx -user:xxx'`: matches prs written by xxx, but not to their own repositories.
   */
  search: z.string(),

  /**
   * You must create a GitHub PAT with at least `repo` scope permissions
   * to authenticate requests to the GraphQL API.
   *
   * @remarks This is optional; by default, it reads from the `GITHUB_TOKEN` environment variable.
   * You may also configure it directly here (not recommended; if you do, ensure it is not exposed
   * in public code repositories).
   *
   * @see
   * - {@link https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic How to create a GitHub PAT (classic).}
   * - {@link https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables How to store GitHub PAT in Astro project environment variables.}
   */
  githubToken: z.string().default(import.meta.env.GITHUB_TOKEN),
})

export type GithubPrsLoaderUserConfig = z.input<
  typeof GithubPrsLoaderConfigSchema
>
