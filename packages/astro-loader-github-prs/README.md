# astro-loader-github-prs

[![version][version-badge]][version-link]
[![jsDocs.io][jsdocs-src]][jsdocs-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![demo][demo-logo]][demo-link]

This package provides GitHub Pull Request (PR) loaders for Astro projects. It includes:

- `githubPrsLoader`: Loads multiple PRs at build time using a search query.
- `liveGithubPrsLoader`: Fetches PRs at runtime on each request — multiple PRs by search query or a single PR by identifier.


## Installation

```sh
npm install astro-loader-github-prs
```

## Usage

To use the Astro loader, ensure Astro version `^4.14.0 || ^5.0.0`. For `^4.14.0`, enable the [experimental content layer](https://docs.astro.build/en/reference/configuration-reference/#experimentalcontentlayer) in `astro.config.ts`:

```ts
export default defineConfig({
  experimental: {
    contentLayer: true,
  },
})
```

### `githubPrsLoader` (Build-time Collection)

In `src/content/config.ts` (for `^4.14.0`) or `src/content.config.ts` (for `^5.0.0`), import and configure the build-time loader to define a new content collection:

```ts
import { defineCollection } from "astro:content"
import { githubPrsLoader } from "astro-loader-github-prs"

const githubPrs = defineCollection({
  loader: githubPrsLoader({
    search: 'author:username created:>=2024-10-01',
  }),
})

export const collections = { githubPrs }
```

[Query the content collection](https://docs.astro.build/en/guides/content-collections/#querying-collections) like any other Astro content collection to render the loaded GitHub PRs:

```astro
---
import { getCollection } from "astro:content"

const prs = await getCollection("githubPrs")
---

{
  prs.map(async (pr) => {
    const { Content } = await render(pr)
    return (
      <div>
        <a href={pr.data.url}>
          {pr.data.repository.nameWithOwner}#{pr.data.number}
        </a>
        <p>{pr.data.title}</p>
        <Content />
      </div>
    )
  })
}
```

To update the data, trigger a site rebuild (e.g., using a third-party cron job service), as [the loader fetches data only at build time](https://docs.astro.build/en/reference/content-loader-reference/#object-loaders).

### `liveGithubPrsLoader` (Live Collection, Experimental)

Astro 5.10+ introduces [experimental live content collections](https://docs.astro.build/en/reference/experimental-flags/live-content-collections), which allow data fetching at runtime. To use this feature, enable the experimental `liveContentCollections` flag as shown below, and use an adapter that supports [on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/).

```js title="astro.config.mjs"
// astro.config.mjs
export default {
  experimental: {
    liveContentCollections: true,
  },
};
```

In `src/live.config.ts`, import and configure the live loader to define a new live content collection:

```ts title="src/live.config.ts"
// src/live.config.ts
import { defineLiveCollection } from 'astro:content';
import { liveGithubPrsLoader } from 'astro-loader-github-prs';

const liveGithubPrs = defineLiveCollection({
  loader: liveGithubPrsLoader(),
});

export const collections = { liveGithubPrs };
```

Query at runtime using `getLiveCollection()` or `getLiveEntry()`:

```astro
---
export const prerender = false;
import { getLiveCollection, getLiveEntry } from 'astro:content';

// Get PRs
const { entries: prs, error } = await getLiveCollection('liveGithubPrs',{
  search: 'repo:withastro/astro',
  monthsBack: 3,
  maxEntries: 50,
});

// Get individual PR
/* const { entry: pr } = await getLiveEntry('liveGithubPrs', {
  // by PR node ID
  identifier: 'PR_kwDOFL76Q86uDYLC',

  // by url
  identifier: 'https://github.com/withastro/astro/pull/12345',

  // by object
  identifier: { owner: 'withastro', repo: 'astro', number: 12345 },
}); */
---

{
  error ? (
    <p>{error.message}</p>
  ) : (
    <div>
      {prs?.map((pr) => (
        <div>
          <a href={pr.data.url}>
            {pr.data.repository.nameWithOwner}#{pr.data.number}
          </a>
          <p set:html={pr.data.titleHTML} />
          <div set:html={pr.data.bodyHTML} />
          {/* Optional `<Content />` from `await render(pr)` */}
        </div>
      ))}
    </div>
  )
}
```

## Configuration

### `githubPrsLoader` Options

| Option (* required) | Type (default)                                                 | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search`*           | `string`                                                       | The search string for querying pull requests on GitHub. This string will be concatenated with `type:pr` to form the complete search query. See [how to search pull requests](https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests). For examples:<br>`'author:xxx created:>=2024-01-01'`: matches prs written by xxx that were created after 2024.<br>`'author:xxx -user:xxx'`: matches prs written by xxx, but not to their own repositories.                   |
| `monthsBack`        | `number`                                                       | The number of recent months to load pull requests, including the current month. The loader automatically converts this to a date for the 'created' qualifier in the search query. If the `'created'` qualifier is defined in search option, it will override this value.                                                                                                                                                                                                                                    |
| `maxEntries`        | `number`                                                       | Maximum number of pull requests to load.<br>- Based on GitHub GraphQL search [max 1,000 results](https://docs.github.com/en/graphql/reference/queries#search) .<br>- Returns up to `maxEntries`, or fewer if fewer exist.<br>- If `monthsBack` is set and results exceed `maxEntries`, only `maxEntries` are returned.                                                                                                                                                                                      |
| `clearStore`        | `boolean` (default: `false`)                                   | Whether to clear the [store](https://docs.astro.build/en/reference/content-loader-reference/#store) scoped to the collection before storing newly loaded data.                                                                                                                                                                                                                                                                                                                                              |
| `githubToken`       | `string` (Defaults to the `GITHUB_TOKEN` environment variable) | A GitHub PAT with at least `repo` scope permissions. Defaults to the `GITHUB_TOKEN` environment variable. **If configured here, keep confidential and avoid public exposure.** See [how to create one](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) and [configure env vars in an Astro project](https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables). |

### `liveGithubPrsLoader` Options

| Option (* required) | Type (default)                                                 | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `githubToken`       | `string` (Defaults to the `GITHUB_TOKEN` environment variable) | A GitHub PAT with at least `repo` scope permissions. Defaults to the `GITHUB_TOKEN` environment variable. **If configured here, keep confidential and avoid public exposure.** See [how to create one](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) and [configure env vars in an Astro project](https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables). |

### `liveGithubPrsLoader` Collection Filters

| Option (* required) | Type (default) | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search`*           | `string`       | The search string for querying pull requests on GitHub. This string will be concatenated with `type:pr` to form the complete search query. See [how to search pull requests](https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests). For examples:<br>`'author:xxx created:>=2024-01-01'`: matches prs written by xxx that were created after 2024.<br>`'author:xxx -user:xxx'`: matches prs written by xxx, but not to their own repositories. |
| `monthsBack`        | `number`       | The number of recent months to load pull requests, including the current month. The loader automatically converts this to a date for the 'created' qualifier in the search query. If the `'created'` qualifier is defined in search option, it will override this value.                                                                                                                                                                                                                  |
| `maxEntries`        | `number`       | Maximum number of pull requests to load.<br>- Based on GitHub GraphQL search [max 1,000 results](https://docs.github.com/en/graphql/reference/queries#search) .<br>- Returns up to `maxEntries`, or fewer if fewer exist.<br>- If `monthsBack` is set and results exceed `maxEntries`, only `maxEntries` are returned.                                                                                                                                                                    |

### `liveGithubPrsLoader` Entry Filters

| Option (* required) | Type (default) | Description                                                                                                                                                                                                                                                                                                                                                      |
| ------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `identifier`*       | `string`       | The identifier for a pull request, which can be one of the following:<br>- A PR node ID string: "PR_" + 16 Base64 chars.<br>- A GitHub PR URL.<br>- An object with fields: `owner`, `repo`, `number`. |

## Schema

The collection entries use the following Zod schema:

```ts
const GithubPrSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  titleHTML: z.string(),
  number: z.number(),
  state: z.enum(['CLOSED', 'MERGED', 'OPEN']),
  isDraft: z.boolean(),
  body: z.string(),
  bodyHTML: z.string(),
  bodyText: z.string(),
  author: z
    .union([
      z.object({
        login: z.string(),
        name: z.string().optional(),
        url: z.string(),
        avatarUrl: z.string(),
      }),
      z.null(),
    ])
    .optional(),
  repository: z.object({
    name: z.string(),
    nameWithOwner: z.string(),
    url: z.string(),
    stargazerCount: z.number(),
    isInOrganization: z.boolean(),
    owner: z.object({
      login: z.string(),
      name: z.string().optional(),
      url: z.string(),
      avatarUrl: z.string(),
    }),
  }),
  createdAt: z.string(),
  mergedAt: z.union([z.string(), z.null()]).optional(),
})
```

Astro uses these schemas to generate TypeScript interfaces for autocompletion and type safety. When [customizing the collection schema](https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema), keep it compatible with the loader’s built-in Zod schema to avoid errors. To request support for new fields, open an issue.

## Live Collections Error Handling

Live loaders may fail due to network, API, or validation errors. [Handle these errors](https://docs.astro.build/en/guides/content-collections/#error-handling) in your components. The live loader also returns specific error codes:

- `INVALID_FILTER`: Missing required filter options.
- `COLLECTION_LOAD_ERROR`: Failed to load collection.
- `ENTRY_LOAD_ERROR`: Failed to load individual entry.

## Changelog

See [CHANGELOG.md](https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-github-prs/CHANGELOG.md) for the change history of this loader.

## Contribution

If you see any errors or room for improvement, feel free to open an [issues](https://github.com/lin-stephanie/astro-loaders/issues) or [pull request](https://github.com/lin-stephanie/astro-loaders/pulls) . Thank you in advance for contributing! ❤️

<!-- Badges -->

[version-badge]: https://img.shields.io/npm/v/astro-loader-github-prs?label=release&style=flat&colorA=080f12&colorB=f87171
[version-link]: https://www.npmjs.com/package/astro-loader-github-prs
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=f87171
[jsdocs-href]: https://www.jsdocs.io/package/astro-loader-github-prs
[npm-downloads-src]: https://img.shields.io/npm/dm/astro-loader-github-prs?style=flat&colorA=080f12&colorB=f87171
[npm-downloads-href]: https://npmjs.com/package/astro-loader-github-prs
[demo-logo]: https://img.shields.io/badge/see-demo-080f12?style=flat&colorA=080f12&colorB=f87171
[demo-link]: https://astro-antfustyle-theme.vercel.app/prs/
