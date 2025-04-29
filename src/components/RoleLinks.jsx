import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RoleLinks() {
  const { refreshUserData } = useAuth();

  return (
    <div className="flex justify-between items-center p-3 bg-gray-900">
      <h1 className="text-white text-sm font-bold">Quick Navigation</h1>
      <div className="flex gap-2">
        <Link
          to="/role-check"
          className="bg-purple-600 hover:bg-purple-700 rounded px-2 py-1 text-white text-xs"
        >
          Role Debug
        </Link>
        <button
          onClick={refreshUserData}
          className="bg-green-600 hover:bg-green-700 rounded px-2 py-1 text-white text-xs"
        >
          Refresh User
        </button>
      </div>
    </div>
  );
}
