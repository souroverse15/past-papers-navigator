import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function DashboardRedirect() {
  const { user, hasRole, refreshUserData } = useAuth();

  // Check all possible roles
  const isAdmin = user?.email === "souroveahmed15@gmail.com";

  const handleRefresh = async () => {
    await refreshUserData();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard Selector</h1>

      <div className="bg-gray-700 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Your User Information</h2>
        <div className="space-y-2">
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
          <p>
            <strong>Name:</strong> {user?.name}
          </p>
          <p>
            <strong>Role:</strong> {user?.role || "Not set"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div
          className={`p-6 rounded-lg ${
            isAdmin ? "bg-blue-600" : "bg-gray-700 opacity-50"
          }`}
        >
          <h3 className="text-lg font-semibold mb-2">Admin Dashboard</h3>
          <p className="text-gray-300 mb-4">
            Access to administrative features and user management.
          </p>
          {isAdmin ? (
            <Link
              to="/admin"
              className="px-4 py-2 bg-white text-blue-600 rounded inline-block font-medium"
            >
              Go to Admin Dashboard
            </Link>
          ) : (
            <div className="px-4 py-2 bg-gray-600 text-gray-400 rounded inline-block cursor-not-allowed">
              Admin Access Required
            </div>
          )}
        </div>

        <div className="p-6 rounded-lg bg-green-600">
          <h3 className="text-lg font-semibold mb-2">User Dashboard</h3>
          <p className="text-gray-300 mb-4">
            Access your personalized dashboard with progress tracking.
          </p>
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-white text-green-600 rounded inline-block font-medium"
          >
            Go to User Dashboard
          </Link>
        </div>
      </div>

      <div className="bg-gray-700 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Actions</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium"
          >
            Refresh User Data
          </button>
          <Link
            to="/"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium"
          >
            Go to Home
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
