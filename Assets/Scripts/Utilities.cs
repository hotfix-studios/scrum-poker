using System;
using System.Collections;
using System.Collections.Generic;
using Unity.VisualScripting;
using UnityEngine;
using UnityEngine.Networking;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Linq;

public class Utilities : MonoBehaviour
{
    public static string GetBaseURL()
    {
        string fullURL = Application.absoluteURL;

        int queryStringIndex = fullURL.IndexOf('?');

        return fullURL.Substring(0, queryStringIndex);
    }

    public static int? GetInstallationID()
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

            if (paramName == "installation_id")
            {
                Debug.Log("Installation ID: " + paramValue);

                if (int.TryParse(paramValue, out int installationId))
                {

                    return installationId;
                }
                else
                {

                    Debug.LogError("--Installation ID from URL param tryParse Fail--");
                    return null;
                }
            }
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
                Debug.Log("Code: " + paramValue);
                return paramName;
            }
        }
       return null;
    }

    #region HTTP_REQUESTS

    // POST
    public static IEnumerator PostInstallationId(int? installationId)
    {
        var baseURL = GetBaseURL();
        var endpoint = $"api/installations/auth/{installationId}";

        WWWForm form = new WWWForm();
        form.AddField("installationId", installationId.ToString());

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
                Debug.Log($"Success: POST installationId to {endpoint}");
            }
        }
    }

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
                Store.token = HandleResponseAuthToken(www.downloadHandler.text);
                Debug.Log($"Authorization Token: {Store.token}");
            }
        }
    }

    // GET

    public static async Task<string> GetAuthToken(string endpoint)
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
                Debug.Log(responseData);

                return HandleResponseAuthToken(responseData);
            }
        }
    }

    public static string HandleResponseAuthToken(string responseData)
    {
        var data = JObject.Parse(responseData);
        var token = data["authorization"].ToString();

        if (string.IsNullOrEmpty(token))
        {
            Debug.LogError("Error parsing authorization token");
            return null;
        }

        return token;
    }

    public static async Task<List<string>> GetRepoNamesAndSetOwnerId(string endpoint, string[] projections)
    {
        var baseURL = GetBaseURL();
        string url = $"{baseURL}{endpoint}{string.Join(',', projections)}";
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

                return HandleResponseRepoNamesAndSetOwnerId(responseData);
            }
        }
    }

    public static List<string> HandleResponseRepoNamesAndSetOwnerId(string responseData)
    {
        List<string> repoNames = new List<string>();
        List<int> repoOwnerIds = new List<int>();

        var data = JObject.Parse(responseData);
        var repoData = data["repository_data"];

        foreach (var repo in repoData)
        {
            if (repo["name"] != null)
            {
                repoNames.Add(repo["name"].ToString());
            }

            if (repo["owner_id"] != null && repo["owner_id"].Type == JTokenType.Integer)
            {
                repoOwnerIds.Add(repo["owner_id"].Value<int>());
            }
        }

        if (repoOwnerIds.Count > 0)
        {
            Store.repoOwnerId = repoOwnerIds[0];
        }

        Debug.Log("REPO_NAMES: " + repoNames);
        Debug.Log("REPO_OWNER_IDS: " + repoOwnerIds);
        Debug.Log("OWNER_ID: " + Store.repoOwnerId);

        return repoNames;

    }

    public static async Task<object[]> GetRepoIssues(string endpoint, string[] projections)
    {
        /* TODO: handle projections? */
        var baseURL = GetBaseURL();
        string url = $"{baseURL}{endpoint}{Store.repoOwnerId}/{Store.repoName}";

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

    public static async Task<Dictionary<string, string>> GetUserData(string endpoint, string[] projections)
    {
        var baseURL = GetBaseURL();
        string url = $"{baseURL}{endpoint}{Store.repoOwnerId}/{string.Join(',', projections)}";
        // string url = $"{baseURL}{endpoint}{Store.repoOwnerId}/";

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
                Debug.Log("Response DESERIALIZING STEP: [USER DATA]");
                Debug.Log(responseData);

                return HandleResponseUserData(responseData);
            }
        }
    }

    public static Dictionary<string, string> HandleResponseUserData(string responseData)
    {
        var data = JObject.Parse(responseData);
        Debug.Log(data);

        Dictionary<string, string> userData = data["user_data"].ToObject<Dictionary<string, string>>();
        return userData;
    }

    #endregion HTTP_REQUESTS

}
