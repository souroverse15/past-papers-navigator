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
  Users,
  UserCheck,
  UserX,
  Crown,
} from "lucide-react";

const AdminDashboard = () => {
  const { user, refreshUserData } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user || user.email !== "souroveahmed15@gmail.com") {
        setError("You do not have admin privileges");
        setLoading(false);
        return;
      }

      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersList = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("Successfully fetched users:", usersList.length);
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
      console.log(`Updating user ${userId} to role ${newRole}`);
      setLoading(true);

      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        alert(`Error: User document does not exist for ${userId}`);
        setLoading(false);
        return;
      }

      await updateDoc(userRef, {
        role: newRole,
        updatedAt: serverTimestamp(),
        updatedBy: user.email,
      });

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

      const userRef = doc(db, "users", email);
      await deleteDoc(userRef);

      setUsers(users.filter((u) => u.id !== email));
      setConfirmDelete(null);

      alert(`User ${email} has been deleted successfully`);
    } catch (error) {
      console.error("Error removing user:", error);
      alert(`Error removing user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-gray-800 text-white flex items-center justify-center">
        <div className="text-xl">Loading user data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen bg-gray-800 text-white flex items-center justify-center">
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

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status !== "banned").length,
    banned: users.filter((u) => u.status === "banned").length,
    admins: users.filter((u) => u.role === "Admin").length,
    pro: users.filter((u) => u.role === "Pro").length,
    plus: users.filter((u) => u.role === "Plus").length,
  };

  return (
    <div className="w-full bg-gray-800 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-3">
            <button
              onClick={refreshUserData}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Refresh User
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Users</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center">
              <UserX className="h-8 w-8 text-red-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Banned</p>
                <p className="text-2xl font-bold">{stats.banned}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center">
              <Crown className="h-8 w-8 text-indigo-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Admins</p>
                <p className="text-2xl font-bold">{stats.admins}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Pro Users</p>
                <p className="text-2xl font-bold">{stats.pro}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">+</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Plus Users</p>
                <p className="text-2xl font-bold">{stats.plus}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-900 rounded-lg border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold">User Management</h2>
            <p className="text-gray-400 mt-1">
              Manage user roles and access permissions
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-8 text-center text-gray-400"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((userData) => (
                    <tr key={userData.id} className="hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {userData.picture ? (
                              <img
                                className="h-10 w-10 rounded-full"
                                src={userData.picture}
                                alt=""
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
                                <User className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {userData.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {userData.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {userData.lastLogin && userData.lastLogin.seconds
                          ? new Date(
                              userData.lastLogin.seconds * 1000
                            ).toLocaleString()
                          : userData.lastLogin
                          ? new Date(userData.lastLogin).toLocaleString()
                          : "Never"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userData.role === "Admin"
                              ? "bg-indigo-500 text-white"
                              : userData.role === "Pro"
                              ? "bg-purple-500 text-white"
                              : userData.role === "Plus"
                              ? "bg-blue-500 text-white"
                              : "bg-gray-500 text-white"
                          }`}
                        >
                          {userData.role || "User"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userData.status === "banned"
                              ? "bg-red-500 text-white"
                              : "bg-green-500 text-white"
                          }`}
                        >
                          {userData.status === "banned" ? "Banned" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {userData.email !== user?.email ? (
                          <div className="flex items-center space-x-3">
                            <select
                              className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={userData.role || "User"}
                              onChange={(e) =>
                                updateUserRole(userData.id, e.target.value)
                              }
                              disabled={loading || userData.status === "banned"}
                            >
                              <option value="User">User</option>
                              <option value="Pro">Pro</option>
                              <option value="Plus">Plus</option>
                              <option value="Admin">Admin</option>
                            </select>

                            <button
                              onClick={() =>
                                toggleUserBan(
                                  userData.id,
                                  userData.status === "banned"
                                )
                              }
                              className={`p-2 rounded ${
                                userData.status === "banned"
                                  ? "bg-green-600 hover:bg-green-700"
                                  : "bg-yellow-600 hover:bg-yellow-700"
                              } transition-colors`}
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
                              className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                              title="Delete User"
                              disabled={
                                loading || userData.email === user?.email
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-medium">
                            Current User
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add some bottom spacing */}
        <div className="h-8"></div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold">Delete User</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete user{" "}
              <strong className="text-white">{confirmDelete}</strong>? This
              action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveUser(confirmDelete)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded flex items-center transition-colors"
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
