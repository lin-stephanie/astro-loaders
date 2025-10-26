import type { InsMedia } from './schema.js'

interface FetchMediasResponse {
  data: InsMedia[]
  paging: {
    cursor: {
      after: string
      before: string
    }
    next?: string
    previous?: string
  }
}

type FullResult = InsMedia[]

interface IncrementalResult {
  items: InsMedia[]
  newLastFetched?: string
}

interface FetchMediasParamsBase {
  baseUrl: string
  version: string
  token: string
  fields: string
  mediaTypes: ('IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM')[]
  since?: number
  until?: number
  limit?: number
  isLive?: boolean
  debug?: boolean
}

/**
 * Convert a Date object to a Unix timestamp.
 *
 * @param date - The Date object to convert.
 * @returns The Unix timestamp in seconds.
 */
export function toUnixTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000)
}

/**
 * Fetch JSON data from the Instagram API.
 *
 * @param url - The URL to fetch data from.
 * @returns The JSON data.
 */
export async function requestInsApi<T = any>(
  url: string,
  isLive = false
): Promise<T> {
  const res = await fetch(url)
  // console.log('res', res)

  if (!res.ok) {
    let errorData: any = null

    // Try to parse JSON first, fallback to plain text if failed
    try {
      errorData = await res.json()
    } catch {
      errorData = { raw: await res.text().catch(() => '') }
    }

    const err = errorData?.error ?? {}

    // Extract error fields to avoid undefined errors
    const status = res.status
    const type = err.type ?? 'UnknownErrorType'
    const code = err.code ?? 'UnknownCode'
    const subcode = err.error_subcode ?? 'N/A'
    const message = err.message ?? 'No error message provided'
    const userMsg = err.error_user_msg ?? ''

    // Organize error information
    let errorText: string

    if (err) {
      errorText = [
        `Instagram API request failed (HTTP ${status})`,
        `Type: ${type}`,
        `Code: ${code} / Subcode: ${subcode}`,
        `Message: ${userMsg ? userMsg : message}`,
        // 'More info: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/error-codes',
      ]
        .filter(Boolean)
        .join('\n')
    } else {
      errorText = [
        `Instagram API request failed (HTTP ${status})`,
        `Raw response: ${errorData.raw || 'No response body'}`,
      ].join('\n')
    }

    if (isLive) {
      throw Object.assign(new Error(errorText), {
        code: 'INS_API_QUERY_ERROR',
      })
    }

    throw new Error(errorText)
  }

  // Return JSON normally, append raw response in debug mode
  const data = (await res.json()) as T
  // console.log('data', data)

  return data
}

/**
 * Fetch Instagram medias.
 *
 * @param params - The parameters for the fetch operation.
 * @returns The fetched medias.
 */
export async function fetchMedias(
  params: FetchMediasParamsBase & { isIncremental: true }
): Promise<IncrementalResult>
export async function fetchMedias(
  params: FetchMediasParamsBase & { isIncremental: false }
): Promise<FullResult>
export async function fetchMedias(
  params: FetchMediasParamsBase & { isIncremental: boolean }
): Promise<IncrementalResult | FullResult> {
  const {
    baseUrl,
    version,
    token,
    fields,
    mediaTypes,
    limit,
    since,
    until,
    isIncremental,
    isLive = false,
    debug = false,
  } = params

  const fetchIdUrl = new URL(`${baseUrl}/${version}/me`)
  fetchIdUrl.searchParams.set('access_token', token)
  const { id: appScopedUserId } = await requestInsApi<{ id: string }>(
    fetchIdUrl.toString(),
    isLive
  )

  let fetchMediasUrl = new URL(`${baseUrl}/${version}/${appScopedUserId}/media`)
  fetchMediasUrl.searchParams.set('fields', fields)
  fetchMediasUrl.searchParams.set('access_token', token)
  if (since) fetchMediasUrl.searchParams.set('since', String(since))
  if (until) fetchMediasUrl.searchParams.set('until', String(until))

  const collected: InsMedia[] = []
  let count = 0
  let newLastFetched: string | undefined
  fetching: do {
    const { data, paging } = await requestInsApi<FetchMediasResponse>(
      fetchMediasUrl.toString(),
      isLive
    )

    for (const item of data) {
      const ts = item.timestamp
        ? toUnixTimestamp(new Date(item.timestamp))
        : undefined
      const shouldStopBySince = isIncremental && ts && since && ts <= since
      const isLimitReached = limit && count >= limit

      // Stop fetching when the first item is older than the since date or the limit is reached
      if (shouldStopBySince || isLimitReached) break fetching

      // Skip media types that are not in the list
      if (item.media_type && !mediaTypes.includes(item.media_type)) continue

      // Incremental fetching, the first accepted item's timestamp is the new last fetched timestamp
      if (isIncremental && newLastFetched && ts) newLastFetched = String(ts)

      collected.push(item)
      count++
    }

    if (!paging.next) break
    fetchMediasUrl = new URL(paging.next)
  } while (!limit || count < limit)

  if (debug) {
    console.debug(`[debug] fetched ${collected.length} items`)
  }

  return isIncremental ? { items: collected, newLastFetched } : collected
}
