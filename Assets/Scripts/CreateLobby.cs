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

    [SerializeField] private TMP_InputField _lobby;
    [SerializeField] private TextMeshProUGUI greeting;
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

    public void OnButtonClick()
    {
        CreateRoom();
        _lobby.text = roomId;
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
}
