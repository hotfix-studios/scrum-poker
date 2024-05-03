///////////////////////////////
//// Data Transfer Objects ////
///////////////////////////////

export interface User {
  _id: number;
  name: string | null; // name, not login
  avatar_url: string;
  repos_url: string;
  type: string;
  repos: number[];
};

export interface Repository {
  _id: number;
  name: string;                // ?
  full_name: string;
  owner_id: number;            // ?
  description?: string | null; // ?
  language: string;
  open_issues_count?: number;
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
