using UnityEngine;
using NativeWebSocket;
using Newtonsoft.Json;
using System.Collections.Generic;

public class WebSocketConnection : MonoBehaviour
{
    private static WebSocketConnection instance;
    public static WebSocket ws;
    public static int installationId = SceneController.installationId;
    public static string selectedRepoName = SceneController.selectedRepoName;
    public static int selectedRepoId = SceneController.selectedRepoId;
    public static List<int> installationReposIds = SceneController.installationReposIds;
    public static List<string> installationRepoNames = SceneController.installationRepoNames;
    public static List<string> installationReposIssuesUrls = SceneController.installationReposIssuesUrls;
    public static List<string> installationReposData = SceneController.installationReposData; // TODO: needs List<class>
    public static List<string> backlog;

    public class Data
    {
        // TODO: Ensure consistency across scripts
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
        public List<string> installationReposData; // TODO: needs to be List<class>
        public List<string> backlog;
    }

    async void Awake()
    {
        if (instance != null && instance != this)
        {
            Destroy(gameObject);
            return;
        }

        instance = this;
        DontDestroyOnLoad(gameObject);

        ws = new WebSocket("ws://localhost:3001");

        ws.OnOpen += () =>
        {
            Debug.Log("Connection open!");
            var data = new Data
            {
                Type = "init",
                Params = new Params
                {
                    installationId = installationId
                }
            };
            Debug.Log(data.Params);
            string json = JsonConvert.SerializeObject(data);
            Debug.Log(json);
            ws.SendText(json);
        };

        ws.OnError += (e) =>
        {
            Debug.Log("Error! " + e);
        };

        ws.OnClose += (e) =>
        {
            Debug.Log("Connection closed!");
        };

        ws.OnMessage += (bytes) =>
        {
            string message = System.Text.Encoding.UTF8.GetString(bytes);
            Data json = JsonConvert.DeserializeObject<Data>(message);
            string type = json.Type;
            Params Params = json.Params;
            Debug.Log("WebsocketConnection inside we.OnMessage, Params:");
            Debug.Log(Params);

            switch (type)
            {
                case "init":
                    // init (params);
                    Debug.Log("On Init, WebsocketConnection.cs");
                    installationId = json.Params.installationId;
                    Debug.Log(json.Params.installationId);
                    Debug.Log(installationId);
                    installationReposIds = new List<int>(json.Params.installationReposIds);
                    Debug.Log(json.Params.installationReposIds);
                    Debug.Log(installationReposIds);
                    // installationRepoNames = json.Params.installationRepoNames;
                    installationRepoNames = new List<string>(json.Params.installationRepoNames);
                    Debug.Log(json.Params.installationRepoNames);
                    Debug.Log(installationRepoNames);
                    installationReposIssuesUrls = new List<string>(json.Params.installationReposIssuesUrls);
                    Debug.Log(json.Params.installationReposIssuesUrls);
                    Debug.Log(installationReposIssuesUrls);
                    Debug.Log(installationId);
                    break;
                case "create":
                    // create (params);
                    // assign backlog to class member
                    break;
                case "join":
                    //join (params);
                    break;
                case "leave":
                    //leave (params);
                    break;
                default:
                    Debug.Log($"Type: ${type} unknown");
                    break;
            }

            Debug.Log($"Message received from server containing: {bytes}");
            Debug.Log($"User: {installationId}");
        };

        await ws.Connect();

    }

    void Update()
    {
#if !UNITY_WEBGL || UNITY_EDITOR
        ws.DispatchMessageQueue();
#endif
    }

    async void SendWebSocketMessage()
    {
        if (ws.State == WebSocketState.Open)
        {
            // Sending bytes
            // await ws.Send(new byte[] { 10, 20, 30 });

            // Sending stringified JSON or plain text
            await ws.SendText("Use this function to send stringified JSON");
        }
    }

    private async void OnApplicationQuit()
    {
        await ws.Close();
    }

}