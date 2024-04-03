using UnityEngine;
using NativeWebSocket;
using Newtonsoft.Json;
using System.Collections.Generic;

public class WebSocketConnection : MonoBehaviour
{
    private static WebSocketConnection instance;
    public static WebSocket ws;
    /* incoming from SceneController/Browser */
    private int installationId = SceneController.installationId;
    public string selectedRepoName = SceneController.selectedRepoName;
    public int selectedRepoId = SceneController.selectedRepoId;
    /* outgoing to SceneController from Node Server send */
    public static List<int> installationReposIds; // = SceneController.installationReposIds;
    public static List<string> installationReposNames; // = SceneController.installationRepoNames;
    public static List<string> installationReposIssuesUrls; // = SceneController.installationReposIssuesUrls;
    // public static List<string> installationReposData; // = SceneController.installationReposData;
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
        public List<string> installationReposNames;
        public List<string> installationReposIssuesUrls;
        // public List<string> installationReposData; // TODO: needs to be List<class>
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
            Debug.Log("Installation ID from Params ws.OnOpen: sending with ws.SendText(json)");
            string json = JsonConvert.SerializeObject(data);
            Debug.Log("Serialized object to send:");
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
                    Debug.Log("On Init, WebsocketConnection.cs - Params:");
                    installationId = json.Params.installationId;
                    Debug.Log(installationId);
                    break;
                case "create":
                    // create (params);
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

        // TODO: move to top, right below ws instantiation?
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