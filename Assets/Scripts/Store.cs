using System.Collections.Generic;
using UnityEngine;

public class Store : MonoBehaviour
{
    // The store is our centralized data hub for state variables we will
    // need access to across multiple files for the game's duration

    private static Store instance;

    // GLOBAL STATE VARIABLES

    // SESSION
    public static string clientId = "bc388b03d7ee8a62013c";
    public static string scopes = "repo,project,read:user";
    public static string code;

    // USER && ROOM
    public static int id;
    public static string avatar;
    public static string fullName;
    public static string repoName;
    public static int repoOwnerId;
    public static string roomId;
    public static object[] issues;

    public class User
    {
        public int id;
        public string fullName;
        public string avatar;
    }
    public static List<User> participants;

    void Awake()
    {
        if (instance != null && instance != this)
        {
            Destroy(gameObject);
            return;
        }
        instance = this;
        DontDestroyOnLoad(gameObject);

        code = Utilities.GetCode();
        Debug.Log("CODE: " + code);

        // POST code to the server and GET user data
        if (code != null)
        {
            StartCoroutine(Utilities.PostCode(code));
        }

    }

    // DELEGATES && EVENTS
    public delegate void ParticipantsChanged();
    public static event ParticipantsChanged OnParticipantsChanged;

    public static void AddParticipant(User participant)
    {
        participants.Add(participant);
        OnParticipantsChanged?.Invoke();
    }

}
