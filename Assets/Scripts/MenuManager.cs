using System;
using System.Collections;
using System.Collections.Generic;
using System.Net;
using UnityEngine;
using UnityEngine.Networking;
// using UnityEngine.UI;
using UnityEngine.UIElements;

public class MenuManager : VisualElement
{
    // The menu manager allows us to have one scene with multiple views
    // we can switch between easily by showing / hiding different UI containers
    // and querying those containers to get access to individual elements

    // public Store store;

    #region Screens

    VisualElement m_Screen;
    VisualElement m_TitleBar;
    VisualElement m_Title;
    VisualElement m_NavBar;

    VisualElement m_CenterContainer;
    VisualElement m_Main;
    VisualElement m_HostContainer;
    VisualElement m_JoinContainer;
    VisualElement m_Lobby;
    VisualElement m_LobbyIdContainer;

    #endregion Screens

    #region Buttons

    // NAVBAR
    /*    Button b_HostButton;
        Button b_JoinButton;
        Button b_SettingsButton;
        Button b_AboutButton;
        Button b_FAQButton;*/

    // LOBBY
/*    Button b_HostLobbyButton;
    Button b_JoinLobbyButton;
    Button b_StartGameButton;*/

    #endregion Buttons

    public new class UxmlFactory : UxmlFactory<MenuManager, UxmlTraits> { }
    public new class UxmlTraits : VisualElement.UxmlTraits { }

    public MenuManager() 
    { 
        // sceneController = SceneController.FindObjectOfType<SceneController>();
        this.RegisterCallback<GeometryChangedEvent>(OnGeometryChange);
    }

    private void OnGeometryChange(GeometryChangedEvent e)
    {
        // ASSIGN SCREENS
        m_Screen = this.Q("Screen");
        m_TitleBar = this.Q("TitleBar");
        m_Title = this.Q("Title");
        m_NavBar = this.Q("NavBar");
        m_CenterContainer = this.Q("CenterContainer");
        m_Main = this.Q("Main");
        m_HostContainer = this.Q("HostContainer");
        m_JoinContainer = this.Q("JoinContainer");
        m_Lobby = this.Q("Lobby");
        m_LobbyIdContainer = this.Q("LobbyIdContainer");

        // CLICK EVENTS
        m_NavBar?.Q("HostButton")?.RegisterCallback<ClickEvent>(async e => {
            // Set the visibility of the host container to visible
            m_HostContainer.style.visibility = Visibility.Visible;

            // Make the HTTP Request to the backend for repo names and owner id
            var endpoint = "api/repos/names/";
            List<string> repoNames = await Utilities.GetRepoNamesAndSetOwnerId(endpoint, new string[] { "name", "owner_id" });

            // Populate dropdown menu with repo names
            var dropdown = m_HostContainer?.Q<DropdownField>("ProjectDropdownField");
            dropdown.choices.Clear();
            dropdown.choices = repoNames;

            // GET user data (userName, avatar)
/*            endpoint = "api/users/";
            Dictionary<string, string> userData = await Utilities.GetUserData(endpoint, new string[] { "name", "avatar_url" });

            if (userData != null)
            {
                Store.avatar = userData["avatar_url"];
                Store.userName = userData["name"];
            }
            Debug.Log("AVATAR_URL: " + Store.avatar);
            Debug.Log("USERNAME: " + Store.userName);*/
        });

        m_NavBar?.Q("JoinButton")?.RegisterCallback<ClickEvent>(e =>
        {
            m_JoinContainer.style.visibility = Visibility.Visible;
        });

        m_NavBar?.Q("LoginButton")?.RegisterCallback<ClickEvent>(async e =>
        {
            // TODO: Write a function to GET the CLIENT_ID from the server (if it cannot be accessed via GetEnvironmentVariable in Unity)
            string clientId = System.Environment.GetEnvironmentVariable("CLIENT_ID");
            Debug.Log("CLIENT_ID: " + clientId);

            var CLIENT_ID = "bc388b03d7ee8a62013c";
            string authURL = $"https://github.com/login/oauth/authorize?client_id={CLIENT_ID}";

            Application.OpenURL(authURL);
        });

        m_HostContainer?.Q("HostLobbyButton")?.RegisterCallback<ClickEvent>(async e => {
            // Create room via GUID
            var guid = Guid.NewGuid().ToString().Substring(0, 5);
            Store.roomId = guid;
            Debug.Log("ROOMID: " + Store.roomId);

            // Send websocket event to create room
            WebSocketConnection.CreateRoom();

            // Make the HTTP Request to the backend for issues backlog
            var endpoint = "api/issues/";
            object[] backlog = await Utilities.GetRepoIssues(endpoint, new string[] { "name", "owner_id" });
            Store.issues = backlog;
            Debug.Log("ISSUES: " + Store.issues);

            // Add lobby id and button to copy lobby id to lobby
            m_LobbyIdContainer.style.visibility = Visibility.Visible;
            var lobbyText = m_LobbyIdContainer?.Q<Label>("LobbyId");
            lobbyText.text = Store.roomId;
            Debug.Log(lobbyText.text);

            // Set "start game" button's visibility to visible 
            var startGame = m_Lobby?.Q("StartGameButton");
            startGame.style.visibility = Visibility.Visible;
        });

        // Add Lobby Id to user's clipboard onClick
        m_LobbyIdContainer?.Q("CopyButton")?.RegisterCallback<ClickEvent>(e => {
            GUIUtility.systemCopyBuffer = Store.roomId;
            var copyButton = m_LobbyIdContainer?.Q<Button>("CopyButton");
            copyButton.text = "copied!";
        });

        m_JoinContainer?.Q("JoinLobbyButton")?.RegisterCallback<ClickEvent>(e => {
            var inviteCode = m_JoinContainer?.Q<TextField>("JoinTextField").text;
            // TODO: Add additional validation checks
            if (inviteCode.Length == 5)
            {
                Store.roomId = inviteCode;
                WebSocketConnection.JoinRoom();
                // TODO: Add player name and avatar to room in view via socket event
                // TODO: Add user objects to data["params"]["users"] array
                // TODO: Add userId to those user objects
                var participants = m_Lobby?.Q<ScrollView>("ParticipantsScrollView");
                var newLabel = new Label();
                newLabel.name = Store.installationId.ToString();
                newLabel.text = Store.installationId.ToString();
                participants.Add(newLabel);
            }
            // ELSE: Have the user re-enter invite code
        });

        m_Lobby?.Q("StartGameButton")?.RegisterCallback<ClickEvent>(e => {
            // TODO: Hide all UI elements other than topbar
            // TODO: Load game UI elements
        });

        // CHANGE EVENTS
        m_HostContainer?.Q<DropdownField>("ProjectDropdownField").RegisterCallback<ChangeEvent<string>>(e => {
            Store.repoName = e.newValue;
            Debug.Log("Selected value: " + Store.repoName);
        });
    }

    private void AddParticipantToLobby()
    {
        var participants = m_Lobby?.Q<ScrollView>("ParticipantsScrollView");
        var newLabel = new Label();
        newLabel.name = Store.installationId.ToString();
        newLabel.text = Store.installationId.ToString();
        participants.Add(newLabel);
    }

}
