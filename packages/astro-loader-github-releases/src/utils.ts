export function getSinceDate(
  monthsBack: number | undefined,
  sinceDate: Date | undefined
) {
  if (monthsBack) {
    const referenceDate = new Date()
    const startDate = new Date(referenceDate)
    startDate.setMonth(startDate.getMonth() - monthsBack + 1)
    startDate.setDate(1)

    return sinceDate === undefined
      ? +startDate
      : Math.max(+startDate, +sinceDate)
  }

  return sinceDate === undefined ? null : +sinceDate
}
