---
"astro-loader-tweets": patch
---

Implement the Astro 6 migration change where [schema types are inferred instead of generated](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-schema-types-are-inferred-instead-of-generated-content-loader-api), while preserving accurate loader-based entry data inference and avoiding Zod 4 internal type leakage in published declarations.
