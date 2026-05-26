---
"astro-loader-bluesky-posts": patch
---

Implement the Astro 6 migration change where [schema types are inferred instead of generated](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-schema-types-are-inferred-instead-of-generated-content-loader-api), while preserving accurate loader-based entry data inference and avoiding Zod 4 internal type leakage in published declarations.

Astro v6.0 upgrades to Zod 4. Based on the [Zod 4 changelog](https://zod.dev/v4/changelog) and the need to keep compatibility with older Astro versions, update schemas by:

- Replace `passthrough()` usage with `catchall(z.unknown())` to keep allowing extra fields without requiring Zod 4-only `z.looseObject()`;
- Replace `z.any()` label entries with `z.unknown()` to avoid leaking `any` into inferred entry data;
- Replace object intersection with `extend()` for the extended post schema;
- Intentionally keep deprecated string format methods such as `z.string().url()` and `z.string().datetime()` for compatibility with older Astro/Zod versions.

Add config-specific loader overloads so `fetchThread` and `fetchOnlyAuthorReplies` infer the matching entry data shape.

Use the public `@atproto/api` `AppBskyFeedDefs` exports and type guards instead of internal `dist/client/types` imports.

Relax the thread schema for raw nested replies and optional Bluesky author fields that the API can omit.

Cache by the full parsed loader config instead of only `uris` so rendering and thread option changes trigger a reload.

Preserve stack traces in loader error logs so failures remain debuggable.
