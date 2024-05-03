using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

public class MenuManager : VisualElement
{
    // The menu manager allows us to have one scene with multiple views
    // we can switch between easily by showing / hiding different UI containers
    // and querying those containers to get access to individual elements

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
    VisualElement m_LobbyHostContainer;
    #endregion Screens

    public new class UxmlFactory : UxmlFactory<MenuManager, UxmlTraits> { }
    public new class UxmlTraits : VisualElement.UxmlTraits { }

    public MenuManager()
    {
        this.RegisterCallback<GeometryChangedEvent>(OnGeometryChange);
        Store.OnParticipantsAdded += AddParticipantToLobby;
        Store.OnParticipantsRemoved += RemoveParticipantFromLobby;
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
        m_LobbyHostContainer = this.Q("LobbyHostContainer");

        if (Store.code != null)
        {
            var host = m_NavBar?.Q("HostButton");
            host.style.display = DisplayStyle.Flex;
            var join = m_NavBar?.Q("JoinButton");
            join.style.display = DisplayStyle.Flex;
        }

        // CLICK EVENTS
        m_NavBar?.Q("HostButton")?.RegisterCallback<ClickEvent>(async e =>
        {
            // Set the visibility of the host container to visible
            // m_HostContainer.style.visibility = Visibility.Visible;

            if (m_JoinContainer.style.display != DisplayStyle.None)
            {
                m_JoinContainer.style.display = DisplayStyle.None;
            }
            m_HostContainer.style.display = DisplayStyle.Flex;

            if (Store.repoNames == null)
            {
                // Make the HTTP Request to the backend for repo names and owner id
                var endpoint = "api/repos/";
                Store.repoNames = await Utilities.GetRepos(endpoint);
            }

            // Populate dropdown menu with repo names
            var dropdown = m_HostContainer?.Q<DropdownField>("ProjectDropdownField");
            dropdown.choices.Clear();
            dropdown.choices = Store.repoNames;
        });

        m_NavBar?.Q("JoinButton")?.RegisterCallback<ClickEvent>(e =>
        {
            // m_JoinContainer.style.visibility = Visibility.Visible;

            if (m_HostContainer.style.display != DisplayStyle.None)
            {
                m_HostContainer.style.display = DisplayStyle.None;
            }
            m_JoinContainer.style.display = DisplayStyle.Flex;
        });

        m_NavBar?.Q("LoginButton")?.RegisterCallback<ClickEvent>(e =>
        {
            // When navigating to login, authorize with GitHub and reload application
            string authURL = $"https://github.com/login/oauth/authorize?client_id={Store.clientId}&scope={Store.scopes}";
            Application.OpenURL(authURL);

            if (Store.fullName == null)
            {
                // TODO: Navigate user to profile to enter first and last name
                Debug.Log("User is missing value for fullName field");
            }
        });

        m_HostContainer?.Q("HostLobbyButton")?.RegisterCallback<ClickEvent>(async e => {
            Store.isHost = true;

            // Create room via GUID
            var guid = Guid.NewGuid().ToString().Substring(0, 5);
            Store.roomId = guid;
            Debug.Log("ROOMID: " + Store.roomId);

            // Send websocket event to create room
            WebSocketConnection.CreateRoom();

            // Make the HTTP Request to the backend for issues backlog
            var endpoint = "api/issues/";
            object[] backlog = await Utilities.GetRepoIssues(endpoint);
            Store.issues = backlog;
            Debug.Log("ISSUES: " + Store.issues);

            var hostText = m_LobbyHostContainer?.Q<Label>("HostText");
            var hostName = Store.fullName;
            hostText.text = $"{hostName}'s Lobby";
            m_LobbyHostContainer.style.display = DisplayStyle.Flex;

            // Add lobby id and button to copy lobby id to lobby
            // m_LobbyIdContainer.style.visibility = Visibility.Visible;
            m_LobbyIdContainer.style.display = DisplayStyle.Flex;
            var lobbyText = m_LobbyIdContainer?.Q<Label>("LobbyId");
            lobbyText.text = Store.roomId;
            Debug.Log(lobbyText.text);

            // Set "start game" button's visibility to visible
            var startGame = m_Lobby?.Q("StartGameButton");
            // startGame.style.visibility = Visibility.Visible;
            startGame.style.display = DisplayStyle.Flex;
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

    public void AddParticipantToLobby(Store.Participant participant)
    {
        var participants = m_Lobby?.Q<ScrollView>("ParticipantsScrollView");

        /*        foreach (var participant in Store.participants)
                {
                    var id = participant.id.ToString();
                    Label label = participants.Q<Label>($"{id}");

                    if (label == null)
                    {
                        var newLabel = new Label();
                        newLabel.name = id;
                        newLabel.text = participant.fullName;
                        participants.Add(newLabel);
                    }
                }*/

        var newLabel = new Label();
        newLabel.name = participant.id.ToString();
        newLabel.text = participant.fullName;
        participants.Add(newLabel);
    }

    public void RemoveParticipantFromLobby(Store.Participant participant)
    {
        var participants = m_Lobby?.Q<ScrollView>("ParticipantsScrollView");
        var content = participants.Children();
        var id = participant.id.ToString();

        foreach (Label label in content)
        {
            if (id == label.name)
            {
                participants.Remove(label);
            }
        }
    }

    public void AddLobbyNameToLobby()
    {
        var hostText = m_LobbyHostContainer.Q<Label>("HostText");
        var hostName = "Hardcoded";
        hostText.text = $"{hostName}'s Lobby";
        m_LobbyHostContainer.style.display = DisplayStyle.Flex;
    }
}
