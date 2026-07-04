# astro-loader-github-releases

[![version][version-badge]][version-link]
[![jsDocs.io][jsdocs-src]][jsdocs-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![demo][demo-logo]][demo-link]

This package provides GitHub releases loaders for Astro projects. It includes:

- `githubReleasesLoader` – Loads releases from a list of repositories at build time.
- `liveGithubReleasesLoader` – Fetches releases at runtime on each request — releases from a list of repositories or a single release by its identifier.

## Installation

```sh
npm install astro-loader-github-releases
```

## Usage

To use the Astro loader, ensure Astro version `>=4.14.0`. For `^4.14.0`, enable the [experimental content layer](https://v4.docs.astro.build/en/reference/configuration-reference/#experimentalcontentlayer) in `astro.config.ts`:

```ts
export default defineConfig({
  experimental: {
    contentLayer: true,
  },
})
```

### `githubReleasesLoader` (Build-time Collection)

In `src/content/config.ts` (for `^4.14.0`) or `src/content.config.ts` (for `>=5.0.0`), import and configure the build-time loader to define a new content collection:

```ts
import { defineCollection } from "astro:content"
import { githubReleasesLoader } from "astro-loader-github-releases"

const githubReleases = defineCollection({
  loader: githubReleasesLoader({
    repos: ['withastro/astro'],
  }),
})

export const collections = { githubReleases }
```

[Query the content collection](https://docs.astro.build/en/guides/content-collections/#querying-collections) like any other Astro content collection to render the loaded releases:

```astro
---
import { getCollection } from "astro:content"

const releases = await getCollection("githubReleases")
---
<!-- Entries' Zod Schema varies by `entryReturnType`. -->
<ul>
  {
    releases.map((release) => (
      <li>
        <a href={release.data.url}>{release.data.repoNameWithOwner} - {release.data.tagName}</a>
      </li>
    ))
  }
</ul>
```

Support rendering of release content:

```astro
---
import { getCollection } from "astro:content"

const releases = await getCollection("githubReleases")
---
<!-- entryReturnType: 'byRelease' -->
{
  releases.map(async (release) => {
    const { Content } = await render(release)
    return <Content />
  })
}
```

```astro
---
import { getCollection } from "astro:content"

const repos = await getCollection("githubReleases")
---
<!-- entryReturnType: 'byRepository' -->
{
  repos.map((repo) => (
    <div>
      <p>{repo.data.repo}</p>
      {repo.data.releases.map((release) => {
        return <section set:html={release.descriptionHTML} />
      })}
    </div>
  ))
}
```

To update the data, trigger a site rebuild (e.g., using a third-party cron job service), as [the loader fetches data only at build time](https://docs.astro.build/en/reference/content-loader-reference/#object-loaders).

### `liveGithubReleasesLoader` (Live Collection)

To use live content collections, ensure Astro version `>=5.10.0` and use an adapter that supports [on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/) with [`astro:env/server` runtime support](https://docs.astro.build/en/guides/environment-variables/#type-safe-environment-variables). For `^5.10.0`, [enable the experimental `liveContentCollections` flag](https://v5.docs.astro.build/en/reference/experimental-flags/live-content-collections/) in `astro.config.ts`:

```ts
export default {
  experimental: {
    liveContentCollections: true,
  },
};
```
Starting in `6.0.0`, this feature is no longer experimental. In `src/live.config.ts`, import and configure the live loader to define a new live content collection:

```ts
import { defineLiveCollection } from 'astro:content';
import { liveGithubReleasesLoader } from 'astro-loader-github-releases/live';

const liveGithubReleases = defineLiveCollection({
  loader: liveGithubReleasesLoader(),
});

export const collections = { liveGithubReleases };
```

Query at runtime using `getLiveCollection()` or `getLiveEntry()`:

```astro
---
export const prerender = false;
import { getLiveCollection, getLiveEntry } from 'astro:content';

// Get releases
const { entries: releases, error } = await getLiveCollection('liveGithubReleases', {
  repos: ['withastro/astro'],
});

// Get individual release
/* const { entry: release } = await getLiveEntry('liveGithubReleases', {
  // by release node ID
  identifier: 'RE_kwDOFL76Q84O4ieR',

  // by url
  identifier: 'https://github.com/withastro/astro/releases/tag/astro@5.13.11',

  // by object
  identifier: { owner: 'withastro', repo: 'astro', tagName: 'astro@5.13.11' },
}); */
---

{
  error ? (
    <p>{error.message}</p>
  ) : (
    <div>
      {releases?.map((release) => (
        <div>
          <a href={release.data.url}>{release.data.repoNameWithOwner} - {release.data.tagName}</a>
          {/* Optional `<Content />` from `await render(release)` */}
        </div>
      ))}
    </div>
  )
}
```

## Configuration

### `githubReleasesLoader` Options

| Option (* required) | Type (default)                                                               | Description                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `repos`*            | `string[]`                                                                   | The repositories from which to load releases, each formatted as `'owner/repo'`.                                                                                                                                                                                                                                                                                                                                                                        |
| `sinceDate`         | `Date \| string \| number` (If `sinceDate` and `monthsBack` are unspecified, load all) | The date from which to start loading releases. See supported date string formats [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format). For example:<br>`"2024-11-01T00:00:00.000Z"`<br>`"2024-11-01"`<br>`"01/11/24"`                                                                                                                                                                 |
| `monthsBack`        | `number` (If `sinceDate` and `monthsBack` are unspecified, load all)         | The number of recent months to load releases, including the current month. **If both `monthsBack` and `sinceDate` are specified, the more recent date will be used**.                                                                                                                                                                                                                                                                                  |
| `entryReturnType`   | `'byRelease' \| 'byRepository'` (default: `'byRepository'`)                  | Determines whether entries are returned per repository or per individual release item. This option influences the entries' Zod Schema.                                                                                                                                                                                                                                                                                                                 |
| `clearStore`        | `boolean` (default: `false`)                                                 | Whether to clear the [store](https://docs.astro.build/en/reference/content-loader-reference/#store) scoped to the collection before storing newly loaded data. |
| `githubToken`       | `string` (Defaults to `GITHUB_TOKEN` via `import.meta.env`)                  | A GitHub PAT with at least `repo` scope permissions. **If configured here, keep confidential and avoid public exposure**. See [how to create one](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) and [configure env vars in an Astro project](https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables). |

### `liveGithubReleasesLoader` Options

| Option                                                                                | Type (default)                                                 | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `githubToken` | `string` (Defaults to `GITHUB_TOKEN` via `getSecret()`) | A GitHub PAT with at least `repo` scope permissions. **If configured here, keep confidential and avoid public exposure.** See [how to create one](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) and [configure env vars in an Astro project](https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables). |

### `liveGithubReleasesLoader` Collection Filters

| Option (* required) | Type (default)                                              | Description                                                                                                                                                                                                                                                                    |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `repos`*            | `string[]`                                                  | The repositories from which to load releases, each formatted as `'owner/repo'`.                                                                                                                                                                                                |
| `sinceDate`         | `Date \| string`                                            | The date from which to start loading releases. If both `monthsBack` and `sinceDate` are specified, the more recent date will be used.                                                                                                                                          |
| `monthsBack`        | `number`                                                    | The number of recent months to load releases, including the current month. If both `monthsBack` and `sinceDate` are specified, the more recent date will be used.                                                                                                              |
| `entryReturnType`   | `'byRelease' \| 'byRepository'` (default: `'byRepository'`) | Determines whether entries are returned per repository or per individual release item. This option influences the entries' Zod Schema.                                                                                                                                          |

### `liveGithubReleasesLoader` Entry Filters

| Option (* required) | Type (default) | Description                                                                                                                                                                                           |
| ------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `identifier`*       | `string \| object` | The identifier for a release, which can be one of the following:<br>- A GitHub Release global node ID string, such as `RE_kwDOFL76Q84O4ieR`.<br>- A GitHub release URL.<br>- An object with fields: `owner`, `repo`, `tagName`. |

## Schema

The collection entries use the following Zod schema:

```ts
// entryReturnType: 'byRelease'
const ReleaseByIdFromReposSchema = z.object({
  id: z.string(),
  url: z.string(),
  name: z.string().optional(),
  tagName: z.string(),
  versionNum: z.string().optional(),
  description: z.string().optional(),
  descriptionHTML: z.string().optional(),
  isDraft: z.boolean(),
  isLatest: z.boolean(),
  isPrerelease: z.boolean(),
  repoOwner: z.string(),
  repoName: z.string(),
  repoNameWithOwner: z.string(),
  repoUrl: z.string(),
  repoStargazerCount: z.number(),
  repoIsInOrganization: z.boolean(),
  createdAt: z.string(),
  publishedAt: z.string().optional(),
})

// entryReturnType: 'byRepository'
const ReleaseByRepoFromReposSchema = z.object({
  repo: z.string(),
  releases: z.array(ReleaseByIdFromReposSchema),
})
```

Astro uses these schemas to generate TypeScript interfaces for autocompletion and type safety. When [customizing the collection schema](https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema), keep it compatible with the loader’s built-in Zod schema to avoid errors. To request support for new fields, open an issue.

## Live Collections Error Handling

Live loaders may fail due to network, API, or validation errors. [Handle these errors](https://docs.astro.build/en/reference/experimental-flags/live-content-collections/#error-handling) in your components. The live loader also returns specific error codes:

- `MISSING_TOKEN`: No GitHub token provided.
- `INVALID_FILTER`: Missing required filter options.
- `INVALID_IDENTIFIER`: Invalid release identifier.
- `COLLECTION_LOAD_ERROR`: Failed to load collection.
- `ENTRY_LOAD_ERROR`: Failed to load individual entry.

## Changelog

See [CHANGELOG.md](https://github.com/lin-stephanie/astro-loaders/blob/main/packages/astro-loader-github-releases/CHANGELOG.md) for the change history of this loader.

## Contribution

If you see any errors or room for improvement, feel free to open an [issues](https://github.com/lin-stephanie/astro-loaders/issues) or [pull request](https://github.com/lin-stephanie/astro-loaders/pulls) . Thank you in advance for contributing! ❤️

<!-- Badges -->

[version-badge]: https://img.shields.io/npm/v/astro-loader-github-releases?label=release&style=flat&colorA=080f12&colorB=f87171
[version-link]: https://www.npmjs.com/package/astro-loader-github-releases
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=f87171
[jsdocs-href]: https://www.jsdocs.io/package/astro-loader-github-releases
[npm-downloads-src]: https://img.shields.io/npm/dm/astro-loader-github-releases?style=flat&colorA=080f12&colorB=f87171
[npm-downloads-href]: https://npmjs.com/package/astro-loader-github-releases
[demo-logo]: https://img.shields.io/badge/see-demo-080f12?style=flat&colorA=080f12&colorB=f87171
[demo-link]: https://astro-antfustyle-theme.vercel.app/releases/
