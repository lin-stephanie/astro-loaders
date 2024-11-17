import { AstroError } from 'astro/errors'
import { Octokit } from 'octokit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchReleasesByUserCommit } from '../src/releases.js'
import releasesData from './data/userCommit/releasesData.js'
import resData from './data/userCommit/resData.json'

import type { Mock } from 'vitest'

vi.mock('octokit', () => {
  const OctokitMock = vi.fn(() => ({
    request: vi.fn(),
  }))

  return { Octokit: OctokitMock }
})

describe('fetchReleasesByUserCommit', () => {
  let config: any
  let meta: any
  let octokitMockInstance: any

  beforeEach(() => {
    config = {
      username: 'lin-stephanie',
      keyword: 'release',
      versionRegex: 'v?(\\d+\\.\\d+\\.\\d+(?:-[\\w.]+)?)(?:\\s|$)',
      branches: [
        'refs/heads/main',
        'refs/heads/master',
        'refs/heads/latest',
        'refs/heads/stable',
        'refs/heads/release',
        'refs/heads/dev',
      ],
      prependV: false,
    }

    meta = {
      get: vi.fn(),
      set: vi.fn(),
    }

    const OctokitMock = Octokit as unknown as Mock
    octokitMockInstance = {
      request: vi.fn(),
    }
    OctokitMock.mockImplementation(() => octokitMockInstance)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch new releases successfully', async () => {
    meta.get.mockReturnValueOnce(null)
    meta.get.mockReturnValueOnce(null)

    const apiResponse = {
      status: 200,
      data: Array(1)
        .fill([...resData])
        .flat(),
    }
    octokitMockInstance.request.mockResolvedValue(apiResponse)

    const result = await fetchReleasesByUserCommit(config, meta)
    // console.log('result', result)

    expect(result.status).toBe(200)
    expect(result.releases).toHaveLength(2)
    expect(result.releases[0]).toMatchObject(releasesData[0])
    expect(meta.set).toHaveBeenCalledWith(
      'lastPushTime',
      '2024-11-11T17:16:41Z'
    )
  })

  it('should return 304 when no new data', async () => {
    meta.get.mockReturnValueOnce('some-etag')

    const apiResponse = {
      status: 304,
      data: [],
    }
    octokitMockInstance.request.mockResolvedValue(apiResponse)

    const result = await fetchReleasesByUserCommit(config, meta)
    // console.log('result', result)

    expect(result.status).toBe(304)
    expect(result.releases).toEqual([])
  })

  it('should handle custom config', async () => {
    // config.keyword = 'Release'
    config.prependV = true

    meta.get.mockReturnValueOnce(null)
    meta.get.mockReturnValueOnce(null)

    const apiResponse = {
      status: 200,
      data: Array(1)
        .fill([...resData])
        .flat(),
    }
    octokitMockInstance.request.mockResolvedValue(apiResponse)

    const result = await fetchReleasesByUserCommit(config, meta)
    // console.log('result', result)

    expect(result.status).toBe(200)
    expect(result.releases).toHaveLength(2)
    expect(result.releases[0]).toMatchObject(releasesData[1])
    expect(meta.set).toHaveBeenCalledWith(
      'lastPushTime',
      '2024-11-11T17:16:41Z'
    )
  })

  it('should handle API errors gracefully', async () => {
    const error = new Error('API Error')
    octokitMockInstance.request.mockRejectedValue(error)

    try {
      await fetchReleasesByUserCommit(config, meta)
    } catch (caughtError) {
      expect(caughtError).toBeInstanceOf(AstroError)
      expect((caughtError as Error).message).toBe(
        `Failed to load release data in 'userCommit' mode: ${error.message}`
      )
    }
  })

  it('should stop fetching when lastPushTime is reached', async () => {
    meta.get.mockReturnValueOnce(null)
    meta.get.mockReturnValueOnce('2024-11-09T15:16:47Z')

    const apiResponse = {
      status: 200,
      data: Array(1)
        .fill([...resData])
        .flat(),
    }
    octokitMockInstance.request.mockResolvedValue(apiResponse)

    const result = await fetchReleasesByUserCommit(config, meta)
    // console.log('result', result)

    expect(result.status).toBe(200)
    expect(result.releases).toHaveLength(1)
    expect(result.releases[0]).toMatchObject(releasesData[0])
    expect(meta.set).toHaveBeenCalledWith(
      'lastPushTime',
      '2024-11-11T17:16:41Z'
    )
  })
})
