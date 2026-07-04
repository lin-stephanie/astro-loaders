---
"astro-loader-github-prs": patch
---

Expand the Astro peer range from `>=4.14.0 <7.0.0` to `>=4.14.0 <8.0.0` so Astro 7 projects can install the loader without peer dependency conflicts.

Normalize PR search construction by prefixing `type:pr` only when neither `type:pr` nor `is:pr` is present, and preserve existing positive or negative `created:` qualifiers when applying `monthsBack`.

Relax PR identifier validation from fixed 16-character Base64 node IDs to GitHub global node IDs such as `PR_...`, reuse shared URL regexes, and document live entry identifiers as `string | object`.

Update GraphQL Code Generator (`codegen.config.ts`) to emit typed string documents with pure annotations, operation-only types, pre-resolved result shapes, type-only imports, string-union enums, and a scoped post-generation formatter for `src/graphql/gen/operations.ts`.

Replace `graphql#print` calls with `String(...)` because generated documents are now typed string documents instead of GraphQL AST documents.

Migrate the package build from inline `tsup` scripts and `postbuild` `.graphql` copying to `tsdown --watch` / `tsdown` with `tsdown.config.ts`, keep `astro:env/server` external through `deps.neverBundle`, disable declaration/source maps, and mark the package as side-effect free for better tree-shaking.

Add `__typename` to the PR GraphQL fragment and use it in `getValidPrNode()` so lookups only map real `PullRequest` nodes before stripping the typename from returned data.

Return an `INVALID_IDENTIFIER` loader error when live PR entry lookups by node ID, URL or `{ owner, repo, number }` do not resolve to a GitHub PR, instead of returning an empty result.

Align README with the updated runtime behavior.
