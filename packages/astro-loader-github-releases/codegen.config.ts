import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: '../../schema/schema.docs.graphql',
  documents: ['./src/graphql/**/*.graphql'],
  generates: {
    './src/graphql/gen/operations.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
      config: {
        preResolveTypes: true,
        onlyOperationTypes: true,
        skipTypename: true,
        omitDeprecatedFields: true,
        enumsAsTypes: true,
        scalars: {
          DateTime: 'string',
          URI: 'string',
          HTML: 'string',
        },
      },
    },
  },
  hooks: {
    afterAllFileWrite: ['biome format --write'],
  },
}

export default config
