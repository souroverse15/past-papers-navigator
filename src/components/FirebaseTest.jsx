import React, { useState, useEffect } from "react";
import { db } from "../firebase/config";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

export default function FirebaseTest() {
  const { user } = useAuth();
  const [testMessage, setTestMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rulesExpanded, setRulesExpanded] = useState(false);

  // Test connection to Firestore
  useEffect(() => {
    const testFirestore = async () => {
      try {
        // Try to get users collection
        const usersCol = collection(db, "users");
        const userSnapshot = await getDocs(usersCol);

        if (userSnapshot.empty) {
          setTestMessage(
            "Connected to Firebase! No users found in the database yet."
          );
        } else {
          const usersList = userSnapshot.docs.map((doc) => doc.data());
          setUsers(usersList);
          setTestMessage(
            `Connected to Firebase! Found ${usersList.length} users in the database.`
          );
        }
      } catch (error) {
        console.error("Firebase connection error:", error);
        setTestMessage(`Error connecting to Firebase: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      testFirestore();
    } else {
      setTestMessage("Please log in to test Firebase connection.");
      setLoading(false);
    }
  }, [user]);

  // Function to manually create user in Firestore without security rules validation
  const createUserInFirestore = async () => {
    if (!user || !user.email) return;

    try {
      setLoading(true);
      // Create user document with email as ID
      const userRef = doc(db, "users", user.email);
      await setDoc(
        userRef,
        {
          email: user.email,
          name: user.name,
          picture: user.picture,
          role: "User", // Default role
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        },
        { merge: true }
      );

      setTestMessage("User created in Firestore! Please refresh the page.");
    } catch (error) {
      console.error("Error creating user:", error);
      setTestMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to manually assign Admin role to the current user (for initial setup only)
  const makeUserAdmin = async () => {
    if (!user || !user.email) return;

    // Only allow for the designated admin email
    if (user.email !== "souroveahmed15@gmail.com") {
      setTestMessage("Error: Only the designated admin can use this function.");
      return;
    }

    try {
      setLoading(true);
      const userRef = doc(db, "users", user.email);

      // First check if the document exists
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Document doesn't exist, so create it first
        await setDoc(userRef, {
          email: user.email,
          name: user.name || "",
          picture: user.picture || "",
          role: "Admin", // Set as Admin directly
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });
        setTestMessage("User created as Admin! Please refresh the page.");
      } else {
        // Document exists, just update the role
        await updateDoc(userRef, {
          role: "Admin",
          lastLogin: serverTimestamp(),
        });
        setTestMessage("You are now an Admin! Please refresh the page.");
      }
    } catch (error) {
      console.error("Error making user admin:", error);
      setTestMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const temporaryRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  return (
    <div className="p-6 bg-gray-800 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Firebase Connection Test</h1>

      <div className="bg-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
        {loading ? (
          <p>Testing connection to Firebase...</p>
        ) : (
          <p
            className={
              testMessage.includes("Error") ? "text-red-400" : "text-green-400"
            }
          >
            {testMessage}
          </p>
        )}

        {testMessage.includes("Missing or insufficient permissions") && (
          <div className="mt-4 bg-red-900/30 border border-red-800 p-4 rounded-md">
            <h3 className="font-bold text-lg mb-2">Security Rules Error</h3>
            <p className="mb-2">
              Your Firebase security rules are preventing access to the
              database. To fix this:
            </p>
            <ol className="list-decimal list-inside mb-4 space-y-1">
              <li>
                Go to the{" "}
                <a
                  href="https://console.firebase.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 underline hover:text-blue-300"
                >
                  Firebase Console
                </a>
              </li>
              <li>
                Select your project:{" "}
                <strong>past-papers-navigator-aa3ae</strong>
              </li>
              <li>Go to Firestore Database in the left sidebar</li>
              <li>Click on the "Rules" tab</li>
              <li>Replace the rules with the ones shown below</li>
              <li>Click "Publish"</li>
            </ol>
            <button
              className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
              onClick={() => setRulesExpanded(!rulesExpanded)}
            >
              {rulesExpanded ? "Hide" : "Show"} Temporary Security Rules
            </button>

            {rulesExpanded && (
              <pre className="bg-gray-900 p-4 rounded-md overflow-x-auto text-sm mb-4">
                {temporaryRules}
              </pre>
            )}

            <p className="text-yellow-400 text-sm mb-4">
              <strong>Note:</strong> These temporary rules allow anyone to
              access your database. They should only be used for development,
              not in production.
            </p>

            <button
              onClick={createUserInFirestore}
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 mr-4"
            >
              Create User in Firestore
            </button>
          </div>
        )}

        {user && (
          <div className="mt-4">
            {user.email === "souroveahmed15@gmail.com" && (
              <>
                <button
                  onClick={makeUserAdmin}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                >
                  Make Me Admin
                </button>
                <p className="mt-2 text-sm text-gray-400">
                  This button is only available to the designated admin email.
                </p>
              </>
            )}

            <div className="mt-4 p-4 bg-gray-600/50 rounded-md">
              <h3 className="font-semibold mb-2">Next Steps:</h3>
              <p className="mb-2">Now that Firebase is set up, you can:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Go to the{" "}
                  <a href="/admin" className="text-blue-400 underline">
                    Admin Dashboard
                  </a>{" "}
                  (if you're an admin)
                </li>
                <li>Create new users by having them log in</li>
                <li>Assign roles to users from the Admin Dashboard</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {users.length > 0 && (
        <div className="bg-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Users in Database</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-600">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Last Login
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-700 divide-y divide-gray-600">
                {users.map((user, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.role || "User"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.lastLogin && user.lastLogin.seconds
                        ? new Date(
                            user.lastLogin.seconds * 1000
                          ).toLocaleString()
                        : user.lastLogin
                        ? new Date(user.lastLogin).toLocaleString()
                        : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
