using System;
using UnityEngine;

public class GUIDGenerator : MonoBehaviour
{
    public static string guid = Guid.NewGuid().ToString().Substring(0, 5);
}
