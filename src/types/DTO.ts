///////////////////////////////
//// Data Transfer Objects ////
///////////////////////////////

export interface User {
  id: number;
  name: string; // name, not login
  avatar_url: string;
  repos_url: string;
  type: string;
  repos: number[];
};

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  is_private: boolean;
  owner_id: number;
  description?: string | null;
  url: string;
  collaborators_url: string;
  teams_url: string;
  assignees_url: string;
  contributors_url: string;
  comments_url: string;
  issue_comment_url: string;
  issues_url: string;
  labels_url: string;
  clone_url: string;
  language: string;
  has_issues: boolean;
  has_projects: boolean;
  open_issues_count?: number;
  has_backlog: boolean;
  has_pointed: boolean;
};

/**
 * @interface IssueDTO projection
 * @example { _id: 1234.., number: 3 }
 */
export interface IdAndNum {
  _id: number,
  number: number
};

export interface ReqProjectsParams {
  owner: string;
  repo: string;
  owner_type: string;
}

export interface HttpProjectionsContexts {
  routeProjectionsContext: string;
  middlewareContext: string;
};
