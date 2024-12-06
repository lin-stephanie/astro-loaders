# astro-loader-github-prs

[![version][version-badge]][version-link]
[![jsDocs.io][jsdocs-src]][jsdocs-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

This package provides a GitHub PRs loader for Astro, fetching pull requests via a GitHub search query for use in Astro projects.

## Installation

```sh
npm install -D astro-loader-github-prs
```

## Usage

To use the Astro loader, ensure Astro version `^4.14.0 || ^5.0.0`. For `^4.14.0`, enable the [experimental content layer](https://docs.astro.build/en/reference/configuration-reference/#experimentalcontentlayer) in `astro.config.ts`:

```ts
export default defineConfig({
  experimental: {
    contentLayer: true,
  },
});
```

In `src/content/config.ts`, import and configure the GitHub PRs loader to define a new content collection:

```ts
import { defineCollection } from "astro:content";
import { githubPrsLoader } from "astro-loader-github-prs";

const githubPrs = defineCollection({
  loader: githubPrsLoader({
    search: 'author:username created:>=2024-10-01',
  }),
});

export const collections = { githubPrs };
```

[Query the content collection](https://docs.astro.build/en/guides/content-collections/#querying-collections) like any other Astro content collection to render the loaded GitHub PRs:

```astro
---
import { getCollection } from "astro:content";

const prs = await getCollection("githubPrs");
---

<ul>
  {
    prs.map((pr) => (
      <li>
        <a href={pr.data.url}>{pr.data.title} - {pr.data.repository.nameWithOwner}</a>
      </li>
    ))
  }
</ul>
```

To update the data, trigger a site rebuild, as [the loader fetches data only at build time](https://docs.astro.build/en/reference/content-loader-reference/#object-loaders).

## Configuration

The loader fetches PRs via the GitHub GraphQL API with a search string, requiring a `repo`-scoped PAT, and returns up to 1,000 results. Options include:

| Option (* required) | Type (defaults)                                       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search`*           | `string`                                              | The search string for querying pull requests on GitHub. This string will be concatenated with `type:pr` to form the complete search query. See [how to search pull requests](https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests). For examples:<br>`'author:xxx created:>=2024-01-01'`: matches prs written by xxx that were created after 2024.<br>`'author:xxx -user:xxx'`: matches prs written by xxx, but not to their own repositories.                   |
| `githubToken`       | `string` (defaults: `'import.meta.env.GITHUB_TOKEN'`) | A GitHub PAT with at least `repo` scope permissions. Defaults to the `GITHUB_TOKEN` environment variable. **If configured here, keep confidential and avoid public exposure.** See [how to create one](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) and [configure env vars in an Astro project](https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables). |


## Schema

The Zod schema for the loaded collection entries is defined as follows:

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
  author: z.object({
    login: z.string(),
    url: z.string(),
    avatarUrl: z.string(),
  }),
  repository: z.object({
    name: z.string(),
    nameWithOwner: z.string(),
    url: z.string(),
    stargazerCount: z.number(),
    isInOrganization: z.boolean(),
    owner: z.object({
      login: z.string(),
      url: z.string(),
      avatarUrl: z.string(),
    }),
  }),
  createdAt: z.string(),
  mergedAt: z.string(),
})
```

Astro automatically applies this schema to generate TypeScript interfaces, providing full support for autocompletion and type-checking when querying the collection.

If you need to [customize the collection schema](https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema), ensure it remains compatible with the built-in Zod schema of the loader to avoid errors. For additional fields you'd like to fetch, feel free to [open an issue](https://github.com/lin-stephanie/astro-loaders/issues).


[version-badge]: https://img.shields.io/npm/v/astro-loader-github-prs?label=release&style=flat&colorA=080f12&colorB=ef7575
[version-link]: https://www.npmjs.com/package/astro-loader-github-prs
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=ef7575
[jsdocs-href]: https://www.jsdocs.io/package/astro-loader-github-prs
[npm-downloads-src]: https://img.shields.io/npm/dm/astro-loader-github-prs?style=flat&colorA=080f12&colorB=ef7575
[npm-downloads-href]: https://npmjs.com/package/astro-loader-github-prs

