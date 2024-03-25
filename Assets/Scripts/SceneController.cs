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
    public List<int> installationReposIds = new(); // = WebSocketConnection.installationReposIds;
    public List<string> installationRepoNames; // = WebSocketConnection.installationRepoNames;
    public List<string> installationReposIssuesUrls = new(); // = WebSocketConnection.installationReposIssuesUrls;
    // public List<string> installationReposData = WebSocketConnection.installationReposData; // TODO: needs List<class> not List<string>, come from WSConnection
    public List<string> backlog;

    void Start()
    {
        // StartUI();
    }

    private void Awake()
    {
        if (instance != null && instance != this)
        {
            Destroy(gameObject);
            return;
        }
        DontDestroyOnLoad(gameObject);

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
                    Debug.Log("FUCK UYOU");
                }
                break;
            }
        }

        Debug.Log("Base URL Capture:");
        Debug.Log(baseURL);
        // TODO: call StartCoroutine here...
        StartCoroutine(MakeRequest(baseURL, "api/repos/" + installationId, HandleResponseRepoNames));

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
            Debug.Log(installationId);
            Debug.Log("--IS THIS THE EMPTY LIST? buttonHost click IF LOGIC--");
            Debug.Log(installationRepoNames);
            isHost = true;
            //projects = new List<string> { "repo-one", "repo-two", "repo-three" };
            // Doing API call to GET REPOS here!
            // StartCoroutine(MakeRequest(baseURL, "api/repos/" + installationId, HandleResponseRepoNames));
            dropdown.choices.Clear();
            //dropdown.choices = projects;

            // TODO: ******** HERE IS WHERE TO PICK BACK UP *********
            // NO ERRORS, BUT DROP DOWN SELECT IS NOT POPULATING
            // UNITY HAS RECEIVED CORRECT REPO DATA (correct data type?) (rm JSON utility so is deserializing correctly?)
            Debug.Log("Dropdown about to be populated:");
            foreach (var name in installationRepoNames)
            {
                Debug.Log(name);
            }
            dropdown.choices = installationRepoNames;
            buttonCreate.clicked += () =>
            {
                // This value will be the chosen repo
                selectedRepoName = dropdown.text;
                var selectedIndex = installationRepoNames.FindIndex(repo => repo == selectedRepoName);
                // TODO: this using installationReposData is close, but that prop will need a class since it is an array of Objs (json?)
                // selectedRepoId = installationReposData.Find(repo => repo.name = selectedRepoName);
                selectedRepoId = installationReposIds[selectedIndex];

                Debug.Log($"REPO: {selectedRepoName}");

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
        public List<string> installationRepoNames;
        public List<string> installationReposIssuesUrls;
        // public List<string> installationReposData; // TODO: this isn't going to be just an array of strings.. needs List<class>?
        public List<string> backlog;
    }
    private class HttpData
    {
        public readonly string repoNames;
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
    /// </summary>
    IEnumerator MakeRequest(string url, string endpoint, Action<string> handleResponse)
    {
        using(UnityWebRequest www = UnityWebRequest.Get(baseURL + endpoint))
        {
            yield return www.SendWebRequest();

            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError("Error: " + www.error);
            }
            else
            {
                string responseData = www.downloadHandler.text;
                Debug.Log("RIGHT BEFORE http handler CALLBACK");
                Debug.Log(responseData);

                // HttpData _responseDTO = JsonUtility.FromJson<HttpData>(responseData);

                // if (_responseDTO != null)
                // {
                //     handleResponse?.Invoke(_responseDTO.repoNames);
                // }

                // TODO: try making parent scope async and await handleResponse.Invoke call
                handleResponse?.Invoke(responseData);
                StartUI();
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
            installationRepoNames = new List<string>(responseRepoNames);
            Debug.Log("Installation Repo Names SUCCESS:" + string.Join(", ", installationRepoNames));
            #endregion STRINGS

            // HttpData _responseDTO = JsonConvert.DeserializeObject<HttpData>(responseData);

            // Remove leading and trailing whitespace characters from each string (NOT NEEDED?)
            // for (int i = 0; i < repoNamesArray.Length; i++)
            // {
            //     repoNamesArray[i] = repoNamesArray[i].Trim();
            // }

            // installationRepoNames = new List<string>(_responseDTO.repoNames);

            foreach (var item in installationRepoNames)
            {
                Debug.Log("List is Populated:" + item);
            }
            Debug.Log("Installation Repo Names SUCCESS:" + string.Join(", ", installationRepoNames));
        }
        catch (Exception e)
        {
            Debug.LogError("JsonUtility failure:" + e);
            throw;
        }
    }
    #endregion HTTP_REQUESTS

}
