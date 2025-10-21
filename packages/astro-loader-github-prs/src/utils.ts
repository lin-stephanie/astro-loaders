import type { GithubPr } from './schema.js'
import type { GetPrByIdQuery } from './graphql/gen/operations.js'

/**
 * Get the search query with `monthsBack`.
 */
export function getQueryWithMonthsBack(
  search: string,
  monthsBack: number | undefined
) {
  if (!search.includes('created') && monthsBack) {
    const startDate = new Date()
    startDate.setUTCMonth(startDate.getMonth() - monthsBack + 1)
    startDate.setUTCDate(1)

    return `${search} created:>=${startDate.toISOString().split('T')[0]}`
  }
  return search
}

/**
 * Get the valid pull request node.
 */
export function getValidPrNode(node: GetPrByIdQuery['node']): GithubPr | null {
  if (node && typeof node === 'object' && 'id' in node) {
    return node as GithubPr
  }
  return null
}
