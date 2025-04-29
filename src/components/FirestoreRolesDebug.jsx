import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

export default function FirestoreRolesDebug() {
  const { user, handleLogout } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("User");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add a log message
  const addLog = (message, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prevLogs) => [
      { timestamp, message, isError },
      ...prevLogs.slice(0, 19), // Keep last 20 logs
    ]);
    console.log(`${isError ? "ERROR" : "INFO"} - ${message}`);
  };

  // Add a function to reload the page
  const handleReload = () => {
    window.location.reload();
  };

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user?.email) {
        addLog("No user is logged in", true);
        setLoading(false);
        return;
      }

      addLog(
        `Fetching users as ${user.email} (role: ${user.role || "unknown"})`
      );

      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersList = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        addLog(`Successfully fetched ${usersList.length} users`);
        setUsers(usersList);

        if (usersList.length > 0) {
          setSelectedUser(usersList[0].id);
        }
      } catch (err) {
        addLog(`Error fetching users: ${err.message}`, true);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  const testUpdateRole = async () => {
    if (!selectedUser || !newRole) {
      addLog("No user selected or no role specified", true);
      return;
    }

    addLog(`Testing update of user ${selectedUser} to role ${newRole}`);
    setLoading(true);

    try {
      // Get document first to check if it exists
      const userRef = doc(db, "users", selectedUser);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        addLog(`User document not found: ${selectedUser}`, true);
        setLoading(false);
        return;
      }

      addLog(
        `User document found: ${selectedUser} (current role: ${
          userDoc.data().role || "none"
        })`
      );

      // Update directly in Firestore
      try {
        await updateDoc(userRef, {
          role: newRole,
          updatedAt: serverTimestamp(),
          updatedBy: user.email,
        });
        addLog(
          `Successfully updated ${selectedUser} role in Firestore to ${newRole}`
        );

        // Double-check the update was successful
        const updatedDoc = await getDoc(userRef);
        addLog(`Updated document role: ${updatedDoc.data().role}`);
      } catch (firestoreErr) {
        addLog(
          `Firestore Error: ${firestoreErr.code} - ${firestoreErr.message}`,
          true
        );
        setLoading(false);
        return;
      }
    } catch (err) {
      addLog(`Error updating user role: ${err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-800 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Firestore Roles Debug</h1>

      <div className="mb-4 flex items-center justify-end space-x-2">
        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
          onClick={handleReload}
        >
          Reload Page
        </button>

        <button
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium"
          onClick={() => {
            handleLogout();
            window.location.href = "/login";
          }}
        >
          Logout
        </button>
      </div>

      <div className="mb-6 bg-gray-700 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Current User</h2>
        {user ? (
          <div>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Role:</strong> {user.role || "Not set"}
            </p>
            <p>
              <strong>Secondary Roles:</strong>{" "}
              {user.secondaryRoles ? user.secondaryRoles.join(", ") : "None"}
            </p>
            <p>
              <strong>Admin Status:</strong>{" "}
              {user.email === "souroveahmed15@gmail.com"
                ? "Is Admin"
                : "Not Admin"}
            </p>
          </div>
        ) : (
          <p className="text-red-400">No user logged in</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-700 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Test Role Update</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Select User</label>
              <select
                className="w-full bg-gray-800 border border-gray-600 rounded p-2"
                value={selectedUser || ""}
                onChange={(e) => setSelectedUser(e.target.value)}
                disabled={loading}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.id} ({user.role || "No role"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1">New Role</label>
              <select
                className="w-full bg-gray-800 border border-gray-600 rounded p-2"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                disabled={loading}
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <button
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
              onClick={testUpdateRole}
              disabled={loading}
            >
              {loading ? "Processing..." : "Test Update Role"}
            </button>
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Logs</h2>
          <div className="bg-gray-900 p-3 rounded h-80 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500 italic">No logs yet</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`text-sm ${
                      log.isError ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    [{log.timestamp}] {log.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
