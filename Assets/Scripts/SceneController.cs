using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UIElements;
using NativeWebSocket;
using System.Linq;
using Unity.VisualScripting;
using System.Collections;
using UnityEngine.Networking;
using System.Data.Common;

public class SceneController : MonoBehaviour
{
    private static SceneController instance;
    private static string baseURL;
    private static string code;
    private static bool isHost;
    private static List<string> participants;

    private List<string> projects;
    private string roomId = GUIDGenerator.guid;
    public static int installationId;
    public static string selectedRepoName;
    public static int selectedRepoId;
    public static int selectedRepoOwnerId;
    public static List<Repository> installationRepos = new();
    public List<int> installationReposIds = new(); // = WebSocketConnection.installationReposIds;
    public List<string> installationReposNames = new(); // = WebSocketConnection.installationReposNames;
    public List<int> installationReposOwnerIds = new();
    public List<string> installationReposIssuesUrls = new(); // = WebSocketConnection.installationReposIssuesUrls;
    // public List<string> installationReposData = WebSocketConnection.installationReposData; // TODO: needs List<class> not List<string>, come from WSConnection
    public List<string> backlog;

    /* Despite Singleton Pattern this was being called multiple times? And not sequenced correctly for async coroutine */
    void Start()
    {
        /* TODO: possibly make http request here (coroutine call) */
        // StartUI();
    }

    private void Awake()
    {
        /* Establishes SceneController as Singleton */
        if (instance != null && instance != this)
        {
            Destroy(gameObject);
            return;
        }

        DontDestroyOnLoad(gameObject);

        /* Parsing URL for User Installation ID and API Base Url (assigned to class prop) */
        /* Encapsulate into method ("GetInstallationIdUrl"?) */
        string fullURL = Application.absoluteURL;

        int queryStringIndex = fullURL.IndexOf('?');

        baseURL = fullURL.Substring(0, queryStringIndex);

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

                if (int.TryParse(paramValue, out int result)) {

                    installationId = result;
                } else {

                    Debug.LogError("--Installation ID from URL param tryParse Fail--");
                }

                break;
            }
        }

        Debug.Log("Base URL Capture:");
        Debug.Log(baseURL);
        Debug.Log("Coroutine calling from AWAKE");

        // StartCoroutine(GetRepoDataById("api/repos/names/", HandleResponseRepoNames));
        StartCoroutine(GetRepoDataById("api/repos/names/", new string[] {"name", "owner_id"}, HandleResponseReposData));
    }

    // TODO: Move to helpers region or something...
    private void StartUI()
    {
        VisualElement root = GetComponent<UIDocument>().rootVisualElement;
        Button buttonHost = root.Q<Button>("ButtonHost");
        Button buttonJoin = root.Q<Button>("ButtonJoin");
        Button buttonCreate = root.Q<Button>("ButtonCreate");
        Button buttonLobby = root.Q<Button>("ButtonLobby");
        Button buttonStart = root.Q<Button>("ButtonStart");
        DropdownField dropdown = root.Q<DropdownField>("Dropdown");
        TextField inviteCode = root.Q<TextField>("InviteCode");
        TextField textFieldInvite = root.Q<TextField>("TextFieldInvite");
        GroupBox participantsBox = root.Q<GroupBox>("ParticipantsBox");

        if (SceneManager.GetActiveScene().name == "Title")
        {
            buttonHost.clicked += () => SceneManager.LoadScene(1);
            buttonJoin.clicked += () => SceneManager.LoadScene(2);
        }

        if (SceneManager.GetActiveScene().name == "Host")
        {
            isHost = true;

            dropdown.choices.Clear();

            Debug.Log("Dropdown about to be populated contents: (from class prop)");
            foreach (var name in installationReposNames)
            {
                Debug.Log(name);
            }

            dropdown.choices = installationReposNames;

            buttonCreate.clicked += () =>
            {
                // This value will be the chosen repo
                selectedRepoName = dropdown.text;
                // var selectedIndex = installationReposNames.FindIndex(repo => repo == selectedRepoName);
                // selectedRepoId = installationReposIds[selectedIndex];
                // selectedRepoOwnerId = installationReposOwnerIds[selectedIndex];
                Repository selectedRepo = installationRepos.FirstOrDefault(repo => repo.name == selectedRepoName);

                selectedRepoId = selectedRepo._id;
                selectedRepoOwnerId = selectedRepo.owner_id;

                Debug.Log($"REPO: {selectedRepoName}"); /* TODO: 3/31 star here: */
                StartCoroutine(GetSelectedRepoIssues("api/issues/", new string[] {"name"}, HandleResponseSelectedRepoIssues));

                CreateRoom();

                SceneManager.LoadScene(3);
            };
        }

        if (SceneManager.GetActiveScene().name == "Join")
        {
            isHost = false;
            buttonLobby.clicked += () =>
            {
                code = inviteCode.text;
                JoinRoom();
                SceneManager.LoadScene(3);
            };
        }

        if (SceneManager.GetActiveScene().name == "Lobby")
        {
            // TODO: assign class backlog to message sent from sockets (after node)
            // TODO: format backlog here (obj parsing)
            // TODO: log participants
            if(isHost)
            {
                textFieldInvite.value = roomId;
            }
            else
            {
                textFieldInvite.value = code;
            }

            // Populate the GroupBox with the participants list

            buttonStart.clicked += () => SceneManager.LoadScene(4);
        }
    }

    #region DTO_CLASSES
    /// TODO: These three classes are Data Transfer Object classes and can be refactored to be simpler
    public class Data
    {
        [JsonProperty("type")]
        public string Type { get; set; }

        [JsonProperty("params")]
        public Params Params { get; set; }
    }
    public class Params
    {
        public string roomId;
        public int installationId;
        public string selectedRepoName;
        public int selectedRepoId;
        public List<int> installationReposIds;
        public List<string> installationReposNames;
        public List<string> installationReposIssuesUrls;
        public List<string> backlog;
    }
    private class HttpData
    {
        public readonly string repoNames;
    }

    public class RepoData
    {
        public List<Repository> repo_data { get; set; }
    }

    public class Repository
    {
        public int _id { get; set; }
        public string name { get; set; }
        public int owner_id { get; set; }
    }
    #endregion DTO_CLASSES

    async void CreateRoom()
    {
        if (WebSocketConnection.ws.State == WebSocketState.Open)
        {
            var data = new Data
            {
                Type = "create",
                Params = new Params
                {
                    roomId = roomId,
                    installationId = installationId,
                    selectedRepoName = selectedRepoName, // single repo name
                    selectedRepoId = selectedRepoId,
                    backlog = backlog
                }
            };
            string json = JsonConvert.SerializeObject(data);
            Debug.Log("create" + json);
            await WebSocketConnection.ws.SendText(json);
        }
    }

    async void JoinRoom()
    {
        if (WebSocketConnection.ws.State == WebSocketState.Open)
        {
            var data = new Data
            {
                Type = "join",
                Params = new Params
                {
                    roomId = code,
                    installationId = installationId
                }
            };
            string json = JsonConvert.SerializeObject(data);
            Debug.Log("join" + json);
            await WebSocketConnection.ws.SendText(json);
        }
    }

    #region HTTP_REQUESTS
    /// <summary>
    /// Coroutine to make http, nearly fully modular however only handles string conversion currently
    /// (this region could become a prefab)
    /// </summary>
    IEnumerator GetRepoDataById(string endpoint, Action<string> handleResponse)
    {
        string url = baseURL + endpoint + installationId;
        Debug.Log("Made it inside GetRepoDataById call: url - " + url);

        using(UnityWebRequest www = UnityWebRequest.Get(url))
        {
            Debug.Log("-- Inside using UnityWebRequest Get --");

            yield return www.SendWebRequest();
            Debug.Log(www.result);

            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError("Error: " + www.error);
            }
            else
            {
                string responseData = www.downloadHandler.text;
                Debug.Log("Response DESERIALIZING STEP:");
                Debug.Log(responseData);

                // HttpData _responseDTO = JsonUtility.FromJson<HttpData>(responseData);

                // if (_responseDTO != null)
                // {
                //     handleResponse?.Invoke(_responseDTO.repoNames);
                // }

                /* try making parent scope async and await handleResponse.Invoke call IF sequencing failure */
                handleResponse?.Invoke(responseData);
                StartUI();
            }
        }
    }

    IEnumerator GetRepoDataById(string endpoint, string[] projections, Action<string> handleResponse)
    {
        Debug.Log("Base URL: " + baseURL);
        Debug.Log("Endpoint: " + endpoint);
        foreach (var item in projections)
        {
            Debug.Log("projection: " + item);
        }
        string pathParams = installationId + "/" + string.Join(",", projections);
        string url = baseURL + endpoint + pathParams;

        Debug.Log("URL: " + url);

        using(UnityWebRequest www = UnityWebRequest.Get(url))
        {
            yield return www.SendWebRequest();

            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError("Error: " + www.error);
            }
            else
            {
                string responseData = www.downloadHandler.text;
                Debug.Log("Response DESERIALIZING STEP:");
                Debug.Log(responseData);

                handleResponse?.Invoke(responseData);
                StartUI();
            }
        }
    }

    /// <summary>
    /// Sends http with repo.owner_id and repo.name to GET repo backlog issues
    /// </summary>
    /// <param name="endpoint">/api/issues/:owner/:repo</param>
    IEnumerator GetSelectedRepoIssues(string endpoint, string[] projections, Action<string> handleResponse)
    {
        /* TODO: GRAB CODE= PATH PARAM?? */
        /* TODO: handle projections? */
        Debug.Log("-- GetSelectedRepoIssues --");
        string url = baseURL + endpoint + selectedRepoOwnerId + "/" + selectedRepoName;

        using(UnityWebRequest www = UnityWebRequest.Get(url))
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

    void HandleResponseRepoNames(string responseData)
    {
        Debug.Log("Response Repo Names Action: " + responseData);
        try
        {
            #region STRINGS
            responseData = responseData.Replace("[", "").Replace("]", "").Replace("\"", "").Trim();
            string[] responseRepoNames = responseData.Split(',');
            installationReposNames = new List<string>(responseRepoNames);
            Debug.Log("Installation Repo Names SUCCESS:" + string.Join(", ", installationReposNames));
            #endregion STRINGS

            // Remove leading and trailing whitespace characters from each string (NOT NEEDED?)
            // for (int i = 0; i < repoNamesArray.Length; i++)
            // {
            //     repoNamesArray[i] = repoNamesArray[i].Trim();
            // }

            Debug.Log("Installation Repo Names SUCCESS:" + string.Join(", ", installationReposNames));
            foreach (var item in installationReposNames)
            {
                Debug.Log("List is Populated:" + item);
            }
        }
        catch (Exception e)
        {
            Debug.LogError("JsonUtility failure:" + e);
            throw;
        }
    }

    void HandleResponseReposData(string responseData)
    {
        RepoData repoData = JsonConvert.DeserializeObject<RepoData>(responseData);

        installationReposIds = repoData.repo_data.Select(repo => repo._id).ToList();
        installationReposNames = repoData.repo_data.Select(repo => repo.name).ToList();
        installationReposOwnerIds = repoData.repo_data.Select(repo => repo.owner_id).ToList();
        installationRepos = new List<Repository>(repoData.repo_data);

        Debug.Log("Installation Repo DESERIALIZATION SUCCESS:" + string.Join(", ", installationReposNames));
        foreach (var item in installationReposIds)
        {
            Debug.Log("Ids List is Populated:" + item);
        }
        foreach (var item in installationReposNames)
        {
            Debug.Log("Names List is Populated:" + item);
        }
        foreach (var item in installationReposOwnerIds)
        {
            Debug.Log("Owner Ids List is Populated:" + item);
        }

    }

    void HandleResponseSelectedRepoIssues(string responseData)
    {
        Debug.Log("!!INSIDE FINAL STEP TO LOAD ISSUES!!");
        Debug.Log("THIS IS THE DATA THAT SHOULD POPULATE ISSUES UI ELEMENT");
        Debug.Log(responseData);
    }

    /* TODO: next http request to make path to get Issues */
    // look up repo by id
    // // get repo.owner_id (query) && repo.name (done)
    // // // look up user by repo.owner_id
    // // // // get user.name

    #endregion HTTP_REQUESTS

}
