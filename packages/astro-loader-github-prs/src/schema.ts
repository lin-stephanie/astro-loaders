import { z } from 'astro/zod'

export const GithubPrSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  titleHTML: z.string(),
  number: z.number(),
  state: z.enum(['CLOSED', 'MERGED', 'OPEN']),
  isDraft: z.boolean(),
  body: z.string(),
  bodyHTML: z.string(),
  bodyText: z.string(),
  author: z
    .union([
      z.object({
        login: z.string(),
        name: z.string().optional(),
        url: z.string(),
        avatarUrl: z.string(),
      }),
      z.null(),
    ])
    .optional(),
  repository: z.object({
    name: z.string(),
    nameWithOwner: z.string(),
    url: z.string(),
    stargazerCount: z.number(),
    isInOrganization: z.boolean(),
    owner: z.object({
      login: z.string(),
      name: z.string().optional(),
      url: z.string(),
      avatarUrl: z.string(),
    }),
  }),
  createdAt: z.string(),
  mergedAt: z.union([z.string(), z.null()]).optional(),
})

export type GithubPr = z.infer<typeof GithubPrSchema>
