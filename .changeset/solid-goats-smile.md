---
"astro-loader-github-releases": major
---

Update Configuration Structure
- Renamed `loadMode` to `mode`
- Removed `modeConfig`; options are now configured per mode
Add `clearStore` option to clear store before saving new data
In `repoList` mode, when `entryReturnType: 'byRepository'`, renamed `releases` in the entry Zod schema to `repoReleases`.
