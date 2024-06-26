using System.Collections.Generic;
using UnityEngine;

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
    public static List<object> issues;
    // AVATARURL
    // GH USERNAME

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
    }
}
