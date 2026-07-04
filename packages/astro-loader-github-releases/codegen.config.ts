import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  // Load GitHub GraphQL schema for validation and type generation.
  schema: '../../schema/schema.docs.graphql',

  // Load local GraphQL operations and fragments.
  documents: ['./src/graphql/**/*.graphql'],

  generates: {
    './src/graphql/gen/operations.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
      config: {
        // Emit typed query strings instead of GraphQL AST objects (typed-document-node).
        documentMode: 'string',

        // Mark generated document constructors as pure for tree-shaking (typed-document-node).
        pureMagicComment: true,

        // Inline operation result shapes instead of referencing schema types (typescript-operations).
        preResolveTypes: true,

        // Generate only operation-related base types, not the full schema types (typescript).
        onlyOperationTypes: true,

        // Emit GraphQL enums as TypeScript string unions, not runtime enums (typescript).
        enumsAsTypes: true,

        // Do not add __typename unless explicitly selected in a query (shared).
        skipTypename: true,

        // Use type-only imports for generated type dependencies (shared).
        useTypeImports: true,

        // Map GitHub custom scalars to TypeScript primitives (shared).
        scalars: {
          DateTime: 'string',
          URI: 'string',
          HTML: 'string',
        },
      },
    },
  },
  hooks: {
    // Format only the generated file after writing.
    afterAllFileWrite: ['biome format --write src/graphql/gen/operations.ts'],
  },
}

export default config
