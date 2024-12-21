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
