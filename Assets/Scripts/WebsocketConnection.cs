using UnityEngine;
using NativeWebSocket;
using Newtonsoft.Json;

public class WebSocketConnection : MonoBehaviour
{
    public static WebSocket ws;
    public static string userId;
    public class Data
    {
        public string type { get; set; }

        [JsonProperty("params")]
        public Params Params { get; set; }
    }
    public class Params
    {
        public string roomId;
        public string userId;
    }

    async void Start()
    {
        ws = new WebSocket("ws://localhost:3001");

        ws.OnOpen += () =>
        {
            Debug.Log("Connection open!");
            var data = new Data
            {
                type = "init"
            };
            string json = JsonConvert.SerializeObject(data);
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
            string type = json.type;
            Params Params = json.Params;

            switch (type)
            {
                case "init":
                    // init (params);
                    userId = json.Params.userId;
                    Debug.Log(userId);
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
            Debug.Log($"User: {userId}");
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