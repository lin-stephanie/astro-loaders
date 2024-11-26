# astro-loader-github-releases

[![version][version-badge]][version-link]
[![jsDocs.io][jsdocs-src]][jsdocs-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

This package provides a GitHub releases loader for Astro. The loader supports two configurable modes, allowing you to load public release data either from a user's commit history or from a specified list of repositories. 

## Installation

```sh
npm install -D astro-loader-github-releases
```

## Usage

To use the Astro loader, ensure Astro version `^4.14.0 || ^5.0.0-beta.0`. For `^4.14.0`, enable the [experimental content layer](https://docs.astro.build/en/reference/configuration-reference/#experimentalcontentlayer) in `astro.config.ts`:

```ts
export default defineConfig({
  experimental: {
    contentLayer: true,
  },
});
```

In `src/content/config.ts`, import and configure the GitHub releases loader to define a new content collection:

```ts
import { defineCollection } from "astro:content";
import { githubReleasesLoader } from "astro-loader-github-releases";

const githubReleases = defineCollection({
  loader: githubReleasesLoader({
    loadMode: /* 'userCommit' or 'repoList' */,
    modeConfig: {/* Config options based on `loadMode`. See below. */},
  }),
});

export const collections = { githubReleases };
```

[Query the content collection](https://5-0-0-beta.docs.astro.build/en/guides/content-collections/#querying-collections) like any other Astro content collection to render the loaded release data:

```astro
---
import { getCollection } from "astro:content";

const releases = await getCollection("githubReleases");
---

<ul>
  {
    releases.map((release) => (
      <li>
        {/* Entry structure varies by `loadMode`. See below. */}
        <a href={release.data.url}>{release.data.repoName} - {release.data.tagName}</a>
      </li>
    ))
  }
</ul>
```

To update the data, trigger a site rebuild, as [the loader fetches data only at build time](https://5-0-0-beta.docs.astro.build/en/reference/content-loader-reference/#object-loaders).

## Configuration

The `githubReleasesLoader` function takes an object with the following options:

| Option (* required) | Type                         | Description                                                                                                   |
| ------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `loadMode`*         | `'userCommit' \| 'repoList'` | Specifies the method to fetch GitHub release data (corresponding to different [entries Zod Schema](#schema)). |
| `modeConfig`*       | `Record<string, any>`        | Configures options for the selected `loadMode`.                                                               |

**In `userCommit` mode**, the loader uses the GitHub REST API ([`GET /users/{username}/events/public`](https://docs.github.com/en/rest/activity/events?apiVersion=2022-11-28#list-public-events-for-a-user)) to fetch up to 300 events from the past 90 days. Data may have a latency of 30 seconds to 6 hours and is not real-time. This mode is useful for users who want to show their recent release activities. The `modeConfig` options includes:

| Option (* required) | Type (defaults)                                                                                                                                   | Description                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `username`*         | `string`                                                                                                                                          | The unique username used to identify a specific GitHub account.                                                                         |
| `keyword`           | `string`（defaults: `'release'`）                                                                                                                   | The keyword to filter push events' commit messages for releases.                                                                        |
| `tagNameRegex`      | `string`（defaults: `'v?(\\d+\\.\\d+\\.\\d+(?:-[\\w.]+)?)(?:\\s\|$)'`)                                                                             | Regular expression for matching tag name in commit messages. The first capturing group in the regex will be used as `versionNum` field. |
| `branches`          | `string[]`(default: `['refs/heads/main', 'refs/heads/master', 'refs/heads/latest', 'refs/heads/stable', 'refs/heads/release', 'refs/heads/dev']`) | The branches to monitor for push events. Filters out activities from other forks based on these refs.                                   |

**In `repoList` mode**, the loader fetches release data from specified repositories via the GitHub GraphQL API, requiring a GitHub PAT with `repo` scope for authentication. By default, it retrieves all releases from the listed repositories, ideal for displaying data grouped by repository. The `modeConfig` options includes:

| Option (* required) | Type (defaults)                                              | Description                                                                                                                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `repos`*            | `string[]`                                                   | The repositories from which to load release data, each formatted as `'owner/repo'`.                                                                                                                                                                                                               |
| `sinceDate`         | `Date \| null` (defaults: `null`)                            | The date from which to start loading release data. If not specified, load all. See supported formats [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse#examples). For example:<br>`"2024-11-01T00:00:00.000Z"`<br>`"2024-11-01"`<br>`"01/11/24"` |
| `entryReturnType`   | `'byRelease' \| 'byRepository'` (defaults: `'byRepository'`) | Determines whether entries are returned per repository or per individual release item. This option influences the Zod Schema of the loaded entries.                                                                                                                                               |
| `githubToken`       | `string` (defaults: `'import.meta.env.GITHUB_TOKEN'`)        | A GitHub PAT with at least `repo` scope permissions. Defaults to the `GITHUB_TOKEN` environment variable. **If configured here, keep confidential and avoid public exposure.** See [how to create one](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) and [configure env vars in an Astro project](https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables).                                                                                                                    |

## Schema

**In `userCommit` mode**, the Zod schema for the loaded collection entries is defined as follows:

```ts
const ReleaseByIdFromUserSchema = z.object({
  id: z.string(),
  url: z.string(),
  versionNum: z.string(),
  tagName: z.string(),
  repoName: z.string(),
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

**In `repoList` mode**, the Zod schema for the loaded collection entries is defined as follows:

```ts
// entryReturnType: 'byRelease'
const ReleaseByIdFromReposSchema = z.object({
  id: z.string(),
  url: z.string(),
  name: z.string(),
  tagName: z.string(),
  description: z.string(),
  descriptionHTML: z.string(),
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

Astro automatically applies this schema to generate TypeScript interfaces, providing full support for autocompletion and type-checking when querying the collection.

If you need to [customize the collection schema](https://5-0-0-beta.docs.astro.build/en/guides/content-collections/#defining-the-collection-schema), ensure it remains compatible with the built-in Zod schema of the loader to avoid errors. For additional fields you'd like to fetch, feel free to [open an issue](https://github.com/lin-stephanie/astro-loaders/issues).


[version-badge]: https://img.shields.io/npm/v/astro-loader-github-releases?label=release&style=flat&colorA=080f12&colorB=ef7575
[version-link]: https://www.npmjs.com/package/astro-loader-github-releases
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=ef7575
[jsdocs-href]: https://www.jsdocs.io/package/astro-loader-github-releases
[npm-downloads-src]: https://img.shields.io/npm/dm/astro-loader-github-releases?style=flat&colorA=080f12&colorB=ef7575
[npm-downloads-href]: https://npmjs.com/package/astro-loader-github-releases
