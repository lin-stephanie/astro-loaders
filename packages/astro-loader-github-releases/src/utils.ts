import type { GetReleaseByIdQuery } from './graphql/gen/operations.js'

/**
 * Get the date since which to fetch the releases with `monthsBack`.
 */
export function getSinceDate(
  monthsBack: number | undefined,
  sinceDate: Date | undefined
) {
  if (monthsBack) {
    const startDate = new Date()
    startDate.setUTCMonth(startDate.getMonth() - monthsBack + 1)
    startDate.setUTCDate(1)

    return sinceDate === undefined
      ? +startDate
      : Math.max(+startDate, +sinceDate)
  }

  return sinceDate === undefined ? null : +sinceDate
}

/**
 * Get the valid release node.
 */
export function getValidReleaseNode(node: GetReleaseByIdQuery['node']) {
  if (node && typeof node === 'object' && 'id' in node) {
    const versionNum = node.tagName.match(
      /.*(\d+\.\d+\.\d+(?:-[\w.]+)?)(?:\s|$)/
    )
    return {
      id: node.id,
      url: node.url,
      name: node.name ? node.name : undefined,
      tagName: node.tagName,
      versionNum: versionNum ? versionNum[1] : undefined,
      description: node.description ? node.description : undefined,
      descriptionHTML: node.descriptionHTML ? node.descriptionHTML : undefined,
      isDraft: node.isDraft,
      isLatest: node.isLatest,
      isPrerelease: node.isPrerelease,
      repoOwner: node.repository.nameWithOwner.split('/')[0],
      repoName: node.repository.name,
      repoNameWithOwner: node.repository.nameWithOwner,
      repoUrl: node.repository.url,
      repoStargazerCount: node.repository.stargazerCount,
      repoIsInOrganization: node.repository.isInOrganization,
      publishedAt: node.publishedAt ? node.publishedAt : undefined,
      createdAt: node.createdAt,
    }
  }

  return null
}
