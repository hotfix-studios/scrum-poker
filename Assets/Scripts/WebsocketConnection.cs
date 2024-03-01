using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

using NativeWebSocket;

public class WebSocketConnection : MonoBehaviour
{
    WebSocket ws;

    async void Start()
    {
        ws = new WebSocket("ws://localhost:3001");

        ws.OnOpen += () =>
        {
            Debug.Log("Connection open!");
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
            Debug.Log($"Message received from server containing: {bytes}");

            // Getting the message as a string
            var message = System.Text.Encoding.UTF8.GetString(bytes);
            Debug.Log($"Message reads: {message}");
        };

        // Keep sending messages at every 0.3s
        InvokeRepeating("SendWebSocketMessage", 0.0f, 0.3f);

        // waiting for messages
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

            // Sending plain text
            await ws.SendText("plain text message");
        }
    }

    private async void OnApplicationQuit()
    {
        await ws.Close();
    }

}