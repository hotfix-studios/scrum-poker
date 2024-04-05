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

using static SceneController;

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

    #region HTTP_REQUESTS

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

    public static async Task<List<string>> GetRepoNamesAndSetOwnerId(string endpoint, string[] projections)
    {
        var baseURL = GetBaseURL();
        using (UnityWebRequest www = UnityWebRequest.Get(baseURL + endpoint + string.Join(',', projections)))
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

                return HandleResponseReposData(responseData);
            }
        }
    }
    // /api/issues/repoOwnerId/repoName
    public static async Task<List<object>> GetRepoIssues(string endpoint, string[] projections)
    {
        /* TODO: handle projections? */
        Debug.Log("-- GetSelectedRepoIssues --");
        string url = GetBaseURL() + endpoint; //+ Store.repoOwnerId + "/" + Store.repoName;

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

    public static List<string> HandleResponseReposData(string responseData)
    {
        Debug.Log("RESPONSE DATA: " + responseData);
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

/*    void HandleResponseSelectedRepoIssues(string responseData)
    {
        Debug.Log("!!INSIDE FINAL STEP TO LOAD ISSUES!!");
        Debug.Log("THIS IS THE DATA THAT SHOULD POPULATE ISSUES UI ELEMENT");
        Debug.Log(responseData);
    }*/

    public static List<object> HandleResponseRepoIssues(string responseData)
    {
        var data = JObject.Parse(responseData);
        // var repoData = data["repository_data"];
        List<object> issues = new List<object>(data);
        /*        var repositoryData = repoData["repository_data"];

                Debug.Log("ISSUES: " + repoData);

                List<object> issues = new List<object>();

                foreach (var repo in repoData)
                {
                    issues.Add(repo);
                }

                Debug.Log(issues);*/
        return issues;
    }
    #endregion HTTP_REQUESTS

    }
