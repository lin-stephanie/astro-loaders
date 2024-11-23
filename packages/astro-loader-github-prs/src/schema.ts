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
  author: z.object({
    login: z.string(),
    url: z.string(),
    avatarUrl: z.string(),
  }),
  repository: z.object({
    name: z.string(),
    nameWithOwner: z.string(),
    url: z.string(),
    stargazerCount: z.number(),
    isInOrganization: z.boolean(),
    owner: z.object({
      login: z.string(),
      url: z.string(),
      avatarUrl: z.string(),
    }),
  }),
  createdAt: z.string(),
  mergedAt: z.string(),
})

export type GithubPr = z.infer<typeof GithubPrSchema>
