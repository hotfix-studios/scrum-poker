using UnityEngine;
using NativeWebSocket;
using System;
using TMPro;
using Newtonsoft.Json;

public class CreateLobby : MonoBehaviour
{
    public class Data
    {
        public string type {  get; set; }

        [JsonProperty("params")]
        public Params Params { get; set; }
    }
    public class Params
    {
        public string roomId;
        public string userId;
    }

    // private List<string> users; 

    [SerializeField] private TMP_InputField lobby;
    [SerializeField] private TextMeshProUGUI greeting;
    [SerializeField] private TMP_InputField join;
    private string roomId = Guid.NewGuid().ToString().Substring(0, 5);

    private void Update()
    {
        if (WebSocketConnection.userId != null)
        {
            if (!greeting.text.Contains(WebSocketConnection.userId))
            {
                greeting.text += WebSocketConnection.userId;
            }
        }
    }

    public void OnCreateClick()
    {
        CreateRoom();
        lobby.text = roomId;
    }

    public void OnJoinClick()
    {
        if (join.text.Length == 5)
        {
            JoinRoom();
        }
    }

    async void CreateRoom()
    {
        if (WebSocketConnection.ws.State == WebSocketState.Open)
        {
            var data = new Data
            {
                type = "create",
                Params = new Params
                {
                    roomId = roomId,
                    userId = WebSocketConnection.userId
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
                type = "join",
                Params = new Params
                {
                    roomId = join.text,
                    userId = WebSocketConnection.userId
                }
            };
            string json = JsonConvert.SerializeObject(data);
            Debug.Log("create" + json);
            await WebSocketConnection.ws.SendText(json);
        }
    }
}
