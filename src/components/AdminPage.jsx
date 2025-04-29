import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getDoc, doc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

const AdminPage = () => {
  const { user } = useAuth();
  const [debug, setDebug] = useState({
    userEmail: "",
    isAdminInRules: false,
    hasUsers: false,
    userCount: 0,
    currentUserData: null,
    error: null,
    allUsers: [],
  });

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        if (!user || !user.email) {
          setDebug((prev) => ({ ...prev, error: "No user logged in" }));
          return;
        }

        // Set user email
        setDebug((prev) => ({ ...prev, userEmail: user.email }));

        // Check if user exists in Firestore
        const userRef = doc(db, "users", user.email);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setDebug((prev) => ({
            ...prev,
            currentUserData: userData,
            isAdminInRules: user.email === "souroveahmed15@gmail.com",
          }));
        } else {
          setDebug((prev) => ({
            ...prev,
            error: "User document does not exist in Firestore",
          }));
        }

        // Check if there are any users in the database
        const usersCollection = collection(db, "users");
        const usersSnap = await getDocs(usersCollection);

        setDebug((prev) => ({
          ...prev,
          hasUsers: !usersSnap.empty,
          userCount: usersSnap.size,
          allUsers: usersSnap.docs.map((doc) => doc.data()),
        }));
      } catch (error) {
        console.error("Error checking admin status:", error);
        setDebug((prev) => ({ ...prev, error: error.message }));
      }
    };

    checkAdmin();
  }, [user]);

  return (
    <div className="p-6 bg-gray-800 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Admin Debug Page</h1>

      <div className="bg-gray-700 rounded-lg shadow-lg overflow-hidden mb-6">
        <div className="p-4 bg-gray-900 border-b border-gray-600">
          <h2 className="text-xl font-semibold">User & Admin Debug Info</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-gray-800 p-4 rounded-md">
              <h3 className="font-bold mb-2">Current User Email:</h3>
              <p className="font-mono">{debug.userEmail || "Not available"}</p>
            </div>

            <div className="bg-gray-800 p-4 rounded-md">
              <h3 className="font-bold mb-2">Admin Status:</h3>
              <p>
                Is Admin in Rules:{" "}
                <span
                  className={
                    debug.isAdminInRules ? "text-green-500" : "text-red-500"
                  }
                >
                  {debug.isAdminInRules ? "Yes" : "No"}
                </span>
              </p>
            </div>

            <div className="bg-gray-800 p-4 rounded-md">
              <h3 className="font-bold mb-2">User Data in Firestore:</h3>
              {debug.currentUserData ? (
                <pre className="whitespace-pre-wrap bg-gray-900 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(debug.currentUserData, null, 2)}
                </pre>
              ) : (
                <p className="text-red-500">No user data found</p>
              )}
            </div>

            <div className="bg-gray-800 p-4 rounded-md">
              <h3 className="font-bold mb-2">Users in Database:</h3>
              <p>
                Has Users:{" "}
                <span
                  className={debug.hasUsers ? "text-green-500" : "text-red-500"}
                >
                  {debug.hasUsers ? "Yes" : "No"}
                </span>
              </p>
              <p>User Count: {debug.userCount}</p>
            </div>

            {debug.error && (
              <div className="bg-red-900/30 p-4 rounded-md">
                <h3 className="font-bold mb-2">Error:</h3>
                <p className="font-mono">{debug.error}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-700 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 bg-gray-900 border-b border-gray-600">
          <h2 className="text-xl font-semibold">All Users in Database</h2>
        </div>
        <div className="p-4">
          {debug.allUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-600">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-700 divide-y divide-gray-600">
                  {debug.allUsers.map((user, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.role || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.status || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-4">No users found in the database</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
