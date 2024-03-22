using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UIElements;
using NativeWebSocket;
using System.Linq;
using Unity.VisualScripting;

public class SceneController : MonoBehaviour
{
    private static SceneController instance;
    private static string code;
    private static bool isHost;
    private static List<string> participants;

    private List<string> projects;
    private string roomId = GUIDGenerator.guid;
    public static int installationId;
    public static string selectedRepoName;
    public static int selectedRepoId;
    public static List<int> installationReposIds; // = WebSocketConnection.installationReposIds;
    public static List<string> installationRepoNames; // = WebSocketConnection.installationRepoNames;
    public static List<string> installationReposIssuesUrls; // = WebSocketConnection.installationReposIssuesUrls;
    public static List<string> installationReposData; // TODO: needs List<class> not List<string>, come from WSConnection
    public static List<string> backlog; // TODO: List<string>

    void Start()
    {
        string fullURL = Application.absoluteURL;

        string queryString = fullURL.Substring(fullURL.IndexOf('?') + 1);

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
                    installationId = result; // TODO: use TryParse instead
                } else {
                    Debug.Log("FUCK UYOU");
                }
                break;
            }
        }
    }

    private void Awake()
    {
        if (instance != null && instance != this)
        {
            Destroy(gameObject);
            return;
        }
        DontDestroyOnLoad(gameObject);
    }

    private void OnEnable()
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
            Debug.Log(installationRepoNames);
            isHost = true;
            // Do API call to GET REPOS here!
            //projects = new List<string> { "repo-one", "repo-two", "repo-three" }; // Replace with REPO data!
            dropdown.choices.Clear();
            //dropdown.choices = projects;
            dropdown.choices = installationRepoNames; // TODO: .ToList() ?
            buttonCreate.clicked += () =>
            {
                // This value will be the chosen repo
                //var repo = dropdown.text;
                selectedRepoName = dropdown.text;
                var selectedIndex = installationRepoNames.FindIndex(repo => repo == selectedRepoName);
                // TODO: this using installationReposData is close, but that prop will need a class since it is an array of Objs (json?)
                // selectedRepoId = installationReposData.Find(repo => repo.name = selectedRepoName);
                selectedRepoId = installationReposIds[selectedIndex];
                //selectedRepoId = dropdown
                Debug.Log($"REPO: {selectedRepoName}");

                CreateRoom();
                // Do API call to GET backlog for chosen repo here!
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
        public List<string> installationReposData; // TODO: this isn't going to be just an array of strings.. needs List<class>?
        public List<string> backlog;
    }

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
}
