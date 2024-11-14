import { z } from 'astro/zod'

/* Response Schema - List Public Events for a User */
// https://docs.github.com/en/rest/activity/events?apiVersion=2022-11-28#list-public-events-for-a-user
// (generated by https://app.quicktype.io/)

// How the author is associated with the repository.

export const AuthorAssociationSchema = z.enum([
  'COLLABORATOR',
  'CONTRIBUTOR',
  'FIRST_TIME_CONTRIBUTOR',
  'FIRST_TIMER',
  'MANNEQUIN',
  'MEMBER',
  'NONE',
  'OWNER',
])
export type AuthorAssociation = z.infer<typeof AuthorAssociationSchema>

// The state of the milestone.

export const StateSchema = z.enum(['closed', 'open'])
export type State = z.infer<typeof StateSchema>

// The default value for a merge commit message.
//
// - `PR_TITLE` - default to the pull request's title.
// - `PR_BODY` - default to the pull request's body.
// - `BLANK` - default to a blank commit message.

export const MergeCommitMessageSchema = z.enum(['BLANK', 'PR_BODY', 'PR_TITLE'])
export type MergeCommitMessage = z.infer<typeof MergeCommitMessageSchema>

// The default value for a merge commit title.
//
// - `PR_TITLE` - default to the pull request's title.
// - `MERGE_MESSAGE` - default to the classic title for a merge message (e.g., Merge pull
// request #123 from branch-name).

export const MergeCommitTitleSchema = z.enum(['MERGE_MESSAGE', 'PR_TITLE'])
export type MergeCommitTitle = z.infer<typeof MergeCommitTitleSchema>

// The default value for a squash merge commit message:
//
// - `PR_BODY` - default to the pull request's body.
// - `COMMIT_MESSAGES` - default to the branch's commit messages.
// - `BLANK` - default to a blank commit message.

export const SquashMergeCommitMessageSchema = z.enum([
  'BLANK',
  'COMMIT_MESSAGES',
  'PR_BODY',
])
export type SquashMergeCommitMessage = z.infer<
  typeof SquashMergeCommitMessageSchema
>

// The default value for a squash merge commit title:
//
// - `PR_TITLE` - default to the pull request's title.
// - `COMMIT_OR_PR_TITLE` - default to the commit's title (if only one commit) or the pull
// request's title (when more than one commit).

export const SquashMergeCommitTitleSchema = z.enum([
  'COMMIT_OR_PR_TITLE',
  'PR_TITLE',
])
export type SquashMergeCommitTitle = z.infer<
  typeof SquashMergeCommitTitleSchema
>

export const StateReasonSchema = z.enum([
  'completed',
  'not_planned',
  'reopened',
])
export type StateReason = z.infer<typeof StateReasonSchema>

export const ActorClassSchema = z.object({
  avatar_url: z.string(),
  display_login: z.string().optional(),
  gravatar_id: z.union([z.null(), z.string()]),
  id: z.number(),
  login: z.string(),
  url: z.string(),
})
export type ActorClass = z.infer<typeof ActorClassSchema>

export const OrgClassSchema = z.object({
  avatar_url: z.string(),
  display_login: z.string().optional(),
  gravatar_id: z.union([z.null(), z.string()]),
  id: z.number(),
  login: z.string(),
  url: z.string(),
})
export type OrgClass = z.infer<typeof OrgClassSchema>

export const PurpleSimpleUserSchema = z.object({
  avatar_url: z.string(),
  email: z.union([z.null(), z.string()]).optional(),
  events_url: z.string(),
  followers_url: z.string(),
  following_url: z.string(),
  gists_url: z.string(),
  gravatar_id: z.union([z.null(), z.string()]),
  html_url: z.string(),
  id: z.number(),
  login: z.string(),
  name: z.union([z.null(), z.string()]).optional(),
  node_id: z.string(),
  organizations_url: z.string(),
  received_events_url: z.string(),
  repos_url: z.string(),
  site_admin: z.boolean(),
  starred_at: z.string().optional(),
  starred_url: z.string(),
  subscriptions_url: z.string(),
  type: z.string(),
  url: z.string(),
  user_view_type: z.string().optional(),
})
export type PurpleSimpleUser = z.infer<typeof PurpleSimpleUserSchema>

export const CommentReactionsSchema = z.object({
  '+1': z.number(),
  '-1': z.number(),
  confused: z.number(),
  eyes: z.number(),
  heart: z.number(),
  hooray: z.number(),
  laugh: z.number(),
  rocket: z.number(),
  total_count: z.number(),
  url: z.string(),
})
export type CommentReactions = z.infer<typeof CommentReactionsSchema>

export const CommentSimpleUserSchema = z.object({
  avatar_url: z.string(),
  email: z.union([z.null(), z.string()]).optional(),
  events_url: z.string(),
  followers_url: z.string(),
  following_url: z.string(),
  gists_url: z.string(),
  gravatar_id: z.union([z.null(), z.string()]),
  html_url: z.string(),
  id: z.number(),
  login: z.string(),
  name: z.union([z.null(), z.string()]).optional(),
  node_id: z.string(),
  organizations_url: z.string(),
  received_events_url: z.string(),
  repos_url: z.string(),
  site_admin: z.boolean(),
  starred_at: z.string().optional(),
  starred_url: z.string(),
  subscriptions_url: z.string(),
  type: z.string(),
  url: z.string(),
  user_view_type: z.string().optional(),
})
export type CommentSimpleUser = z.infer<typeof CommentSimpleUserSchema>

export const FluffySimpleUserSchema = z.object({
  avatar_url: z.string(),
  email: z.union([z.null(), z.string()]).optional(),
  events_url: z.string(),
  followers_url: z.string(),
  following_url: z.string(),
  gists_url: z.string(),
  gravatar_id: z.union([z.null(), z.string()]),
  html_url: z.string(),
  id: z.number(),
  login: z.string(),
  name: z.union([z.null(), z.string()]).optional(),
  node_id: z.string(),
  organizations_url: z.string(),
  received_events_url: z.string(),
  repos_url: z.string(),
  site_admin: z.boolean(),
  starred_at: z.string().optional(),
  starred_url: z.string(),
  subscriptions_url: z.string(),
  type: z.string(),
  url: z.string(),
  user_view_type: z.string().optional(),
})
export type FluffySimpleUser = z.infer<typeof FluffySimpleUserSchema>

export const AssigneeElementSchema = z.object({
  avatar_url: z.string(),
  email: z.union([z.null(), z.string()]).optional(),
  events_url: z.string(),
  followers_url: z.string(),
  following_url: z.string(),
  gists_url: z.string(),
  gravatar_id: z.union([z.null(), z.string()]),
  html_url: z.string(),
  id: z.number(),
  login: z.string(),
  name: z.union([z.null(), z.string()]).optional(),
  node_id: z.string(),
  organizations_url: z.string(),
  received_events_url: z.string(),
  repos_url: z.string(),
  site_admin: z.boolean(),
  starred_at: z.string().optional(),
  starred_url: z.string(),
  subscriptions_url: z.string(),
  type: z.string(),
  url: z.string(),
  user_view_type: z.string().optional(),
})
export type AssigneeElement = z.infer<typeof AssigneeElementSchema>

export const TentacledSimpleUserSchema = z.object({
  avatar_url: z.string(),
  email: z.union([z.null(), z.string()]).optional(),
  events_url: z.string(),
  followers_url: z.string(),
  following_url: z.string(),
  gists_url: z.string(),
  gravatar_id: z.union([z.null(), z.string()]),
  html_url: z.string(),
  id: z.number(),
  login: z.string(),
  name: z.union([z.null(), z.string()]).optional(),
  node_id: z.string(),
  organizations_url: z.string(),
  received_events_url: z.string(),
  repos_url: z.string(),
  site_admin: z.boolean(),
  starred_at: z.string().optional(),
  starred_url: z.string(),
  subscriptions_url: z.string(),
  type: z.string(),
  url: z.string(),
  user_view_type: z.string().optional(),
})
export type TentacledSimpleUser = z.infer<typeof TentacledSimpleUserSchema>

export const LabelClassSchema = z.object({
  color: z.union([z.null(), z.string()]).optional(),
  default: z.boolean().optional(),
  description: z.union([z.null(), z.string()]).optional(),
  id: z.number().optional(),
  name: z.string().optional(),
  node_id: z.string().optional(),
  url: z.string().optional(),
})
export type LabelClass = z.infer<typeof LabelClassSchema>

export const MilestoneSimpleUserSchema = z.object({
  avatar_url: z.string(),
  email: z.union([z.null(), z.string()]).optional(),
  events_url: z.string(),
  followers_url: z.string(),
  following_url: z.string(),
  gists_url: z.string(),
  gravatar_id: z.union([z.null(), z.string()]),
  html_url: z.string(),
  id: z.number(),
  login: z.string(),
  name: z.union([z.null(), z.string()]).optional(),
  node_id: z.string(),
  organizations_url: z.string(),
  received_events_url: z.string(),
  repos_url: z.string(),
  site_admin: z.boolean(),
  starred_at: z.string().optional(),
  starred_url: z.string(),
  subscriptions_url: z.string(),
  type: z.string(),
  url: z.string(),
  user_view_type: z.string().optional(),
})
export type MilestoneSimpleUser = z.infer<typeof MilestoneSimpleUserSchema>

export const StickySimpleUserSchema = z.object({
  avatar_url: z.string(),
  email: z.union([z.null(), z.string()]).optional(),
  events_url: z.string(),
  followers_url: z.string(),
  following_url: z.string(),
  gists_url: z.string(),
  gravatar_id: z.union([z.null(), z.string()]),
  html_url: z.string(),
  id: z.number(),
  login: z.string(),
  name: z.union([z.null(), z.string()]).optional(),
  node_id: z.string(),
  organizations_url: z.string(),
  received_events_url: z.string(),
  repos_url: z.string(),
  site_admin: z.boolean(),
  starred_at: z.string().optional(),
  starred_url: z.string(),
  subscriptions_url: z.string(),
  type: z.string(),
  url: z.string(),
  user_view_type: z.string().optional(),
})
export type StickySimpleUser = z.infer<typeof StickySimpleUserSchema>

export const PullRequestSchema = z.object({
  diff_url: z.union([z.null(), z.string()]),
  html_url: z.union([z.null(), z.string()]),
  merged_at: z.union([z.coerce.date(), z.null()]).optional(),
  patch_url: z.union([z.null(), z.string()]),
  url: z.union([z.null(), z.string()]),
})
export type PullRequest = z.infer<typeof PullRequestSchema>

export const IssueReactionsSchema = z.object({
  '+1': z.number(),
  '-1': z.number(),
  confused: z.number(),
  eyes: z.number(),
  heart: z.number(),
  hooray: z.number(),
  laugh: z.number(),
  rocket: z.number(),
  total_count: z.number(),
  url: z.string(),
})
export type IssueReactions = z.infer<typeof IssueReactionsSchema>

export const LicenseSimpleSchema = z.object({
  html_url: z.string().optional(),
  key: z.string(),
  name: z.string(),
  node_id: z.string(),
  spdx_id: z.union([z.null(), z.string()]),
  url: z.union([z.null(), z.string()]),
})
export type LicenseSimple = z.infer<typeof LicenseSimpleSchema>

export const OwnerClassSchema = z.object({
  avatar_url: z.string(),
  email: z.union([z.null(), z.string()]).optional(),
  events_url: z.string(),
  followers_url: z.string(),
  following_url: z.string(),
  gists_url: z.string(),
  gravatar_id: z.union([z.null(), z.string()]),
  html_url: z.string(),
  id: z.number(),
  login: z.string(),
  name: z.union([z.null(), z.string()]).optional(),
  node_id: z.string(),
  organizations_url: z.string(),
  received_events_url: z.string(),
  repos_url: z.string(),
  site_admin: z.boolean(),
  starred_at: z.string().optional(),
  starred_url: z.string(),
  subscriptions_url: z.string(),
  type: z.string(),
  url: z.string(),
  user_view_type: z.string().optional(),
})
export type OwnerClass = z.infer<typeof OwnerClassSchema>

export const PermissionsSchema = z.object({
  admin: z.boolean(),
  maintain: z.boolean().optional(),
  pull: z.boolean(),
  push: z.boolean(),
  triage: z.boolean().optional(),
})
export type Permissions = z.infer<typeof PermissionsSchema>

export const IndigoSimpleUserSchema = z.object({
  avatar_url: z.string(),
  email: z.union([z.null(), z.string()]).optional(),
  events_url: z.string(),
  followers_url: z.string(),
  following_url: z.string(),
  gists_url: z.string(),
  gravatar_id: z.union([z.null(), z.string()]),
  html_url: z.string(),
  id: z.number(),
  login: z.string(),
  name: z.union([z.null(), z.string()]).optional(),
  node_id: z.string(),
  organizations_url: z.string(),
  received_events_url: z.string(),
  repos_url: z.string(),
  site_admin: z.boolean(),
  starred_at: z.string().optional(),
  starred_url: z.string(),
  subscriptions_url: z.string(),
  type: z.string(),
  url: z.string(),
  user_view_type: z.string().optional(),
})
export type IndigoSimpleUser = z.infer<typeof IndigoSimpleUserSchema>

export const PageSchema = z.object({
  action: z.string().optional(),
  html_url: z.string().optional(),
  page_name: z.string().optional(),
  sha: z.string().optional(),
  summary: z.union([z.null(), z.string()]).optional(),
  title: z.string().optional(),
})
export type Page = z.infer<typeof PageSchema>

export const RepoSchema = z.object({
  id: z.number(),
  name: z.string(),
  url: z.string(),
})
export type Repo = z.infer<typeof RepoSchema>

export const CommentPerformedViaGithubAppSchema = z.object({
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
  created_at: z.coerce.date(),
  description: z.union([z.null(), z.string()]),
  events: z.array(z.string()),
  external_url: z.string(),
  html_url: z.string(),
  id: z.number(),
  installations_count: z.number().optional(),
  name: z.string(),
  node_id: z.string(),
  owner: z.union([PurpleSimpleUserSchema, z.null()]),
  pem: z.string().optional(),
  permissions: z.record(z.string(), z.string()),
  slug: z.string().optional(),
  updated_at: z.coerce.date(),
  webhook_secret: z.union([z.null(), z.string()]).optional(),
})
export type CommentPerformedViaGithubApp = z.infer<
  typeof CommentPerformedViaGithubAppSchema
>

export const MilestoneSchema = z.object({
  closed_at: z.union([z.coerce.date(), z.null()]),
  closed_issues: z.number(),
  created_at: z.coerce.date(),
  creator: z.union([MilestoneSimpleUserSchema, z.null()]),
  description: z.union([z.null(), z.string()]),
  due_on: z.union([z.coerce.date(), z.null()]),
  html_url: z.string(),
  id: z.number(),
  labels_url: z.string(),
  node_id: z.string(),
  number: z.number(),
  open_issues: z.number(),
  state: StateSchema,
  title: z.string(),
  updated_at: z.coerce.date(),
  url: z.string(),
})
export type Milestone = z.infer<typeof MilestoneSchema>

export const IssuePerformedViaGithubAppSchema = z.object({
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
  created_at: z.coerce.date(),
  description: z.union([z.null(), z.string()]),
  events: z.array(z.string()),
  external_url: z.string(),
  html_url: z.string(),
  id: z.number(),
  installations_count: z.number().optional(),
  name: z.string(),
  node_id: z.string(),
  owner: z.union([StickySimpleUserSchema, z.null()]),
  pem: z.string().optional(),
  permissions: z.record(z.string(), z.string()),
  slug: z.string().optional(),
  updated_at: z.coerce.date(),
  webhook_secret: z.union([z.null(), z.string()]).optional(),
})
export type IssuePerformedViaGithubApp = z.infer<
  typeof IssuePerformedViaGithubAppSchema
>

export const RepositorySchema = z.object({
  allow_auto_merge: z.boolean().optional(),
  allow_forking: z.boolean().optional(),
  allow_merge_commit: z.boolean().optional(),
  allow_rebase_merge: z.boolean().optional(),
  allow_squash_merge: z.boolean().optional(),
  allow_update_branch: z.boolean().optional(),
  anonymous_access_enabled: z.boolean().optional(),
  archive_url: z.string(),
  archived: z.boolean(),
  assignees_url: z.string(),
  blobs_url: z.string(),
  branches_url: z.string(),
  clone_url: z.string(),
  collaborators_url: z.string(),
  comments_url: z.string(),
  commits_url: z.string(),
  compare_url: z.string(),
  contents_url: z.string(),
  contributors_url: z.string(),
  created_at: z.union([z.coerce.date(), z.null()]),
  default_branch: z.string(),
  delete_branch_on_merge: z.boolean().optional(),
  deployments_url: z.string(),
  description: z.union([z.null(), z.string()]),
  disabled: z.boolean(),
  downloads_url: z.string(),
  events_url: z.string(),
  fork: z.boolean(),
  forks: z.number(),
  forks_count: z.number(),
  forks_url: z.string(),
  full_name: z.string(),
  git_commits_url: z.string(),
  git_refs_url: z.string(),
  git_tags_url: z.string(),
  git_url: z.string(),
  has_discussions: z.boolean().optional(),
  has_downloads: z.boolean(),
  has_issues: z.boolean(),
  has_pages: z.boolean(),
  has_projects: z.boolean(),
  has_wiki: z.boolean(),
  homepage: z.union([z.null(), z.string()]),
  hooks_url: z.string(),
  html_url: z.string(),
  id: z.number(),
  is_template: z.boolean().optional(),
  issue_comment_url: z.string(),
  issue_events_url: z.string(),
  issues_url: z.string(),
  keys_url: z.string(),
  labels_url: z.string(),
  language: z.union([z.null(), z.string()]),
  languages_url: z.string(),
  license: z.union([LicenseSimpleSchema, z.null()]),
  master_branch: z.string().optional(),
  merge_commit_message: MergeCommitMessageSchema.optional(),
  merge_commit_title: MergeCommitTitleSchema.optional(),
  merges_url: z.string(),
  milestones_url: z.string(),
  mirror_url: z.union([z.null(), z.string()]),
  name: z.string(),
  node_id: z.string(),
  notifications_url: z.string(),
  open_issues: z.number(),
  open_issues_count: z.number(),
  owner: OwnerClassSchema,
  permissions: PermissionsSchema.optional(),
  private: z.boolean(),
  pulls_url: z.string(),
  pushed_at: z.union([z.coerce.date(), z.null()]),
  releases_url: z.string(),
  size: z.number(),
  squash_merge_commit_message: SquashMergeCommitMessageSchema.optional(),
  squash_merge_commit_title: SquashMergeCommitTitleSchema.optional(),
  ssh_url: z.string(),
  stargazers_count: z.number(),
  stargazers_url: z.string(),
  starred_at: z.string().optional(),
  statuses_url: z.string(),
  subscribers_url: z.string(),
  subscription_url: z.string(),
  svn_url: z.string(),
  tags_url: z.string(),
  teams_url: z.string(),
  temp_clone_token: z.string().optional(),
  topics: z.array(z.string()).optional(),
  trees_url: z.string(),
  updated_at: z.union([z.coerce.date(), z.null()]),
  url: z.string(),
  use_squash_pr_title_as_default: z.boolean().optional(),
  visibility: z.string().optional(),
  watchers: z.number(),
  watchers_count: z.number(),
  web_commit_signoff_required: z.boolean().optional(),
})
export type Repository = z.infer<typeof RepositorySchema>

export const IssueCommentSchema = z.object({
  author_association: AuthorAssociationSchema,
  body: z.string().optional(),
  body_html: z.string().optional(),
  body_text: z.string().optional(),
  created_at: z.coerce.date(),
  html_url: z.string(),
  id: z.number(),
  issue_url: z.string(),
  node_id: z.string(),
  performed_via_github_app: z
    .union([CommentPerformedViaGithubAppSchema, z.null()])
    .optional(),
  reactions: CommentReactionsSchema.optional(),
  updated_at: z.coerce.date(),
  url: z.string(),
  user: z.union([CommentSimpleUserSchema, z.null()]),
})
export type IssueComment = z.infer<typeof IssueCommentSchema>

export const IssueSchema = z.object({
  active_lock_reason: z.union([z.null(), z.string()]).optional(),
  assignee: z.union([FluffySimpleUserSchema, z.null()]),
  assignees: z.union([z.array(AssigneeElementSchema), z.null()]).optional(),
  author_association: AuthorAssociationSchema,
  body: z.union([z.null(), z.string()]).optional(),
  body_html: z.string().optional(),
  body_text: z.string().optional(),
  closed_at: z.union([z.coerce.date(), z.null()]),
  closed_by: z.union([TentacledSimpleUserSchema, z.null()]).optional(),
  comments: z.number(),
  comments_url: z.string(),
  created_at: z.coerce.date(),
  draft: z.boolean().optional(),
  events_url: z.string(),
  html_url: z.string(),
  id: z.number(),
  labels: z.array(z.union([LabelClassSchema, z.string()])),
  labels_url: z.string(),
  locked: z.boolean(),
  milestone: z.union([MilestoneSchema, z.null()]),
  node_id: z.string(),
  number: z.number(),
  performed_via_github_app: z
    .union([IssuePerformedViaGithubAppSchema, z.null()])
    .optional(),
  pull_request: PullRequestSchema.optional(),
  reactions: IssueReactionsSchema.optional(),
  repository: RepositorySchema.optional(),
  repository_url: z.string(),
  state: z.string(),
  state_reason: z.union([StateReasonSchema, z.null()]).optional(),
  timeline_url: z.string().optional(),
  title: z.string(),
  updated_at: z.coerce.date(),
  url: z.string(),
  user: z.union([IndigoSimpleUserSchema, z.null()]),
})
export type Issue = z.infer<typeof IssueSchema>

export const PayloadSchema = z.object({
  action: z.string().optional(),
  comment: IssueCommentSchema.optional(),
  issue: IssueSchema.optional(),
  pages: z.array(PageSchema).optional(),
})
export type Payload = z.infer<typeof PayloadSchema>

export const EventSchema = z.object({
  actor: ActorClassSchema,
  created_at: z.union([z.coerce.date(), z.null()]),
  id: z.string(),
  org: OrgClassSchema.optional(),
  payload: PayloadSchema,
  public: z.boolean(),
  repo: RepoSchema,
  type: z.union([z.null(), z.string()]),
})
export type Event = z.infer<typeof EventSchema>

/* Response schema - List public events for a user - PushEvent */
// https://docs.github.com/en/rest/using-the-rest-api/github-event-types?apiVersion=2022-11-28#event-payload-object-for-pushevent
const CommitAuthorSchema = z.object({
  name: z.string(),
  email: z.string(),
})

const CommitSchema = z.object({
  sha: z.string(),
  message: z.string(),
  author: CommitAuthorSchema,
  url: z.string().url(),
  distinct: z.boolean(),
})

export type Commit = z.infer<typeof CommitSchema>

const PushEventPayloadSchema = z.object({
  push_id: z.number(),
  size: z.number(),
  distinct_size: z.number(),
  ref: z.string(),
  head: z.string(),
  before: z.string(),
  commits: z.array(CommitSchema).max(20),
})

export const PushEventSchema = z.object({
  actor: ActorClassSchema,
  created_at: z.union([z.coerce.date(), z.null()]),
  id: z.string(),
  org: OrgClassSchema.optional(),
  payload: PushEventPayloadSchema,
  public: z.boolean(),
  repo: RepoSchema,
  type: z.union([z.null(), z.string()]),
})

export type PushEvent = z.infer<typeof PushEventSchema>

/* Collection Schema - User Commit Mode */
export const UserCommitReleaseItemSchema = z.object({
  id: z.string(),
  repoName: z.string(),
  repoUrl: z.string(),
  releaseVersion: z.string(),
  // releaseUrl: z.string(),
  commitMessage: z.string(),
  commitSha: z.string(),
  commitUrl: z.string(),
  actorLogin: z.string(),
  actorAvatarUrl: z.string(),
  isOrg: z.boolean(),
  OrgLogin: z.string().optional(),
  OrgAvatarUrl: z.string().optional(),
  created_at: z.string(),
})

export type UserCommitReleaseItem = z.infer<typeof UserCommitReleaseItemSchema>
