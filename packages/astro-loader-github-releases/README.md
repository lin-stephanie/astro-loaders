# astro-loader-github-releases

[![version][version-badge]][version-link]
[![jsDocs.io][jsdocs-src]][jsdocs-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![demo][demo-logo]][demo-link]

This package provides GitHub releases loaders for Astro projects. It includes:

- `githubReleasesLoader` – Loads releases at build time. Supports two modes: load from a user’s commit history or from a list of repositories.
- `liveGithubReleasesLoader` – Fetches releases at runtime on each request. Supports the same two modes when fetching multiple releases, or fetches a single release by its identifier.

## Installation

```sh
npm install astro-loader-github-releases
```

## Usage

To use the Astro loader, ensure Astro version `^4.14.0 || ^5.0.0`. For `^4.14.0`, enable the [experimental content layer](https://v4.docs.astro.build/en/reference/configuration-reference/#experimentalcontentlayer) in `astro.config.ts`:

```ts
export default defineConfig({
  experimental: {
    contentLayer: true,
  },
})
```

### `githubReleasesLoader` (Build-time Collection)

In `src/content/config.ts` (for `^4.14.0`) or `src/content.config.ts` (for `^5.0.0`), import and configure the build-time loader to define a new content collection:

```ts
import { defineCollection } from "astro:content"
import { githubReleasesLoader } from "astro-loader-github-releases"

const githubReleases = defineCollection({
  loader: githubReleasesLoader({
    mode: /* 'userCommit' or 'repoList' */,
    // Config options based on `mode`. See below.
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
<!-- Entries' Zod Schema varies by `loadMode`. See below. -->
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

`repoList` mode supports rendering release content:

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

### `liveGithubReleasesLoader` (Live Collection, Experimental)

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
import { liveGithubReleasesLoader } from 'astro-loader-github-releases';

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
  mode: /* 'userCommit' or 'repoList' */,
  // Config options based on `mode`. See below.
});

// Get individual release
/* const { entry: release } = await getLiveEntry('liveGithubReleases', {
  // by release node ID
  identifier: 'RE_kwDOFL76Q84O4ieR',

  // by url
  identifier: 'https://github.com/withastro/astro/releases/tag/astro@5.13.11',

  // by object
  identifier: { owner: 'withastro', repo: 'astro', tag: 'astro@5.13.11' },
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
          {/* Optional `<Content />` from `await render(release)` for `mode: 'repoList'` */}
        </div>
      ))}
    </div>
  )
}
```


## Configuration

### `githubReleasesLoader` Options

| Option (* required) | Type (default)               | Description                                                                                                                                                    |
| ------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mode`*             | `'userCommit' \| 'repoList'` | Specifies loading releases from a user’s commit messages or a repository list, with mode-specific options and [entries' Zod Schema](#schema).                  |
| `clearStore`        | `boolean` (default: `false`) | Whether to clear the [store](https://docs.astro.build/en/reference/content-loader-reference/#store) scoped to the collection before storing newly loaded data. |

#### `userCommit` Mode

The loader uses the GitHub REST API ([`GET /users/{username}/events/public`](https://docs.github.com/en/rest/activity/events?apiVersion=2022-11-28#list-public-events-for-a-user)) to fetch up to 300 events from the past 90 days (with a latency of 30 seconds to 6 hours). If `tagNameRegex` matches, the commit will be considered a release. This mode is useful for users who want to show their recent release activities. The `modeConfig` options includes:

| Option (* required) | Type (default)                                                                                                                                     | Description                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `username`*         | `string`                                                                                                                                           | The unique username used to identify a specific GitHub account.                                                                         |
| `tagNameRegex`      | `string`（default: `'v?(\\d+\\.\\d+\\.\\d+(?:-[\\w.]+)?)(?:\\s\|$)'`)                                                                               | Regular expression for matching tag name in commit messages. The first capturing group in the regex will be used as `versionNum` field. |
| `keyword`           | `string`（default: `'release'`）                                                                                                                     | The keyword to filter push events' commit messages for releases. Can be empty, meaning no filtering.                                    |
| `branches`          | `string[]` (default: `['refs/heads/main', 'refs/heads/master', 'refs/heads/latest', 'refs/heads/stable', 'refs/heads/release', 'refs/heads/dev']`) | The branches to monitor for push events. Filters out activities from other forks based on these refs.                                   |

#### `repoList` mode

The loader fetches GitHub releases from specified repositories via the GitHub GraphQL API, requiring a GitHub PAT with `repo` scope for authentication. By default, it retrieves all releases from the listed repositories, ideal for displaying data grouped by repository. The `modeConfig` options includes:

| Option (* required) | Type (default)                                                               | Description                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `repos`*            | `string[]`                                                                   | The repositories from which to load releases, each formatted as `'owner/repo'`.                                                                                                                                                                                                                                                                                                                                                                        |
| `sinceDate`         | `Date \| string` (If `sinceDate` and `monthsBack` are unspecified, load all) | The date from which to start loading releases. See supported date string formats [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format). For example:<br>`"2024-11-01T00:00:00.000Z"`<br>`"2024-11-01"`<br>`"01/11/24"`                                                                                                                                                                 |
| `monthsBack`        | `number` (If `sinceDate` and `monthsBack` are unspecified, load all)         | The number of recent months to load releases, including the current month. **If both `monthsBack` and `sinceDate` are specified, the more recent date will be used**.                                                                                                                                                                                                                                                                                  |
| `entryReturnType`   | `'byRelease' \| 'byRepository'` (default: `'byRepository'`)                  | Determines whether entries are returned per repository or per individual release item. This option influences the entries' Zod Schema.                                                                                                                                                                                                                                                                                                                 |
| `githubToken`       | `string` (Defaults to the `GITHUB_TOKEN` environment variable)               | A GitHub PAT with at least `repo` scope permissions. **If configured here, keep confidential and avoid public exposure**. See [how to create one](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) and [configure env vars in an Astro project](https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables). |

### `liveGithubReleasesLoader` Options

| Option                                                                                | Type (default)                                                 | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `githubToken` (required for multiple releases in `repoList` mode or a single release) | `string` (Defaults to the `GITHUB_TOKEN` environment variable) | A GitHub PAT with at least `repo` scope permissions. Defaults to the `GITHUB_TOKEN` environment variable. **If configured here, keep confidential and avoid public exposure.** See [how to create one](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) and [configure env vars in an Astro project](https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables). |

### `liveGithubReleasesLoader` Collection Filters

| Option (* required) | Type (default)               | Description                                                                                                                                   |
| ------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `mode`*             | `'userCommit' \| 'repoList'` | Specifies loading releases from a user’s commit messages or a repository list, with mode-specific options and [entries' Zod Schema](#schema). |

#### `userCommit` Mode

The loader uses the GitHub REST API ([`GET /users/{username}/events/public`](https://docs.github.com/en/rest/activity/events?apiVersion=2022-11-28#list-public-events-for-a-user)) to fetch up to 300 events from the past 90 days (with a latency of 30 seconds to 6 hours). If `tagNameRegex` matches, the commit will be considered a release. This mode is useful for users who want to show their recent release activities. The `modeConfig` options includes:

| Option (* required) | Type (default)                                                                                                                                     | Description                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `username`*         | `string`                                                                                                                                           | The unique username used to identify a specific GitHub account.                                                                         |
| `tagNameRegex`      | `string`（default: `'v?(\\d+\\.\\d+\\.\\d+(?:-[\\w.]+)?)(?:\\s\|$)'`)                                                                               | Regular expression for matching tag name in commit messages. The first capturing group in the regex will be used as `versionNum` field. |
| `keyword`           | `string`（default: `'release'`）                                                                                                                     | The keyword to filter push events' commit messages for releases. Can be empty, meaning no filtering.                                    |
| `branches`          | `string[]` (default: `['refs/heads/main', 'refs/heads/master', 'refs/heads/latest', 'refs/heads/stable', 'refs/heads/release', 'refs/heads/dev']`) | The branches to monitor for push events. Filters out activities from other forks based on these refs.                                   |

#### `repoList` mode

The loader fetches GitHub releases from specified repositories via the GitHub GraphQL API, requiring a GitHub PAT with `repo` scope for authentication. By default, it retrieves all releases from the listed repositories, ideal for displaying data grouped by repository. The `modeConfig` options includes:

| Option (* required) | Type (default)                                                               | Description                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `repos`*            | `string[]`                                                                   | The repositories from which to load releases, each formatted as `'owner/repo'`.                                                                                                                                                                                                                                                                                                                                                                        |
| `sinceDate`         | `Date \| string` (If `sinceDate` and `monthsBack` are unspecified, load all) | The date from which to start loading releases. See supported date string formats [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format). For example:<br>`"2024-11-01T00:00:00.000Z"`<br>`"2024-11-01"`<br>`"01/11/24"`                                                                                                                                                                 |
| `monthsBack`        | `number` (If `sinceDate` and `monthsBack` are unspecified, load all)         | The number of recent months to load releases, including the current month. **If both `monthsBack` and `sinceDate` are specified, the more recent date will be used**.                                                                                                                                                                                                                                                                                  |
| `entryReturnType`   | `'byRelease' \| 'byRepository'` (default: `'byRepository'`)                  | Determines whether entries are returned per repository or per individual release item. This option influences the entries' Zod Schema.                                                                                                                                                                                                                                                                                                                 |

### `liveGithubReleasesLoader` Entry Filters

| Option (* required) | Type (default) | Description                                                                                                                                                                                           |
| ------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `identifier`*       | `string`       | The identifier for a release, which can be one of the following:<br>- A release node ID string: "RE_" + 16 Base64 chars.<br>- A GitHub release URL.<br>- An object with fields: `owner`, `repo`, `tagName`. |

## Schema

The Zod schema for the entries in the loaded collection is defined below.

### `userCommit` Mode

```ts
const ReleaseByIdFromUserSchema = z.object({
  id: z.string(),
  url: z.string(),
  tagName: z.string(),
  versionNum: z.string(),
  repoOwner: z.string(),
  repoName: z.string(),
  repoNameWithOwner: z.string(),
  repoUrl: z.string(),
  commitMessage: z.string(),
  commitSha: z.string(),
  commitUrl: z.string(),
  actorLogin: z.string(),
  actorAvatarUrl: z.string(),
  isOrg: z.boolean(),
  orgLogin: z.string().optional(),
  orgAvatarUrl: z.string().optional(),
  createdAt: z.string(),
})
```

### `repoList` Mode

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

Live loaders may fail due to network, API, or validation errors. [Handle these errors](https://docs.astro.build/en/guides/content-collections/#error-handling) in your components. The live loader also returns specific error codes:

- `INVALID_FILTER`: Missing required filter options.
- `NO_NEW_RELEASES`: No new releases found since last fetch.
- `COLLECTION_LOAD_ERROR`: Failed to load collection.
- `ENTRY_LOAD_ERROR`: Failed to load individual entry.
- `MISSING_TOKEN`: No GitHub token provided (expect for `userCommit` mode).

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

