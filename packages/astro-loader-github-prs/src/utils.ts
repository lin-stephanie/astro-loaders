import type { GithubPr } from './schema.js'
import type {
  GetPrByIdQuery,
  PullRequestCoreFragment,
} from './graphql/gen/operations.js'

const PR_SEARCH_QUALIFIER_REGEX = /(^|[\s(])(type|is):pr($|[\s)])/i
const CREATED_SEARCH_QUALIFIER_REGEX = /(^|[\s(])-?created:/i

/**
 * Get the search query with `monthsBack`.
 */
export function getQueryWithMonthsBack(
  search: string,
  monthsBack: number | undefined
) {
  const query = PR_SEARCH_QUALIFIER_REGEX.test(search)
    ? search
    : `type:pr ${search}`

  if (!CREATED_SEARCH_QUALIFIER_REGEX.test(query) && monthsBack) {
    const startDate = new Date()
    startDate.setUTCMonth(startDate.getMonth() - monthsBack + 1)
    startDate.setUTCDate(1)

    return `${query} created:>=${startDate.toISOString().split('T')[0]}`
  }
  return query
}

/**
 * Check if the node is a PullRequestCoreFragment type node.
 */
function isPullRequestNode(
  node: GetPrByIdQuery['node']
): node is PullRequestCoreFragment {
  return (
    node !== null &&
    node !== undefined &&
    typeof node === 'object' &&
    '__typename' in node &&
    node.__typename === 'PullRequest'
  )
}

/**
 * Get the valid pull request node.
 */
export function getValidPrNode(node: GetPrByIdQuery['node']): GithubPr | null {
  if (!isPullRequestNode(node)) return null

  const { __typename: _typename, ...pr } = node
  return pr
}
