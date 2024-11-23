import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: '../../schema/schema.docs.graphql',
  documents: ['./src/graphql/*.graphql'],
  generates: {
    './src/graphql/types.ts': {
      plugins: ['typescript', 'typescript-operations'],
      config: {
        preResolveTypes: true,
        onlyOperationTypes: true,
        skipTypename: true,
        omitDeprecatedFields: true,
      },
    },
  },
}

export default config
