///////////////////////////////
///// DB Document Objects /////
///////////////////////////////

export interface Issue {
    _id: number;
    url: string;
    repository_name: string;
    repository_url: string;
    number: number;
    title: string;
    labels: string[];
    state: string;
    body: string;
    pointed: boolean;
};

export interface Installation {
    _id: number;
    owner_name: string ;
    owner_id: number;
    type: string;
    orgs_url: string;
    repos_url: string;
    repos: number[]
  };

export interface User {
    _id: number;
    type: string;
    name: string;
    avatar_url: string;
    repos_url: string;
    game_host: boolean;
    app_owner: boolean;
    repos: number[];
};

export interface Repository {
    _id: number;
    name: string;
    full_name: string;
    private: boolean;
    owner_id: number;
    description: string;
    url: string;
    collaborators_url: string;
    teams_url: string;
    hooks_url: string;
    issue_events_url: string;
    events_url: string;
    assignees_url: string;
    languages_url: string;
    contributors_url: string;
    comments_url: string;
    issue_comment_url: string;
    contents_url: string;
    issues_url: string;
    labels_url: string;
    clone_url: string;
    has_issues: boolean;
    has_projects: boolean;
    open_issues_count: number;
    has_backlog: boolean;
    has_pointed: boolean;
};

export interface Room {
    _id: string;
    host: number;
    users: number[];
};