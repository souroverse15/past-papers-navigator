import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  ShieldAlert,
  Trash2,
  Ban,
  CheckCircle,
  User,
  AlertTriangle,
} from "lucide-react";

const AdminDashboard = () => {
  const { user, refreshUserData } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    // Debug info about Firestore connection
    console.log("Firestore instance:", db);
    console.log("Current user:", user);

    const fetchUsers = async () => {
      if (!user || user.email !== "souroveahmed15@gmail.com") {
        setError("You do not have admin privileges");
        setLoading(false);
        return;
      }

      try {
        // Directly fetch from Firestore instead of using the service
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersList = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("Successfully fetched users:", usersList.length);
        console.log(
          "First user structure:",
          usersList.length > 0 ? usersList[0] : "No users found"
        );
        setUsers(usersList);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(`Error fetching users: ${err.message}`);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  const updateUserRole = async (userId, newRole) => {
    if (!user || user.email !== "souroveahmed15@gmail.com") {
      alert("You do not have permission to update user roles");
      return;
    }

    try {
      console.log(`Attempting to update user ${userId} to role ${newRole}`);
      setLoading(true);

      // Get document first to check if it exists
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        console.error(`User document not found: ${userId}`);
        alert(`Error: User document does not exist for ${userId}`);
        setLoading(false);
        return;
      }

      console.log(`User document found: ${userId}`, userDoc.data());

      // Update directly in Firestore
      try {
        await updateDoc(userRef, {
          role: newRole,
          updatedAt: serverTimestamp(),
          updatedBy: user.email,
        });
        console.log(
          `Successfully updated ${userId} role in Firestore to ${newRole}`
        );

        // Double-check the update was successful
        const updatedDoc = await getDoc(userRef);
        console.log("Updated document data:", updatedDoc.data());
      } catch (firestoreErr) {
        console.error("Firestore Error updating user role:", firestoreErr);
        alert(
          `Firestore Error: ${firestoreErr.code} - ${firestoreErr.message}`
        );
        setLoading(false);
        return;
      }

      // Update local state
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );

      alert(`Successfully updated ${userId} to ${newRole} role`);
    } catch (err) {
      console.error("Error updating user role:", err);
      alert(`Error updating user role: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserBan = async (email, currentBanStatus) => {
    if (!user || user.email !== "souroveahmed15@gmail.com") {
      alert("You do not have permission to ban/unban users");
      return;
    }

    try {
      setLoading(true);

      // Update directly in Firestore
      const userRef = doc(db, "users", email);
      await updateDoc(userRef, {
        status: currentBanStatus ? "active" : "banned",
        isBanned: !currentBanStatus,
        updatedAt: serverTimestamp(),
        updatedBy: user.email,
        ...(currentBanStatus
          ? { unbannedAt: serverTimestamp() }
          : { bannedAt: serverTimestamp() }),
      });

      // Update local state
      setUsers(
        users.map((u) =>
          u.id === email
            ? {
                ...u,
                status: currentBanStatus ? "active" : "banned",
                isBanned: !currentBanStatus,
              }
            : u
        )
      );

      alert(
        `Successfully ${currentBanStatus ? "unbanned" : "banned"} ${email}`
      );
    } catch (err) {
      console.error("Error toggling ban status:", err);
      alert(`Error toggling ban status: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (email) => {
    try {
      setLoading(true);

      // Delete user directly from Firestore
      const userRef = doc(db, "users", email);
      await deleteDoc(userRef);

      // Update local state
      setUsers(users.filter((u) => u.id !== email));

      // Clear confirmation dialog
      setConfirmDelete(null);

      // Show success message
      alert(`User ${email} has been deleted successfully`);
    } catch (error) {
      console.error("Error removing user:", error);
      alert(`Error removing user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-gray-800 text-white">
        <div className="text-xl">Loading user data...</div>
      </div>
    );

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-800 text-white">
        <div className="bg-red-900/30 p-6 rounded-lg max-w-lg text-center">
          <h2 className="text-xl font-bold mb-4">Error</h2>
          <p className="mb-4">{error}</p>
          {error.includes("privileges") && (
            <p>
              Make sure you are logged in with the admin account
              (souroveahmed15@gmail.com) and have proper Firebase permissions.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800 text-white">
      <div className="flex justify-between items-center p-4 bg-gray-900">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Link
            to="/role-check"
            className="bg-purple-600 hover:bg-purple-700 rounded px-3 py-1 text-sm"
          >
            Role Debug
          </Link>
          <button
            onClick={refreshUserData}
            className="bg-green-600 hover:bg-green-700 rounded px-3 py-1 text-sm"
          >
            Refresh User
          </button>
        </div>
      </div>

      <div className="p-6 bg-gray-800 text-white min-h-screen">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        <div className="bg-gray-700 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 bg-gray-900 border-b border-gray-600">
            <h2 className="text-xl font-semibold">User Management</h2>
            <p className="text-gray-400">
              Manage users, update roles, or remove accounts
            </p>
          </div>

          {users.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-lg mb-4">No users found</p>
              <div className="bg-red-900/30 p-4 rounded-md mb-4 text-left">
                <h3 className="font-bold mb-2">Troubleshooting:</h3>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Make sure you've updated the Firestore security rules</li>
                  <li>
                    Check that your account (souroveahmed15@gmail.com) is set as
                    an admin
                  </li>
                  <li>
                    Verify that there are users in your Firestore database
                  </li>
                  <li>Look at the browser console for any error messages</li>
                </ol>
              </div>
              <button
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  setTimeout(() => {
                    // Try again with direct Firestore access
                    getDocs(collection(db, "users"))
                      .then((snapshot) => {
                        const usersList = snapshot.docs.map((doc) => ({
                          id: doc.id,
                          ...doc.data(),
                        }));
                        setUsers(usersList);
                        setLoading(false);
                      })
                      .catch((err) => {
                        console.error("Error refreshing users:", err);
                        setError(`Error refreshing users: ${err.message}`);
                        setLoading(false);
                      });
                  }, 500);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Refresh Users
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-600">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-700 divide-y divide-gray-600">
                  {users.map((userData) => (
                    <tr
                      key={userData.id}
                      className={
                        userData.status === "banned" ? "bg-red-900/30" : ""
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {userData.picture ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={userData.picture}
                                alt={userData.name || "User"}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "";
                                  e.target.style.display = "none";
                                  e.target.parentElement.innerHTML =
                                    '<div class="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>';
                                }}
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center">
                                <User size={20} className="text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium">
                              {userData.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {userData.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {userData.lastLogin && userData.lastLogin.seconds
                          ? new Date(
                              userData.lastLogin.seconds * 1000
                            ).toLocaleString()
                          : userData.lastLogin
                          ? new Date(userData.lastLogin).toLocaleString()
                          : "Never"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            userData.role === "Admin"
                              ? "bg-indigo-500 text-white"
                              : "bg-gray-500 text-white"
                          }`}
                        >
                          {userData.role || "User"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            userData.status === "banned"
                              ? "bg-red-500 text-white"
                              : "bg-green-500 text-white"
                          }`}
                        >
                          {userData.status === "banned" ? "Banned" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-y-2">
                        {userData.email !== user?.email ? (
                          <>
                            <div className="flex items-center space-x-2">
                              <select
                                className="bg-gray-800 text-white rounded px-2 py-1 border border-gray-600"
                                value={userData.role || "User"}
                                onChange={(e) =>
                                  updateUserRole(userData.id, e.target.value)
                                }
                                disabled={
                                  loading || userData.status === "banned"
                                }
                              >
                                <option value="User">User</option>
                                <option value="Admin">Admin</option>
                              </select>

                              <button
                                onClick={() =>
                                  toggleUserBan(
                                    userData.id,
                                    userData.status === "banned"
                                  )
                                }
                                className={`p-1.5 rounded ${
                                  userData.status === "banned"
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-yellow-600 hover:bg-yellow-700"
                                }`}
                                title={
                                  userData.status === "banned"
                                    ? "Unban User"
                                    : "Ban User"
                                }
                                disabled={loading}
                              >
                                {userData.status === "banned" ? (
                                  <CheckCircle size={16} />
                                ) : (
                                  <Ban size={16} />
                                )}
                              </button>

                              <button
                                onClick={() => setConfirmDelete(userData.id)}
                                className="p-1.5 rounded bg-red-600 hover:bg-red-700"
                                title="Delete User"
                                disabled={
                                  loading || userData.email === user?.email
                                }
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center">
                            <ShieldAlert
                              size={16}
                              className="mr-2 text-indigo-400"
                            />
                            <span className="text-gray-400">Current Admin</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation dialog for delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full border border-gray-700">
            <div className="flex items-center mb-4 text-red-500">
              <AlertTriangle className="mr-2" />
              <h3 className="text-xl font-bold">Delete User</h3>
            </div>
            <p className="mb-6">
              Are you sure you want to delete user{" "}
              <strong>{confirmDelete}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveUser(confirmDelete)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded flex items-center"
                disabled={loading}
              >
                {loading ? (
                  "Deleting..."
                ) : (
                  <>
                    <Trash2 size={16} className="mr-2" />
                    Delete User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
