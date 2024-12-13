/**
 * Get the search query with `monthsBack`.
 */
export function getQueryWithMonthsBack(
  search: string,
  monthsBack: number | undefined
) {
  if (!search.includes('created') && monthsBack) {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - monthsBack + 1)
    startDate.setDate(1)

    return `${search} created:>=${startDate.toISOString().split('T')[0]}`
  }
  return search
}
