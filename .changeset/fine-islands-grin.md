---
"astro-loader-bluesky-posts": minor
---

Support `uris` for direct Bluesky post URLs
Skip if `uris` unchanged, unless `src/content/config.ts` or `src/content.config.ts` changes
Rename the `linkTextType` option value from `'display-url'` to `'post-text'`
Update the `link` field to use `did` instead of `handle` within the post URL string
Update the entry Zod schema
