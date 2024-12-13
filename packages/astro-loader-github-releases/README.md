# astro-loader-github-releases

[![version][version-badge]][version-link]
[![jsDocs.io][jsdocs-src]][jsdocs-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![showcase][showcase-logo]][showcase-link]

This package provides a GitHub releases loader for Astro. The loader supports two configurable modes, allowing you to load public GitHub releases either from a user's commit history or a list of repositories. 

## Installation

```sh
npm install -D astro-loader-github-releases
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

In `src/content/config.ts` (for `^4.14.0`) or `src/content.config.ts` (for `^5.0.0`), import and configure the loader to define a new content collection:

```ts
import { defineCollection } from "astro:content"
import { githubReleasesLoader } from "astro-loader-github-releases"

const githubReleases = defineCollection({
  loader: githubReleasesLoader({
    loadMode: /* 'userCommit' or 'repoList' */,
    modeConfig: {/* Config options based on `loadMode`. See below. */},
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

const releases = await getCollection("githubReleases")
---
<!-- entryReturnType: 'byRepository' -->
{
  releases.map((repo) => (
    <div>
      <p>{repo.data.repo}</p>
      {repo.data.repoReleases.map((release) => {
        return <section set:html={release.descriptionHTML} />
      })}
    </div>
  ))
}
```

To update the data, trigger a site rebuild (e.g., using a third-party cron job service), as [the loader fetches data only at build time](https://docs.astro.build/en/reference/content-loader-reference/#object-loaders).

## Configuration

The `githubReleasesLoader` function takes an object with the following options:

| Option (* required) | Type                         | Description                                                                                                   |
| ------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `loadMode`*         | `'userCommit' \| 'repoList'` | Specifies the method to fetch GitHub releases (corresponding to different [entries' Zod Schema](#schema)). |
| `modeConfig`*       | `Record<string, any>`        | Configures options for the selected `loadMode`.                                                               |

### `userCommit` Mode

The loader uses the GitHub REST API ([`GET /users/{username}/events/public`](https://docs.github.com/en/rest/activity/events?apiVersion=2022-11-28#list-public-events-for-a-user)) to fetch up to 300 events from the past 90 days (with a latency of 30 seconds to 6 hours). If `tagNameRegex` matches, the commit will be considered a release. This mode is useful for users who want to show their recent release activities. The `modeConfig` options includes:


| Option (* required) | Type (default)                                                                                                                                     | Description                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `username`*         | `string`                                                                                                                                           | The unique username used to identify a specific GitHub account.                                                                         |
| `tagNameRegex`      | `string`（default: `'v?(\\d+\\.\\d+\\.\\d+(?:-[\\w.]+)?)(?:\\s\|$)'`)                                                                               | Regular expression for matching tag name in commit messages. The first capturing group in the regex will be used as `versionNum` field. |
| `keyword`           | `string`（default: `'release'`）                                                                                                                     | The keyword to filter push events' commit messages for releases. Can be empty, meaning no filtering.                                    |
| `branches`          | `string[]` (default: `['refs/heads/main', 'refs/heads/master', 'refs/heads/latest', 'refs/heads/stable', 'refs/heads/release', 'refs/heads/dev']`) | The branches to monitor for push events. Filters out activities from other forks based on these refs.                                   |

### `repoList` Mode

The loader fetches GitHub releases from specified repositories via the GitHub GraphQL API, requiring a GitHub PAT with `repo` scope for authentication. By default, it retrieves all releases from the listed repositories, ideal for displaying data grouped by repository. The `modeConfig` options includes:

| Option (* required) | Type (default)                                                               | Description                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `repos`*            | `string[]`                                                                   | The repositories from which to load releases, each formatted as `'owner/repo'`.                                                                                                                                                                                                                                                                                                                                                                        |
| `sinceDate`         | `Date \| string` (If `sinceDate` and `monthsBack` are unspecified, load all) | The date from which to start loading releases. See supported date string formats [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format). For example:<br>`"2024-11-01T00:00:00.000Z"`<br>`"2024-11-01"`<br>`"01/11/24"`                                                                                                                                                                 |
| `monthsBack`        | `number` (If `sinceDate` and `monthsBack` are unspecified, load all)         | The number of recent months to load releases, including the current month. **If both `monthsBack` and `sinceDate` are specified, the more recent date will be used**.                                                                                                                                                                                                                                                                                  |
| `entryReturnType`   | `'byRelease' \| 'byRepository'` (default: `'byRepository'`)                  | Determines whether entries are returned per repository or per individual release item. This option influences the entries' Zod Schema.                                                                                                                                                                                                                                                                                                                 |
| `githubToken`       | `string` (Defaults to the `GITHUB_TOKEN` environment variable)               | A GitHub PAT with at least `repo` scope permissions. **If configured here, keep confidential and avoid public exposure**. See [how to create one](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) and [configure env vars in an Astro project](https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables). |

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
  name: z.string(),
  tagName: z.string(),
  versionNum: z.string(),
  description: z.string(),
  descriptionHTML: z.string(),
  repoOwner: z.string(),
  repoName: z.string(),
  repoNameWithOwner: z.string(),
  repoUrl: z.string(),
  repoStargazerCount: z.number(),
  repoIsInOrganization: z.boolean(),
  publishedAt: z.string(),
})

// entryReturnType: 'byRepository'
const ReleaseByRepoFromReposSchema = z.object({
  repo: z.string(),
  repoReleases: z.array(ReleaseByIdFromReposSchema),
})
```

Astro automatically applies these schemas to generate TypeScript interfaces, enabling autocompletion and type-checking for collection queries. If you [customize the collection schema](https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema), ensure compatibility with the loader's built-in Zod schema to prevent errors. For additional fields, consider opening an issue.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the change history of this loader.

## Contribution

If you see any errors or room for improvement, feel free to open an [issues](https://github.com/lin-stephanie/astro-loaders/issues) or [pull request](https://github.com/lin-stephanie/astro-loaders/pulls) . Thank you in advance for contributing! ❤️

[version-badge]: https://img.shields.io/npm/v/astro-loader-github-releases?label=release&style=flat&colorA=080f12&colorB=f87171
[version-link]: https://www.npmjs.com/package/astro-loader-github-releases
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=f87171
[jsdocs-href]: https://www.jsdocs.io/package/astro-loader-github-releases
[npm-downloads-src]: https://img.shields.io/npm/dm/astro-loader-github-releases?style=flat&colorA=080f12&colorB=f87171
[npm-downloads-href]: https://npmjs.com/package/astro-loader-github-releases
[showcase-logo]: https://img.shields.io/badge/showcase-080f12?style=flat&colorA=080f12&colorB=f87171&&logoColor=ffffff&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0xMiAyMkExMCAxMCAwIDAgMSAyIDEyQTEwIDEwIDAgMCAxIDEyIDJjNS41IDAgMTAgNCAxMCA5YTYgNiAwIDAgMS02IDZoLTEuOGMtLjMgMC0uNS4yLS41LjVjMCAuMS4xLjIuMS4zYy40LjUuNiAxLjEuNiAxLjdjLjEgMS40LTEgMi41LTIuNCAyLjVtMC0xOGE4IDggMCAwIDAtOCA4YTggOCAwIDAgMCA4IDhjLjMgMCAuNS0uMi41LS41YzAtLjItLjEtLjMtLjEtLjRjLS40LS41LS42LTEtLjYtMS42YzAtMS40IDEuMS0yLjUgMi41LTIuNUgxNmE0IDQgMCAwIDAgNC00YzAtMy45LTMuNi03LTgtN20tNS41IDZjLjggMCAxLjUuNyAxLjUgMS41UzcuMyAxMyA2LjUgMTNTNSAxMi4zIDUgMTEuNVM1LjcgMTAgNi41IDEwbTMtNGMuOCAwIDEuNS43IDEuNSAxLjVTMTAuMyA5IDkuNSA5UzggOC4zIDggNy41UzguNyA2IDkuNSA2bTUgMGMuOCAwIDEuNS43IDEuNSAxLjVTMTUuMyA5IDE0LjUgOVMxMyA4LjMgMTMgNy41UzEzLjcgNiAxNC41IDZtMyA0Yy44IDAgMS41LjcgMS41IDEuNXMtLjcgMS41LTEuNSAxLjVzLTEuNS0uNy0xLjUtMS41cy43LTEuNSAxLjUtMS41IiAvPgo8L3N2Zz4=
[showcase-link]: https://astro-antfustyle-theme.vercel.app/releases/

