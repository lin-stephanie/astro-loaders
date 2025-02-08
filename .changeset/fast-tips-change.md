---
"astro-loader-bluesky-posts": minor
---

Support retrieving post URL (`link`) and rendered HTML (`html`) when `fetchThread: false` or `fetchThread: true` + `fetchOnlyAuthorReplies: true`
Export `renderPostAsHtml` and `getPostLink`
Batch process `GET /xrpc/app.bsky.feed.getPosts` to avoid exceeding 25 URIs per request
Update docs
