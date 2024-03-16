using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

public class MenuManager : VisualElement
{
    SceneController sceneController;

    #region Screens
    VisualElement ScrumPokerUI_Title;
    VisualElement ScrumPokerUI_Host;
    VisualElement ScrumPokerUI_Join;
    VisualElement ScrumPokerUI_Lobby;

    #endregion Screens

    public new class UxmlFactory : UxmlFactory<MenuManager, UxmlTraits> { }
    public new class UxmlTraits : VisualElement.UxmlTraits { }

    public MenuManager() 
    { 
        sceneController = SceneController.FindObjectOfType<SceneController>();
        this.RegisterCallback<GeometryChangedEvent>(OnGeometryChange);
    }

    private void OnGeometryChange(GeometryChangedEvent e)
    {
        // Assign Screens
        ScrumPokerUI_Title = this.Q("Title");
        ScrumPokerUI_Host = this.Q("Host");
        ScrumPokerUI_Join = this.Q("Join");
        ScrumPokerUI_Lobby = this.Q("Lobby");
    }
}
