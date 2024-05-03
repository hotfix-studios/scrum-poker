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
    public static bool isHost = false;
    public static int id;
    public static string avatar;
    public static string fullName;
    public static List<string> repoNames;
    public static string repoName;
    public static int repoOwnerId;
    public static string roomId;
    public static object[] issues;

    /*    public class Host
        {
            public string hostName;
        }*/

    public class Participant
    {
        public bool isHost;
        public int id;
        public string roomId;
        public string fullName;
        public string avatar;
    }

    public static List<Participant> participants;

    // HTTP && DTOS

    public class User
    {
        public int _id;
        public string name;
        public string avatar_url;
    }

    public class Repository
    {
        public int _id;
        public string full_name;
        public int owner_id;
        public string description;
        public string language;
        public int open_issues_count;
    }

    public class Issue
    {
        public int _id;
        public string title;
        public int number;
        public string[] labels;
        public string body;
        public bool pointed;
    }

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

        // POST code to the server and GET user data
        if (code != null)
        {
            Debug.Log("CODE: " + code);
            StartCoroutine(Utilities.PostCode(code));
        }

    }

    // DELEGATES && EVENTS
    public delegate void ParticipantsAdded(Store.Participant participant);
    public static event ParticipantsAdded OnParticipantsAdded;

    public static void AddParticipant(Store.Participant participant)
    {
        OnParticipantsAdded?.Invoke(participant);
    }

    public delegate void ParticipantsRemoved(Store.Participant participant);
    public static event ParticipantsRemoved OnParticipantsRemoved;

    public static void RemoveParticipant(Store.Participant participant)
    {
        OnParticipantsRemoved?.Invoke(participant);
    }
}
