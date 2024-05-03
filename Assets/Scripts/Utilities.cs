using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using System.Linq;
using System;

public class Utilities : MonoBehaviour
{
    public static string GetBaseURL()
    {
        string fullURL = Application.absoluteURL;

        if (fullURL.Contains("?"))
        {
            int queryStringIndex = fullURL.IndexOf('?');
            return fullURL.Substring(0, queryStringIndex);
        }
        return null;
    }

    public static string GetCode()
    {
        var baseURL = GetBaseURL();

        string fullURL = Application.absoluteURL;

        int queryStringIndex = fullURL.IndexOf('?');

        string queryString = fullURL.Substring(queryStringIndex + 1);

        string[] queryParams = queryString.Split('&');

        foreach (string param in queryParams)
        {
            string[] keyValue = param.Split('=');
            string paramName = keyValue[0];
            string paramValue = keyValue[1];

            if (paramName == "code")
            {
                return paramValue;
            }
        }
       return null;
    }

    #region HTTP_REQUESTS

    // POST

    public static IEnumerator PostCode(string code)
    {
        var baseURL = GetBaseURL();
        var endpoint = $"api/installations/auth/{code}";

        WWWForm form = new WWWForm();
        form.AddField("code", code);

        using (UnityWebRequest www = UnityWebRequest.Post(baseURL + endpoint, form))
        {
            var asyncOperation = www.SendWebRequest();
            while (!asyncOperation.isDone)
            {
                yield return null;
            }

            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError("Error: " + www.error);
            }
            else
            {
                Debug.Log($"Success: POST code to {endpoint}");
                HandleResponseUserData(www.downloadHandler.text);
            }
        }
    }

    public static async Task<List<string>> GetRepos(string endpoint)
    {
        var baseURL = GetBaseURL();
        string url = $"{baseURL}{endpoint}";
        using (UnityWebRequest www = UnityWebRequest.Get(url))
        {
            var asyncOperation = www.SendWebRequest();
            while (!asyncOperation.isDone)
            {
                await Task.Yield();
            }

            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError("Error: " + www.error);
                return null;
            }
            else
            {
                string responseData = www.downloadHandler.text;
                Debug.Log("Response DESERIALIZING STEP:");
                Debug.Log(responseData);

                return HandleResponseRepos(responseData);
            }
        }
    }

    public static List<string> HandleResponseRepos(string responseData)
    {
        Store.Repository repository = new Store.Repository();

        List<string> repoNames = new List<string>();
        List<Store.Repository> repos = new List<Store.Repository>();

        var data = JObject.Parse(responseData);
        var repoData = data["repository_data"];

        foreach (var repo in repoData)
        {
            if (repo["full_name"] != null && repo["_id"] != null)
            {
                repository.full_name = (string)repo["full_name"];
                repository._id = (int)repo["_id"];
                repos.Add(repository);
            }
            if (repo["full_name"] != null)
            {
                repoNames.Add(repo["full_name"].ToString());
            }
        }

        Debug.Log("REPO_NAMES: " + repoNames);

        return repoNames;

    }

    public static async Task<object[]> GetRepoIssues(string endpoint)
    {
        var baseURL = GetBaseURL();
        string url = $"{baseURL}{endpoint}{Store.repoName}";

        using (UnityWebRequest www = UnityWebRequest.Get(url))
        {
            var asyncOperation = www.SendWebRequest();
            while (!asyncOperation.isDone)
            {
                await Task.Yield();
            }

            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError("Error: " + www.error);
                return null;
            }
            else
            {
                string responseData = www.downloadHandler.text;
                Debug.Log("Response DESERIALIZING STEP: [ISSUES]");
                Debug.Log(responseData);

                return HandleResponseRepoIssues(responseData);
            }
        }
    }

    public static object[] HandleResponseRepoIssues(string responseData)
    {
        var data = JObject.Parse(responseData);
        Debug.Log(data);

        var repoData = data["repository_data"];
        var backlog = repoData["backlog_issues"];
        Debug.Log("BACKLOG: " + backlog);

        object[] issues = backlog.ToArray();
        return issues;
    }

    public static void HandleResponseUserData(string responseData)
    {
        var data = JObject.Parse(responseData);
        Debug.Log(data);

        var userData = data["user_data"];

        Store.id = (int)userData["_id"];
        Debug.Log("ID: " + Store.id);

        Store.fullName = (string)userData["name"];
        Debug.Log("FULLNAME: " + Store.fullName);

        Store.avatar = (string)userData["avatar_url"];
        Debug.Log("AVATAR: " + Store.avatar);
    }

    #endregion HTTP_REQUESTS

}
