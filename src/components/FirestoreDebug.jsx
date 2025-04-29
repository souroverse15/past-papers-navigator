import React, { useState } from "react";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";

const FirestoreDebug = () => {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Function to log results with timestamp
  const logResult = (action, success, data = null, error = null) => {
    const timestamp = new Date().toISOString();
    const newResult = {
      id: Date.now(),
      timestamp,
      action,
      success,
      data: data ? JSON.stringify(data, null, 2) : null,
      error: error ? error.toString() : null,
    };

    setResults((prev) => [newResult, ...prev]);
  };

  // Test creating a user document
  const testCreateUser = async () => {
    if (!user?.email) {
      logResult("Create User", false, null, new Error("No user email found"));
      return;
    }

    setLoading(true);
    try {
      const userData = {
        email: user.email,
        name: user.name,
        role: "Admin", // Force admin role for testing
        status: "active",
        isBanned: false,
        testField: "Created at " + new Date().toISOString(),
        updatedAt: serverTimestamp(),
      };

      const userRef = doc(db, "users", user.email);
      await setDoc(userRef, userData, { merge: true });

      logResult("Create User", true, userData);
    } catch (error) {
      console.error("Error creating user:", error);
      logResult("Create User", false, null, error);
    } finally {
      setLoading(false);
    }
  };

  // Test reading the current user's document
  const testReadCurrentUser = async () => {
    if (!user?.email) {
      logResult(
        "Read Current User",
        false,
        null,
        new Error("No user email found")
      );
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, "users", user.email);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        logResult("Read Current User", true, userDoc.data());
      } else {
        logResult(
          "Read Current User",
          false,
          null,
          new Error("User document does not exist")
        );
      }
    } catch (error) {
      console.error("Error reading user:", error);
      logResult("Read Current User", false, null, error);
    } finally {
      setLoading(false);
    }
  };

  // Test reading all users collection
  const testReadAllUsers = async () => {
    setLoading(true);
    try {
      const usersCollectionRef = collection(db, "users");
      const querySnapshot = await getDocs(usersCollectionRef);

      const users = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      logResult("Read All Users", true, { count: users.length, users });
    } catch (error) {
      console.error("Error reading all users:", error);
      logResult("Read All Users", false, null, error);
    } finally {
      setLoading(false);
    }
  };

  // Test creating a test document in root collection
  const testCreateRootDocument = async () => {
    setLoading(true);
    try {
      const testData = {
        text: "Test document created at " + new Date().toISOString(),
        createdBy: user?.email || "unknown",
        createdAt: serverTimestamp(),
      };

      const testRef = doc(collection(db, "tests"));
      await setDoc(testRef, testData);

      logResult("Create Root Document", true, testData);
    } catch (error) {
      console.error("Error creating test document:", error);
      logResult("Create Root Document", false, null, error);
    } finally {
      setLoading(false);
    }
  };

  // Test reading from root collection
  const testReadRootCollection = async () => {
    setLoading(true);
    try {
      const testsCollectionRef = collection(db, "tests");
      const querySnapshot = await getDocs(testsCollectionRef);

      const tests = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      logResult("Read Root Collection", true, { count: tests.length, tests });
    } catch (error) {
      console.error("Error reading tests collection:", error);
      logResult("Read Root Collection", false, null, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-800 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Firestore Debug Page</h1>

      <div className="bg-gray-700 rounded-lg shadow-lg overflow-hidden mb-6">
        <div className="p-4 bg-gray-900 border-b border-gray-600">
          <h2 className="text-xl font-semibold">Test Firestore Operations</h2>
          <p className="text-gray-400">
            Run operations to debug Firestore permissions
          </p>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-800 p-4 rounded-md">
              <h3 className="font-bold mb-2">User Operations</h3>
              <div className="space-y-2">
                <button
                  onClick={testCreateUser}
                  disabled={loading}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                >
                  Create/Update Current User
                </button>
                <button
                  onClick={testReadCurrentUser}
                  disabled={loading}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                >
                  Read Current User
                </button>
                <button
                  onClick={testReadAllUsers}
                  disabled={loading}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                >
                  Read All Users
                </button>
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-md">
              <h3 className="font-bold mb-2">General Operations</h3>
              <div className="space-y-2">
                <button
                  onClick={testCreateRootDocument}
                  disabled={loading}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                >
                  Create Test Document
                </button>
                <button
                  onClick={testReadRootCollection}
                  disabled={loading}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                >
                  Read Test Collection
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-4 rounded-md">
            <h3 className="font-bold mb-2">Current User</h3>
            <pre className="bg-black p-3 rounded overflow-auto max-h-24">
              {user ? JSON.stringify(user, null, 2) : "Not logged in"}
            </pre>
          </div>
        </div>
      </div>

      <div className="bg-gray-700 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 bg-gray-900 border-b border-gray-600">
          <h2 className="text-xl font-semibold">Test Results</h2>
          <p className="text-gray-400">Results of operations (newest first)</p>
        </div>

        <div className="overflow-auto max-h-96">
          {results.length > 0 ? (
            <div className="divide-y divide-gray-800">
              {results.map((result) => (
                <div
                  key={result.id}
                  className={`p-4 ${
                    result.success ? "bg-green-900/20" : "bg-red-900/20"
                  }`}
                >
                  <div className="flex justify-between mb-2">
                    <span className="font-bold">{result.action}</span>
                    <span className="text-sm opacity-70">
                      {result.timestamp}
                    </span>
                  </div>

                  <div className="text-sm mb-2">
                    Status:{" "}
                    <span
                      className={
                        result.success ? "text-green-400" : "text-red-400"
                      }
                    >
                      {result.success ? "Success" : "Failed"}
                    </span>
                  </div>

                  {result.data && (
                    <div className="mt-2">
                      <h4 className="text-sm font-semibold mb-1">Data:</h4>
                      <pre className="bg-black p-2 rounded text-xs overflow-auto max-h-60">
                        {result.data}
                      </pre>
                    </div>
                  )}

                  {result.error && (
                    <div className="mt-2">
                      <h4 className="text-sm font-semibold mb-1 text-red-400">
                        Error:
                      </h4>
                      <pre className="bg-black p-2 rounded text-xs overflow-auto max-h-28 text-red-400">
                        {result.error}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-400">
              No test results yet. Run operations to see results here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FirestoreDebug;
