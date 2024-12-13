/**
 * Get the date since which to fetch the releases with `monthsBack`.
 */
export function getSinceDate(
  monthsBack: number | undefined,
  sinceDate: Date | undefined
) {
  if (monthsBack) {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - monthsBack + 1)
    startDate.setDate(1)

    return sinceDate === undefined
      ? +startDate
      : Math.max(+startDate, +sinceDate)
  }

  return sinceDate === undefined ? null : +sinceDate
}
