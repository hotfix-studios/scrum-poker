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
                Debug.LogError($"Success: POST installationId to {endpoint}");
            }
        }
    }

    public static async Task<List<string>> GetRepoNames(string endpoint, string[] projections)
    {
        var baseURL = GetBaseURL();
        using (UnityWebRequest www = UnityWebRequest.Get(baseURL + endpoint))
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

                // return HandleResponseRepoNames(responseData);
                return HandleResponseReposData(responseData);
            }
        }
    }

    public static List<string> HandleResponseRepoNames(string responseData)
    {
        Debug.Log("Response Repo Names Action: " + responseData);
        try
        {
            var repoData = JsonConvert.DeserializeObject(responseData);
            Debug.Log(repoData);
            // Store.repoOwnerId = repoData.owner_id;

            #region STRINGS
            responseData = responseData.Replace("[", "").Replace("]", "").Replace("\"", "").Trim();
            string[] responseRepoNames = responseData.Split(',');
            var installationRepoNames = new List<string>(responseRepoNames);
            Debug.Log("Installation Repo Names SUCCESS:" + string.Join(", ", installationRepoNames));
            #endregion STRINGS

            Debug.Log("Installation Repo Names SUCCESS:" + string.Join(", ", installationRepoNames));
            foreach (var item in installationRepoNames)
            {
                Debug.Log("List is Populated:" + item);
            }

            return installationRepoNames;
        }
        catch (Exception e)
        {
            Debug.LogError("JsonUtility failure:" + e);
            throw;
        }
    }

    IEnumerator GetSelectedRepoIssues(string endpoint, string[] projections, Action<string> handleResponse)
    {
        /* TODO: handle projections? */
        Debug.Log("-- GetSelectedRepoIssues --");
        string url = GetBaseURL() + endpoint + Store.repoOwnerId + "/" + Store.repoName;

        using (UnityWebRequest www = UnityWebRequest.Get(url))
        {
            yield return www.SendWebRequest();

            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError("Error: " + www.error);
            }
            else
            {
                string responseData = www.downloadHandler.text;
                Debug.Log("Response DESERIALIZING STEP: [ISSUES]");
                Debug.Log(responseData);

                handleResponse?.Invoke(responseData);
            }
        }
    }

    public static List<string> HandleResponseReposData(string responseData)
    {
        List<string> repoNames = new List<string>();
        // List<int> repoOwnerIds = new List<int>();

        var repoData = JArray.Parse(responseData);

        foreach (var repo in repoData)
        {
            if (repo["name"] != null)
            {
                repoNames.Add(repo["name"].ToString());
            }

/*            if (repo["owner_id"] != null && repo["owner_id"].Type == JTokenType.Integer)
            {
                repoOwnerIds.Add(repo["owner_id"].Value<int>());
            }*/
        }

/*        if (repoOwnerIds.Count > 0)
        {
            Store.repoOwnerId = repoOwnerIds[0];
        }*/

        Debug.Log("REPO_NAMES: " + repoNames);
/*        Debug.Log("REPO_OWNER_IDS: " + repoOwnerIds);
        Debug.Log("OWNER_ID: " + Store.repoOwnerId);*/

        return repoNames;

    }

    void HandleResponseSelectedRepoIssues(string responseData)
    {
        Debug.Log("!!INSIDE FINAL STEP TO LOAD ISSUES!!");
        Debug.Log("THIS IS THE DATA THAT SHOULD POPULATE ISSUES UI ELEMENT");
        Debug.Log(responseData);
    }
    #endregion HTTP_REQUESTS

    }
