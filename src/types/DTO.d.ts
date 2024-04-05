///////////////////////////////
//// Data Transfer Objects ////
///////////////////////////////

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  private?: boolean;
  owner_id?: number;
  description?: string | null;
  url?: string;
  collaborators_url?: string;
  teams_url?: string;
  hooks_url?: string;
  issue_events_url?: string;
  events_url?: string;
  assignees_url?: string;
  languages_url?: string;
  contributors_url?: string;
  comments_url?: string;
  issue_comment_url?: string;
  contents_url?: string;
  issues_url?: string;
  labels_url?: string;
  clone_url?: string;
  has_issues?: boolean;
  has_projects?: boolean;
  open_issues_count?: number;
};

export interface ReqProjectsParams {
  owner: string;
  repo: string;
  owner_type: string;
}
