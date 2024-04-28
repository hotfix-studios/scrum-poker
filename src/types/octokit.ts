// types/octokit.d.ts

/** ***************** **
 * ******************* *
 * ALL EVENTS PAYLOAD **
 * ******************* *
 ** ***************** **/

/**
 * payload.issue.user
 * payload.repository.owner
 * payload.sender
 * payload.installation.account
 */
export interface User {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
}

export interface OAuthUser {
  login: string,
  id: number,
  node_id: string,
  avatar_url: string,
  gravatar_id?: string,
  url: string,
  html_url: string,
  followers_url: string,
  following_url: string,
  gists_url: string,
  starred_url: string,
  subscriptions_url: string,
  organizations_url: string,
  repos_url: string,
  events_url: string,
  received_events_url: string,
  type: string,
  site_admin: boolean,
  name: string, // use this for user name
  company: string,
  blog: string,
  location: string | null,
  email: string,
  hireable: string | null,
  bio: string | null,
  twitter_username: string | null,
  public_repos: number,
  public_gists: number,
  followers: number,
  following: number,
  created_at: Date,
  updated_at: Date,
  private_gists: number,
  total_private_repos: number,
  owned_private_repos: number,
  disk_usage: number,
  collaborators: number,
  two_factor_authentication: boolean,
  plan: GHUserPlan
}

export interface GHUserPlan {
  name: string,
  space: number,
  collaborators: number,
  private_repos: number
}

/**
 * payload.repository
 */
export interface Repository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: User;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  forks_url: string;
  keys_url: string;
  collaborators_url: string;
  teams_url: string;
  hooks_url: string;
  issue_events_url: string;
  events_url: string;
  assignees_url: string;
  branches_url: string;
  tags_url: string;
  blobs_url: string;
  git_tags_url: string;
  git_refs_url: string;
  trees_url: string;
  statuses_url: string;
  languages_url: string;
  stargazers_url: string;
  contributors_url: string;
  subscribers_url: string;
  subscription_url: string;
  commits_url: string;
  git_commits_url: string;
  comments_url: string;
  issue_comment_url: string;
  contents_url: string;
  compare_url: string;
  merges_url: string;
  archive_url: string;
  downloads_url: string;
  issues_url: string;
  pulls_url: string;
  milestones_url: string;
  notifications_url: string;
  labels_url: string;
  releases_url: string;
  deployments_url: string;
  created_at?: string | number;
  updated_at?: string;
  pushed_at?: string | number;
  git_url: string;
  ssh_url: string;
  clone_url: string;
  svn_url: string;
  homepage?: string | null;
  size?: number;
  stargazers_count?: number;
  watchers_count?: number;
  language?: string | null;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  has_discussions: boolean;
  forks_count?: number;
  mirror_url?: string | null;
  archived: boolean;
  disabled: boolean;
  open_issues_count?: number;
  license?: any | null; // You might want to define a type for the license object
  allow_forking: boolean;
  is_template: boolean;
  web_commit_signoff_required: boolean;
  topics?: string[];
  visibility: string;
  forks?: number;
  open_issues?: number;
  watchers?: number;
  default_branch: string;
  permissions?: Permissions;
  temp_clone_token: string;
  custom_properties?: any; // Record<string, any>
  organization?: User;
  network_count?: number;
  subscribers_count?: number;
}


/** ***************** **
 * ******************* *
 * ISSUE EVENT PAYLOAD *
 * ******************* *
 ** ***************** **/

/**
 * payload.issue.reactions
 */
export interface Reactions {
  url: string;
  total_count: number;
  '+1': number;
  '-1': number;
  laugh: number;
  hooray: number;
  confused: number;
  heart: number;
  rocket: number;
  eyes: number;
}

/**
 * payload.issue
 */
export interface Issue {
  url: string;
  repository_url: string;
  labels_url: string;
  comments_url: string;
  events_url: string;
  html_url: string;
  id: number;
  node_id: string;
  number: number;
  title: string;
  user: User;
  labels: any[]; // may want to define a type for labels if needed
  state: string;
  locked: boolean;
  assignee: User | null;
  assignees: User[];
  milestone: any | null; // may want to define a type for milestone if needed
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  author_association: string;
  active_lock_reason: string | null;
  body: string;
  reactions: Reactions;
  timeline_url: string;
  performed_via_github_app: any | null; // may want to define a type for performed_via_github_app if needed
  state_reason: string | null;
}

/**
 * payload.organization
 */
export interface Organization {
  login: string;
  id: number;
  node_id: string;
  url: string;
  repos_url: string;
  events_url: string;
  hooks_url: string;
  issues_url: string;
  members_url: string;
  public_members_url: string;
  avatar_url: string;
  description: string;
}

export interface UserProject {
  owner_url: string;
  url: string;
  html_url: string;
  columns_url: string;
  id: number;
  node_id: string;
  name: string;
  body: string;
  number: number;
  state: string;
  creator: User;
  created_at: Date;
  updated_at: Date;
}

export interface OrgProject {
  owner_url: string;
  url: string;
  html_url: string;
  columns_url: string;
  id: number;
  node_id: string;
  name: string;
  body: string;
  number: number;
  state: string;
  creator: User;
  created_at: Date;
  updated_at: Date;
  organization_permission: string;
  private: boolean;
}


/** ***************** **
 * ******************* *
 * * PR EVENT PAYLOAD **
 * ******************* *
 ** ***************** **/


// Export the Issue type
// export { Issue };


/** ********************** **
 * ************************ *
 * * INSTALL EVENT PAYLOAD **
 * ************************ *
 ** ********************** **/

/**
 * installation.create (event)
 * payload.installation
 */
export interface Installation {
  id: number;
  account: User;
  repository_selection?: string;
  access_tokens_url?: string;
  repositories_url?: string;
  html_url?: string;
  app_id?: number;
  app_slug?: string;
  target_id?: number;
  target_type?: string;
  permissions?: Permissions;
  events?: string[];
  created_at?: Date;
  updated_at?: Date;
  single_file_name?: string | null;
  has_multiple_single_files?: boolean;
  single_file_paths?: any[];
  suspended_by?: any | null;
  suspended_at?: any | null;
}

export interface Permissions {
  members?: string;
  organization_projects?: string;
  issues?: string;
  metadata?: string;
  repository_projects?: string;
  admin?: boolean;
  maintain?: boolean;
  push?: boolean;
  triage?: boolean;
  pull?: boolean;
}
