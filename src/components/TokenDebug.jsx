import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const TokenDebug = () => {
  const [tokenData, setTokenData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // Get the token from localStorage
      const token = localStorage.getItem("google_auth_token");

      if (!token) {
        setError("No token found in localStorage");
        return;
      }

      // Decode the JWT
      const decoded = jwtDecode(token);
      setTokenData(decoded);
    } catch (err) {
      setError(`Error decoding token: ${err.message}`);
    }
  }, []);

  const createNewUser = async () => {
    if (!tokenData?.email) {
      setError("No email found in token");
      return;
    }

    try {
      const userEmail = tokenData.email;
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/past-papers-navigator-aa3ae/databases/(default)/documents/users/${userEmail}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "google_auth_token"
            )}`,
          },
          body: JSON.stringify({
            fields: {
              email: { stringValue: userEmail },
              name: { stringValue: tokenData.name || "User" },
              role: { stringValue: "Admin" },
              status: { stringValue: "active" },
              isBanned: { booleanValue: false },
            },
          }),
        }
      );

      if (response.ok) {
        alert("Successfully created/updated user with Admin role!");
      } else {
        const errorData = await response.json();
        setError(`Error creating user: ${JSON.stringify(errorData)}`);
      }
    } catch (err) {
      setError(`Error creating user: ${err.message}`);
    }
  };

  return (
    <div className="p-6 bg-gray-800 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Auth Token Debugger</h1>

      <div className="bg-gray-700 rounded-lg shadow-lg overflow-hidden mb-6">
        <div className="p-4 bg-gray-900 border-b border-gray-600">
          <h2 className="text-xl font-semibold">Current Auth Token</h2>
        </div>

        <div className="p-4">
          {error ? (
            <div className="bg-red-900/30 p-4 rounded-md mb-4">
              <h3 className="font-bold mb-2">Error:</h3>
              <p>{error}</p>
            </div>
          ) : tokenData ? (
            <div className="space-y-4">
              <div className="bg-gray-800 p-4 rounded-md">
                <h3 className="font-bold mb-2">Token Information:</h3>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <span className="font-semibold">Email:</span>{" "}
                    {tokenData.email}
                  </div>
                  <div>
                    <span className="font-semibold">Name:</span>{" "}
                    {tokenData.name}
                  </div>
                  <div>
                    <span className="font-semibold">Is Admin:</span>{" "}
                    {tokenData.email === "souroveahmed15@gmail.com"
                      ? "Yes"
                      : "No"}
                  </div>
                  <div>
                    <span className="font-semibold">Expires:</span>{" "}
                    {new Date(tokenData.exp * 1000).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 p-4 rounded-md">
                <h3 className="font-bold mb-2">Full Token Data:</h3>
                <pre className="bg-black p-3 rounded overflow-auto max-h-96">
                  {JSON.stringify(tokenData, null, 2)}
                </pre>
              </div>

              <button
                onClick={createNewUser}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Force Create/Update Admin User
              </button>
            </div>
          ) : (
            <div className="text-center p-4">Loading token data...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenDebug;
