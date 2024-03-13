using UnityEngine;
using NativeWebSocket;
using System;
using TMPro;
using Newtonsoft.Json;

public class CreateLobby : MonoBehaviour
{
    public class Data
    {
        [JsonProperty("type")]
        public string Type {  get; set; }

        [JsonProperty("params")]
        public Params Params { get; set; }
    }
    public class Params
    {
        public Params()
        {
            // TODO: Add conditional to either create roomId or set via join.text
        }
        public string roomId;
        public string userId;
    }

    // private List<string> users; 

    [SerializeField] private TMP_InputField lobby;
    [SerializeField] private TextMeshProUGUI greeting;
    [SerializeField] private TMP_InputField join;
    [SerializeField] private TMP_InputField leave;
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
        // TODO: Add better data validation
        if (join.text.Length == 5)
        {
            JoinRoom();
        }
    }

    public void OnLeaveClick()
    {
        // TODO: Add better data validation
        if (join.text.Length == 5)
        {
            LeaveRoom();
        }
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
                    userId = WebSocketConnection.userId,
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
                    roomId = join.text,
                    userId = WebSocketConnection.userId
                }
            };
            string json = JsonConvert.SerializeObject(data);
            Debug.Log("join" + json);
            await WebSocketConnection.ws.SendText(json);
        }
    }

    async void LeaveRoom()
    {
        if (WebSocketConnection.ws.State == WebSocketState.Open)
        {
            var data = new Data
            {
                Type = "leave",
                Params = new Params
                {
                    roomId = leave.text,
                    userId = WebSocketConnection.userId
                }
            };
            string json = JsonConvert.SerializeObject(data);
            Debug.Log("leave" + json);
            await WebSocketConnection.ws.SendText(json);
        }
    }
}
