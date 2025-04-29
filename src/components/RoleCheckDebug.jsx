import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

export default function RoleCheckDebug() {
  const { user, hasRole, refreshUserData } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // List of all possible roles to check
  const rolesToCheck = ["Admin", "User"];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUserData();
    setIsRefreshing(false);

    // Force a page reload to ensure all components re-render with new role data
    window.location.reload();
  };

  return (
    <div className="p-6 bg-gray-800 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Role Access Debug</h1>

      <div className="flex justify-end mb-4">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-medium disabled:opacity-50"
        >
          {isRefreshing ? "Refreshing..." : "Refresh User Data"}
        </button>
      </div>

      <div className="mb-6 bg-gray-700 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Current User</h2>
        {user ? (
          <div className="space-y-2">
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Primary Role:</strong> {user.role || "Not set"}
            </p>
            <p className="text-sm text-gray-400">
              User object: {JSON.stringify(user)}
            </p>
          </div>
        ) : (
          <p className="text-red-400">No user logged in</p>
        )}
      </div>

      <div className="mb-6 bg-gray-700 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Role Access Check</h2>
        <div className="space-y-2">
          {rolesToCheck.map((role) => (
            <div
              key={role}
              className="flex items-center justify-between border-b border-gray-600 pb-2"
            >
              <span>{role} Role Access:</span>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  hasRole(role) ? "bg-green-500" : "bg-red-500"
                }`}
              >
                {hasRole(role) ? "GRANTED" : "DENIED"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 bg-gray-700 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Dashboard Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/admin"
            className={`p-4 rounded-lg ${
              hasRole("Admin")
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-600 cursor-not-allowed"
            }`}
          >
            Admin Dashboard
          </Link>
          <Link
            to="/dashboard"
            className="p-4 rounded-lg bg-blue-600 hover:bg-blue-700"
          >
            User Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
