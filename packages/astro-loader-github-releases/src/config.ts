import { z } from 'astro/zod'

const githubReleasesDefaultConfig = {
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
   * You need to {@link https://github.com/settings/tokens create a GitHub PAT}
   * with at least `repo` scope permissions to authenticate requests to the GraphQL API.
   *
   * Build-time loader:
   * - Optional. If omitted, `githubReleasesLoader` reads `GITHUB_TOKEN`
   *   from `import.meta.env` during Astro dev/build.
   *
   * Live loader:
   * - Optional. If omitted, `liveGithubReleasesLoader` reads `GITHUB_TOKEN`
   *   at request time with Astro's `getSecret('GITHUB_TOKEN')`.
   * - Requires an Astro adapter with `astro:env/server` runtime support.
   *
   * Passing this option directly is supported, but in production it is
   * recommended to use the `GITHUB_TOKEN` environment variable instead to
   * avoid bundling the token in server code.
   *
   * @see
   * - {@link https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic How to create a GitHub PAT (classic)}
   * - {@link https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables How to store GitHub PAT in Astro project environment variables}
   */
  githubToken: z.string().optional(),
})

/* Build-time Loader */
export const GithubReleasesLoaderUserConfigSchema = z
  .object({
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
      .default(githubReleasesDefaultConfig.entryReturnType),
  })
  .extend(
    OptionalConfigSchema.pick({
      clearStore: true,
      githubToken: true,
    }).shape
  )
export type GithubReleasesLoaderUserConfig = z.input<
  typeof GithubReleasesLoaderUserConfigSchema
>
export type GithubReleasesLoaderOutputConfig = z.output<
  typeof GithubReleasesLoaderUserConfigSchema
>

/* Live Loader */
export const LiveGithubReleasesLoaderUserConfigSchema =
  OptionalConfigSchema.pick({
    githubToken: true,
  })
export type LiveGithubReleasesLoaderUserConfig = z.input<
  typeof LiveGithubReleasesLoaderUserConfigSchema
>

export const LiveCollectionFilterSchema =
  GithubReleasesLoaderUserConfigSchema.omit({
    clearStore: true,
    githubToken: true,
  })
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
