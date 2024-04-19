using System.Collections.Generic;
using UnityEngine;
using Newtonsoft.Json.Linq;

public class Store : MonoBehaviour
{
    // The store is our centralized data hub for state variables we will
    // need access to across multiple files for the game's duration

    private static Store instance;

    // GLOBAL STATE VARIABLES
    public static int? installationId;
    public static string repoName;
    public static int repoOwnerId;
    public static string roomId;
    public static object[] issues;
    public static string avatar;
    public static string userName;

    void Awake()
    {
        if (instance != null && instance != this)
        {
            Destroy(gameObject);
            return;
        }
        instance = this;
        DontDestroyOnLoad(gameObject);

        installationId = Utilities.GetInstallationID();

        // POST installationId to the server
        StartCoroutine(Utilities.PostInstallationId(installationId));

        // GET user data (userName, avatar)
        GetUser();
    }

    async void GetUser()
    {
        var endpoint = "api/users/";
        Dictionary<string, string> userData = await Utilities.GetUserData(endpoint, new string[] { "name", "avatar_url" });

        if (userData != null)
        {
            avatar = userData["avatar_url"];
            userName = userData["name"];
        }
    }
}
