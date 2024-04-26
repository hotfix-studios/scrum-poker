using UnityEngine;
using NativeWebSocket;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Linq;

public class WebSocketConnection : MonoBehaviour
{
    private static WebSocketConnection instance;
    public static WebSocket ws;

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
        public int id;
        public string userName;
        public string avatar;
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
            Debug.Log("INIT: Websocket Connection Open (CLIENT)");
            var data = new Data
            {
                Type = "init",
            };
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
                    break;
                case "create":
                    break;
                case "join":
                    OnJoin(Params);
                    break;
                case "leave":
                    break;
                default:
                    Debug.Log($"Type: ${type} unknown");
                    break;
            }

            Debug.Log($"Message received from server containing: {bytes}");
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

    public static async void CreateRoom()
    {
        if (ws.State == WebSocketState.Open)
        {
            var data = new Data
            {
                Type = "create",
                Params = new Params
                {
                    roomId = Store.roomId,
                    id = Store.id,
                }
            };
            string json = JsonConvert.SerializeObject(data);
            Debug.Log("create" + json);
            await ws.SendText(json);
        }
    }

    public static async void JoinRoom()
    {
        if (ws.State == WebSocketState.Open)
        {
            var data = new Data
            {
                Type = "join",
                Params = new Params
                {
                    roomId = Store.roomId,
                    id = Store.id
                }
            };
            string json = JsonConvert.SerializeObject(data);
            Debug.Log("join" + json);
            await ws.SendText(json);
        }
    }

    public void OnJoin(Params Params)
    {
        Store.AddParticipant(Params);

        // Store.participants = Store.participants.Concat(new object[] { Params }).ToArray();
        // Debug.Log("ONJOIN: " + Store.participants[0]);

        // Loop through Store.participants
        // If user being received in join event does not exist
        // add it to Store.participants
        // create UI elements: Label.name = Store.userName, Label.text = Store.userName, Image.src = Store.avatar
    }

    /*
    public static async void Bet()
    {
        if (ws.State == WebSocketState.Open)
        {
            var data = new Data
            {
                Type = "bet",
                Params = new Params
                {
                    roomId = Store.roomId,
                    id = Store.id,
                    betAmount = betAmount
                }
            };
            string json = JsonConvert.SerializeObject(data);
            await ws.SendText(json);
        }
    }
    */

}