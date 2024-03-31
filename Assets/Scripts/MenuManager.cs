using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.UI;
using UnityEngine.UIElements;

public class MenuManager : VisualElement
{
    // The menu manager allows us to have one scene with multiple views
    // we can switch between easily by showing / hiding different UI containers
    // and querying those containers to get access to individual elements

    SceneController sceneController;

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
        sceneController = SceneController.FindObjectOfType<SceneController>();
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

        // CLICK EVENTS
        m_NavBar?.Q("HostButton")?.RegisterCallback<ClickEvent>(async e => {
            // Set the visibility of the host container to visible
            m_HostContainer.style.visibility = Visibility.Visible;

            // Make the HTTP Request to the backend
            var endpoint = $"api/repos/{Store.installationId}";
            List<string> repoNames = await Utilities.GetRepoNames(endpoint);

            // Populate dropdown menu with repo names
            var dropdown = m_HostContainer?.Q<DropdownField>("ProjectDropdownField");
            dropdown.choices.Clear();
            dropdown.choices = repoNames;
        });

        m_NavBar?.Q("JoinButton")?.RegisterCallback<ClickEvent>(e => m_JoinContainer.style.visibility = Visibility.Visible);

        m_HostContainer?.Q("HostLobbyButton")?.RegisterCallback<ClickEvent>(e => {
            // Call CreateLobby()
            // Add lobby id to lobby
            // Add icon next to lobby id to copy the id to clipboard
        });

        m_JoinContainer?.Q("JoinLobbyButton")?.RegisterCallback<ClickEvent>(e => {
            var inviteCode = m_JoinContainer?.Q<TextField>("JoinTextField").text;
            // TODO: Add additional validation checks
            if (inviteCode.Length == 5)
            {
                Store.inviteCode = inviteCode;
                // Call JoinLobby()
                // Add player name to room in view
            }
            // ELSE: Have the user re-enter invite code
        });

        m_Lobby?.Q("StartGameButton")?.RegisterCallback<ClickEvent>(e => {
            // Hide all UI elements other than topbar
            // GET backlog
        });

        // CHANGE EVENTS
        m_HostContainer?.Q<DropdownField>("ProjectDropdownField").RegisterCallback<ChangeEvent<string>>(e => {
            Store.repoName = e.newValue;
            Debug.Log("Selected value: " + Store.repoName);
        });
    }
}
