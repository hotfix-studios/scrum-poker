using System.Collections.Generic;
using UnityEngine;
using Newtonsoft.Json.Linq;
using Unity.VisualScripting;
// using static Store;

public class Store : MonoBehaviour
{
    // The store is our centralized data hub for state variables we will
    // need access to across multiple files for the game's duration

    private static Store instance;

    // GLOBAL STATE VARIABLES
    public static string clientId = "bc388b03d7ee8a62013c";
    public static string scopes = "repo,project,read:user";
    public static string code;
    public static string token;
    public static int? installationId;
    public static string repoName;
    public static int repoOwnerId;
    public static string roomId;
    public static object[] issues;
    public static string avatar;
    public static string userName;

    // public static object[] participants;
    public static List<object> participants;

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

        // POST code to the server
        if (code != null)
        {
            StartCoroutine(Utilities.PostCode(code));
        }

        if (token != null)
        {
            Debug.Log("TOKEN: " + token);
        }

        // installationId = Utilities.GetInstallationID();

        // POST installationId to the server
        // StartCoroutine(Utilities.PostInstallationId(installationId));

    }

/*    async public static void GetUser()
    {
        var endpoint = "api/users/";
        Dictionary<string, string> userData = await Utilities.GetUserData(endpoint, new string[] { "name", "avatar_url" });

        if (userData != null)
        {
            avatar = userData["avatar_url"];
            userName = userData["name"];
        }
        Debug.Log("AVATAR_URL: " + avatar);
        Debug.Log("USERNAME: " + userName);
    }*/

    // DELEGATES && EVENTS
    public delegate void ParticipantsChanged();
    public static event ParticipantsChanged OnParticipantsChanged;

    public static void AddParticipant(object participant)
    {
        participants.Add(participant);
        OnParticipantsChanged?.Invoke();
    }

}
