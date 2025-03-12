import fs from 'node:fs/promises'
import path from 'node:path'

import { z } from 'astro/zod'

import type { TweetsLoaderConfigSchema } from './config.js'
import type {
  ResIncludes,
  Tweet,
  TweetV2ExtendedSchema,
  TweetV2Schema,
} from './schema.js'

/**
 * Extract trailing URLs from the end of the text.
 */
function getTrailingUrls(text: string) {
  if (text.trimEnd().length === 0) return []

  // trailing URL looks like: https://t.co/xxxxx possibly preceded by spaces
  const regex = /(\s+https?:\/\/t\.co\/[A-Za-z0-9]+)+$/
  const match = text.match(regex)
  if (!match) return []
  const matchedStr = match[0]
  const trailingTokens = matchedStr.trim().split(/\s+/)

  return trailingTokens
}

/**
 * Remove a URL from the end of the text, trimming any trailing spaces.
 */
function cleanupUrlFromText(text: string, urlToRemove: string) {
  const idx = text.lastIndexOf(urlToRemove)
  if (idx === -1) return text
  return text.slice(0, idx).trimEnd()
}

/**
 * Escapes HTML special characters to prevent XSS attacks
 * when dynamically generating HTML content.
 */
function escapeHTML(str?: string) {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }

  return str?.replace(/[&<>"']/g, (match) => escapeMap[match] || match) ?? ''
}

/**
 * Extracts the domain and path from a given URL.
 */
function getDomainAndPath(url: string): string {
  const parsedUrl = new URL(url)
  return `${parsedUrl.hostname}${parsedUrl.pathname}`
}

/**
 * Convert a Tweet's text field to HTML and Markdown formats.
 */
export function processTweetText(
  tweet: z.infer<typeof TweetV2Schema>,
  options: Omit<
    z.infer<typeof TweetsLoaderConfigSchema>,
    'ids' | 'storage' | 'storePath' | 'authToken'
  >
): z.infer<typeof TweetV2ExtendedSchema> {
  const { removeTrailingUrls, linkTextType, newlineHandling } = options

  // const originalText = tweet.text
  const entities = tweet.entities || {}
  const urls = entities.urls || []
  const hashtags = entities.hashtags || []
  const cashtags = entities.cashtags || []
  const mentions = entities.mentions || []

  let text = tweet.text
  let viewType: 'none' | 'link' | 'media' = 'none'
  let urlForLinkView: string | undefined = undefined

  // determine embed view type & handle trailing URLs
  const trailingUrls = getTrailingUrls(text)
  if (trailingUrls.length > 0) {
    const lastUrl = trailingUrls[trailingUrls.length - 1]
    const foundUrl = urls.find((u) => u.url === lastUrl)

    viewType =
      (foundUrl?.media_key && foundUrl.media_key.length > 0) ||
      (tweet.attachments?.media_keys && tweet.attachments.media_keys.length > 0)
        ? 'media'
        : 'link'
    if (viewType === 'link') urlForLinkView = foundUrl?.expanded_url

    if (removeTrailingUrls) {
      // remove the last trailing URL
      text = cleanupUrlFromText(text, lastUrl)

      // handle remaining trailing URLs
      if (
        foundUrl &&
        /https:\/\/twitter\.com\/\w+\/status\/\d+/.test(foundUrl.expanded_url)
      ) {
        for (let i = trailingUrls.length - 2; i >= 0; i--) {
          const u = trailingUrls[i]
          const entity = urls.find((e) => e.url === u)
          if (entity?.media_key) {
            text = cleanupUrlFromText(text, u)
          }
        }
      }
    }
  }

  // transform hashtags, cashtags, mentions, and remaining URLs into links
  let textHtml = text
  let textMarkdown = text

  // replace hashtags: #tag
  if (hashtags.length > 0) {
    textHtml = textHtml.replace(
      /(^|\W)#([\p{L}\p{M}\w]+)/gu,
      (match, prefix, tag) => {
        const entity = hashtags.find((h) => h.tag === tag)
        if (entity) {
          const escapedTag = escapeHTML(tag)
          const url = `https://x.com/hashtag/${encodeURIComponent(escapedTag)}`
          const htmlLink = `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" aria-lable="Hashtag #${escapedTag}">#${escapedTag}</a>`
          const mdLink = `${prefix}[#${escapedTag}](${url})`
          textMarkdown = textMarkdown.replace(match, mdLink)
          return htmlLink
        }
        return match
      }
    )
  }

  // replace cashtags: $tag
  if (cashtags.length > 0) {
    textHtml = textHtml.replace(
      /(^|\W)\$([A-Za-z0-9]+)/g,
      (match, prefix, tag) => {
        const entity = cashtags.find((c) => c.tag === tag)
        if (entity) {
          const escapedTag = escapeHTML(tag)
          const url = `https://x.com/search?q=%24${encodeURIComponent(escapedTag)}`
          const htmlLink = `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" aria-lable="Cashtag $${escapedTag}">$${escapedTag}</a>`
          const mdLink = `${prefix}[$${escapedTag}](${url})`
          textMarkdown = textMarkdown.replace(match, mdLink)
          return htmlLink
        }
        return match
      }
    )
  }

  // replace mentions: @username
  if (mentions.length > 0) {
    textHtml = textHtml.replace(/(^|\W)@(\w+)/g, (match, prefix, username) => {
      const entity = mentions.find((m) => m.username === username)
      if (entity) {
        const escapedUsername = escapeHTML(username)
        const url = `https://x.com/${encodeURIComponent(entity.username)}`
        const htmlLink = `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" aria-lable="Mention @${escapedUsername}">@${escapedUsername}</a>`
        const mdLink = `${prefix}[@${escapedUsername}](${url})`
        textMarkdown = textMarkdown.replace(match, mdLink)
        return htmlLink
      }
      return match
    })
  }

  // replace URLs
  let lastMatchedUrlEntity: (typeof urls)[number] | undefined
  if (urls.length > 0) {
    textHtml = textHtml.replace(/https?:\/\/t\.co\/[A-Za-z0-9]+/g, (match) => {
      const entity = urls.find((e) => e.url === match)
      if (entity) {
        lastMatchedUrlEntity = entity
        const escapedUrl = escapeHTML(entity.expanded_url)
        const escapedText =
          linkTextType === 'domain-path'
            ? escapeHTML(getDomainAndPath(entity.expanded_url))
            : escapeHTML(entity.display_url)
        const htmlLink = `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" aria-lable="Link to ${escapedText}">${escapedText}</a>`
        const mdLink = `[${escapedText}](${escapedUrl})`
        textMarkdown = textMarkdown.replace(match, mdLink)
        return htmlLink
      }
      return match
    })
  }

  // add judgment for `viewType`
  if (viewType === 'none' && lastMatchedUrlEntity) {
    viewType = lastMatchedUrlEntity.media_key ? 'media' : 'link'
    if (viewType === 'link') urlForLinkView = lastMatchedUrlEntity.expanded_url
  }

  // handle newline
  if (newlineHandling !== 'none') {
    if (newlineHandling === 'break') {
      textHtml = textHtml.replace(/\n+/g, '<br/ >\n')
    } else if (newlineHandling === 'paragraph') {
      textHtml = textHtml
        .split('\n')
        .map((line) => {
          const l = line.trim()
          if (l.length > 0) return `<p>${l}</p>`
        })
        .join('')
    }
  }

  return {
    ...tweet,
    text_html: textHtml,
    text_markdown: textMarkdown,
    view_type: viewType,
    url_for_link_view: urlForLinkView,
  }
}

/**
 * Processes tweets by mapping the response data (`resData`) and includes (`resIncludes`)
 * into an array of tweet entries conforming to the expected entry schema.
 */
export function processTweets(
  processedTweets: z.infer<typeof TweetV2ExtendedSchema>[],
  includes: ResIncludes | undefined
): Tweet[] {
  if (!includes) {
    return processedTweets.map((tweet) => ({
      id: tweet.id,
      tweet: tweet,
      user: null,
      place: null,
      media: null,
      poll: null,
    }))
  }

  return processedTweets.map((tweet) => {
    const processedTweet: Tweet = {
      id: tweet.id,
      tweet: tweet,
      user: null,
      place: null,
      media: null,
      poll: null,
    }

    if (tweet.author_id && includes.users) {
      processedTweet.user =
        includes.users.find((user) => user.id === tweet.author_id) || null
    }

    if (tweet.geo?.place_id && includes.places) {
      processedTweet.place =
        includes.places.find((place) => place.id === tweet.geo?.place_id) ||
        null
    }

    if (tweet.attachments?.media_keys && includes.media) {
      const mediaArray = includes.media.filter((media) =>
        tweet.attachments?.media_keys?.includes(media.media_key)
      )
      processedTweet.media = mediaArray.length > 0 ? mediaArray : null
    } else {
      processedTweet.media = null
    }

    if (tweet.attachments?.poll_ids && includes.polls) {
      const pollArray = includes.polls.filter((poll) =>
        tweet.attachments?.poll_ids?.includes(poll.id)
      )
      processedTweet.poll = pollArray.length > 0 ? pollArray : null
    } else {
      processedTweet.poll = null
    }

    return processedTweet
  })
}

const SavedTweets = z.array(
  z
    .object({
      id: z.string(),
    })
    .passthrough()
)

/**
 * Saves or updates tweets to a specified JSON file.
 *
 * If the file does not exist, it writes a new file.
 * If the file exists, it performs incremental updates by
 * replacing existing tweets with the same ID or appending new ones.
 */
export async function saveOrUpdateTweets(
  tweets: Tweet[],
  storePath: string
): Promise<void> {
  const resolvedPath = path.isAbsolute(storePath)
    ? storePath
    : path.resolve(process.cwd(), storePath)

  let savedTweets: z.infer<typeof SavedTweets> = []
  let fileExists = true

  // check if file exists
  try {
    await fs.access(resolvedPath)
  } catch {
    fileExists = false
  }

  if (fileExists) {
    // update existing tweets
    const fileContent = await fs.readFile(resolvedPath, 'utf-8')
    const parsedContent = JSON.parse(fileContent)
    const parsedData = SavedTweets.safeParse(parsedContent)
    if (!parsedData.success)
      throw Error(
        'Invalid JSON format. Ensure the file contains an array of objects, each with a valid `id` field as a string.'
      )
    savedTweets = parsedData.data

    // create a map of existing tweets for efficient lookup
    const savedTweetsMap = new Map(savedTweets.map((t) => [t.id, t]))
    for (const newTweet of savedTweets) {
      savedTweetsMap.set(newTweet.id, newTweet)
    }
    savedTweets = Array.from(savedTweetsMap.values())
  } else {
    savedTweets = tweets
  }

  // write updated tweets back to file
  await fs.mkdir(path.dirname(resolvedPath), { recursive: true })
  await fs.writeFile(resolvedPath, JSON.stringify(savedTweets, null, 2), 'utf8')
}
