import { RichText } from '@atproto/api'
import { isThreadViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs.js'

import type { AtpAgent, RichTextProps, $Typed } from '@atproto/api'
import type { z } from 'astro/zod'
import type {
  PostView,
  ThreadViewPost,
} from '@atproto/api/dist/client/types/app/bsky/feed/defs.js'
import type { BlueskyPostsLoaderConfigSchema } from './config.js'

export async function getAtUri(uri: string, agent: AtpAgent) {
  try {
    const parts = uri.startsWith('at:')
      ? uri.split('/')
      : new URL(uri).pathname.split('/')
    let id = parts[2]
    const postId = parts[4]

    if (!id.startsWith('did:')) {
      const handleResolution = await agent.resolveHandle({ handle: id })
      id = handleResolution.data.did
    }

    return `at://${id}/app.bsky.feed.post/${postId}`
  } catch {
    throw new Error(`Invalid post URL: ${uri}.`)
  }
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
function getDomainAndPath(url?: string): string {
  if (url) {
    const parsedUrl = new URL(url)
    return `${parsedUrl.hostname}${parsedUrl.pathname}`
  }
  return ''
}

/**
 * Renders a post as HTML based on the given configuration options.
 */
export function renderPostAsHtml(
  richText: RichTextProps,
  options: {
    linkTextType: z.output<
      typeof BlueskyPostsLoaderConfigSchema
    >['linkTextType']
    newlineHandling: z.output<
      typeof BlueskyPostsLoaderConfigSchema
    >['newlineHandling']
  }
) {
  const { linkTextType, newlineHandling } = options
  const rt = new RichText(richText)

  let html = ''

  // handle link
  for (const segment of rt.segments()) {
    if (segment.isLink()) {
      html += `<a href="${escapeHTML(segment.link?.uri)}">${escapeHTML(linkTextType === 'post-text' ? segment.text : getDomainAndPath(segment.link?.uri))}</a>`
    } else if (segment.isMention()) {
      html += `<a href="https://bsky.app/profile/${escapeHTML(segment.mention?.did)}">${escapeHTML(segment.text)}</a>`
    } else if (segment.isTag()) {
      html += `<a href="https://bsky.app/hastag/${escapeHTML(segment.tag?.tag)}">#${escapeHTML(segment.tag?.tag)}</a>`
    } else {
      html += escapeHTML(segment.text)
    }
  }

  // handle newline
  if (newlineHandling !== 'none') {
    if (newlineHandling === 'break') {
      html = html.replace(/\n+/g, '<br/ >\n')
    } else if (newlineHandling === 'paragraph') {
      html = html
        .split('\n')
        .map((line) => {
          const l = line.trim()
          if (l.length > 0) return `<p>${l}</p>`
        })
        .join('')
    }
  }

  return html
}

/**
 * Converts an AT-URI to a post URI.
 */
export function atUriToPostUri(atUri: string) {
  const [, , did, , postId] = atUri.split('/')

  return `https://bsky.app/profile/${did}/post/${postId}`
}

/**
 * Recursively filters replies to return only those authored by a specified author.
 * Optionally flattens the nested structure into a single-level array of posts.
 */
export function getOnlyAuthorReplies(
  replies: ThreadViewPost['replies'],
  depth: number,
  authorDid: string
) {
  if (!replies || replies.length === 0 || depth <= 0) return []

  const filtered = replies.filter(
    (item): item is $Typed<ThreadViewPost> =>
      isThreadViewPost(item) && item.post.author.did === authorDid
  )

  return filtered.reduce<PostView[]>((acc, item) => {
    acc.push(item.post)

    const childPosts = getOnlyAuthorReplies(item.replies, depth - 1, authorDid)

    acc.push(...childPosts)

    return acc
  }, [])
}
