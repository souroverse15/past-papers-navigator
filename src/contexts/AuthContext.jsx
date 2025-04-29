import React, { createContext, useState, useContext, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { saveUserOnLogin, getUserByEmail } from "../firebase/userService";

// Create context
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user was previously logged in
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const storedToken = localStorage.getItem("google_auth_token");
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (decoded.exp && decoded.exp < currentTime) {
          // Token expired
          localStorage.removeItem("google_auth_token");
          setUser(null);
        } else {
          // Get user from Firestore to include roles
          const firebaseUser = await getUserByEmail(decoded.email);
          if (firebaseUser) {
            // Check if user is banned
            if (firebaseUser.status === "banned" || firebaseUser.isBanned) {
              // User is banned, log them out
              localStorage.removeItem("google_auth_token");
              setUser(null);
              alert(
                "Your account has been banned. Please contact the administrator for more information."
              );
              return;
            }

            console.log("Loaded user from Firestore:", firebaseUser);

            // Combine JWT data with Firestore data
            setUser({
              ...decoded,
              role: firebaseUser.role || "User",
              secondaryRoles: firebaseUser.secondaryRoles || [],
              status: firebaseUser.status || "active",
              lastLogin: firebaseUser.lastLogin,
            });
          } else {
            setUser(decoded); // Fallback to JWT data only
          }
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        localStorage.removeItem("google_auth_token");
      }
    }
    setLoading(false);
  };

  // Function to refresh user data from Firestore
  const refreshUserData = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      // Get the most up-to-date user data
      const firebaseUser = await getUserByEmail(user.email);
      if (firebaseUser) {
        console.log("Refreshed user data from Firestore:", firebaseUser);

        // Update the user state with the refreshed data
        const updatedUser = {
          ...user,
          role: firebaseUser.role || user.role,
          secondaryRoles: firebaseUser.secondaryRoles || [],
          status: firebaseUser.status || "active",
        };

        setUser(updatedUser);
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle successful login
  const handleLogin = async (credentialResponse) => {
    const credential = credentialResponse.credential;
    localStorage.setItem("google_auth_token", credential);

    // Set loading state to true
    setLoading(true);

    const decoded = jwtDecode(credential);

    try {
      // Check if user is banned before saving
      const existingUser = await getUserByEmail(decoded.email);
      if (
        existingUser &&
        (existingUser.status === "banned" || existingUser.isBanned)
      ) {
        // User is banned, log them out
        localStorage.removeItem("google_auth_token");
        alert(
          "Your account has been banned. Please contact the administrator for more information."
        );
        setLoading(false);
        return null;
      }

      // Save user to Firestore
      const firebaseUser = await saveUserOnLogin({
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        status: "active", // Ensure user status is active on login
        role: decoded.email === "souroveahmed15@gmail.com" ? "Admin" : "User", // Simplified role system
      });

      // Get the most up-to-date user data
      const updatedUser = await getUserByEmail(decoded.email);

      // Combine JWT data with Firestore data including role
      const userWithRole = {
        ...decoded,
        role: updatedUser?.role || "User",
        status: updatedUser?.status || "active",
      };

      console.log("User logged in with role:", userWithRole.role);
      setUser(userWithRole);
      setLoading(false);
      return userWithRole;
    } catch (error) {
      console.error("Error during login:", error);
      alert("Login failed. Please try again.");
      setLoading(false);
      return null;
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("google_auth_token");
    setUser(null);
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Check if user has specific role
  const hasRole = (role) => {
    if (!user) return false;

    // Special case for Admin - only allow the designated admin email
    if (role === "Admin") return user.email === "souroveahmed15@gmail.com";

    // Basic User role - everyone who is authenticated is a User
    return role === "User";
  };

  const value = {
    user,
    loading,
    handleLogin,
    handleLogout,
    isAuthenticated,
    hasRole,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
