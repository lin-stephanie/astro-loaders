# astro-loader-github-releases

[![version][version-badge]][version-link]
[![jsDocs.io][jsdocs-src]][jsdocs-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

This package provides a GitHub releases loader for Astro. The loader supports two configurable modes, allowing you to load public release data either from a user's commit history or from a specified list of repositories. 

## Usage

To use the Astro loader, ensure Astro version `^4.14.0 || ^5.0.0-beta.0`. For `^4.14.0`, enable the [experimental content layer](https://docs.astro.build/en/reference/configuration-reference/#experimentalcontentlayer) in `astro.config.ts`:

```ts
export default defineConfig({
  // ...
  experimental: {
    contentLayer: true,
  },
});
```

In the `src/content/config.ts` file, import and configure the GitHub releases loader to define a new content collection:

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
import { getCollection, type CollectionEntry } from "astro:content";

const releases = await getCollection("githubReleases");
---

<ul>
  {
    releases.map((release) => (
      <li>
        {/* Entry structure varies by `loadMode`. See below. */}
        <a href={release.data.releaseUrl}>{release.data.repoName} - {release.data.releaseVersion}</a>
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

In `userCommit` mode, the loader fetches release data from commit messages in push events for a specific GitHub user via the GitHub REST API endpoint ([`GET /users/{username}/events/public`](https://docs.github.com/en/rest/activity/events?apiVersion=2022-11-28#list-public-events-for-a-user)), with data retrieval limited to the past 90 days. This mode is useful for users who want to show their recent release activities. The `modeConfig` options includes:

| Option (* required) | Zod Type (defaults)                                                                                                                               | Description                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `username`*         | `string`                                                                                                                                          | The unique username used to identify a specific GitHub account.                                                                                         |
| `keyword`           | `string`（defaults: `'release'`）                                                                                                                   | The keyword to filter push events' commit messages for releases.                                                                                        |
| `versionRegex`      | `string`（defaults: `'v?(\\d+\\.\\d+\\.\\d+(?:-[\\w.]+)?)(?:\\s\|$)'`)                                                                             | Regular expression for matching version numbers in commit messages. The first capturing group in the regex will be used for the `releaseVersion` field. |
| `branches`          | `string[]`(default: `['refs/heads/main', 'refs/heads/master', 'refs/heads/latest', 'refs/heads/stable', 'refs/heads/release', 'refs/heads/dev']`) | The branches to monitor for push events. Filters out activities from other forks based on these refs.                                                   |
| `prependV`          | `boolean` (default: `true`)                                                                                                                       | Whether to prepend "v" to the `releaseVersion` field value.                                                                                             |

In `repoList` mode, the loader fetches release data from a specified list of repositories using the GitHub GraphQL API for querying. By default, it retrieves all releases from the listed repositories, ideal for displaying data grouped by repository. The `modeConfig` options includes:

| Option (* required) | Type (defaults)                                              | Description                                                                                                                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `repos`*            | `string[]`                                                   | The repositories from which to load release data, each formatted as `'owner/repo'`.                                                                                                                                                                                                               |
| `sinceDate`         | `Date \| null` (defaults: `null`)                            | The date from which to start loading release data. If not specified, load all. See supported formats [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse#examples). For example:<br>`"2024-11-01T00:00:00.000Z"`<br>`"2024-11-01"`<br>`"01/11/24"` |
| `entryReturnType`   | `'byRelease' \| 'byRepository'` (defaults: `'byRepository'`) | Determines whether entries are returned per repository or per individual release item. This option influences the Zod Schema of the loaded entries.                                                                                                                                               |

**Note**: `userCommit` mode updates entries incrementally, while `repoList` mode reloads all entries on each rebuild.

## Schema

In `userCommit` mode, the Zod schema for the loaded collection entries is defined as follows:

```ts
/* User Commit Mode */
const ReleaseByIdFromUserSchema = z.object({
  id: z.string(),
  repoName: z.string(),
  repoUrl: z.string(),
  releaseVersion: z.string(),
  releaseUrl: z.string(),
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

In `repoList` mode, the Zod schema for the loaded collection entries is defined as follows:

```ts
/* Repo List Mode */
// entryReturnType: 'byRelease'
const ReleaseByIdFromReposSchema = z.object({
  id: z.string(),
  repoName: z.string(),
  repoUrl: z.string(),
  releaseVersion: z.string(),
  releaseUrl: z.string(),
  releaseTitle: z.string(),
  releaseDesc: z.string(),
  releaseDescHtml: z.string(),
  publishedAt: z.string(),
})
export type ReleaseByIdFromRepos = z.infer<typeof ReleaseByIdFromReposSchema>

// entryReturnType: 'byRepository'
const ReleaseByRepoFromReposSchema = z.object({
  repo: z.string(),
  repoReleases: z.array(ReleaseByIdFromReposSchema),
})
export type ReleaseByRepoFromRepos = z.infer<
  typeof ReleaseByRepoFromReposSchema
>
```

Astro automatically applies this schema to generate TypeScript interfaces, providing full support for autocompletion and type-checking when querying the collection.

If you need to [customize the collection schema](https://5-0-0-beta.docs.astro.build/en/guides/content-collections/#defining-the-collection-schema), ensure it remains compatible with the built-in Zod schema to avoid errors. For additional fields you'd like to fetch, feel free to [open an issue](https://github.com/lin-stephanie/astro-loaders/issues).


[version-badge]: https://img.shields.io/npm/v/astro-loader-github-releases?label=release&style=flat&colorA=080f12&colorB=ef7575
[version-link]: https://www.npmjs.com/package/astro-loader-github-releases
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=ef7575
[jsdocs-href]: https://www.jsdocs.io/package/astro-loader-github-releases
[npm-downloads-src]: https://img.shields.io/npm/dm/astro-loader-github-releases?style=flat&colorA=080f12&colorB=ef7575
[npm-downloads-href]: https://npmjs.com/package/astro-loader-github-releases
