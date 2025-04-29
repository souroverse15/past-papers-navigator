import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, loading, user, hasRole } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-800 text-white">
        Loading...
      </div>
    );
  }

  // If not authenticated, redirect to login page
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Special check for admin route - only allow the designated admin email
  if (requiredRole === "Admin" && user.email !== "souroveahmed15@gmail.com") {
    return <Navigate to="/" replace />;
  }

  // Check role if required
  if (requiredRole && !hasRole(requiredRole)) {
    console.log(
      `User ${user.email} with role ${user.role} does not have required role: ${requiredRole}`
    );

    // Determine where to redirect based on user's role
    let redirectPath = "/";

    // Check if user has any special role and redirect to appropriate dashboard
    if (user.email === "souroveahmed15@gmail.com") {
      // Admin user - could have dual roles
      redirectPath = "/admin"; // Default to admin dashboard
    } else if (user.role === "Pro User") {
      redirectPath = "/pro";
    } else if (user.role === "Student") {
      redirectPath = "/student";
    } else if (user.role === "Teacher") {
      redirectPath = "/teacher";
    } else {
      redirectPath = "/dashboard";
    }

    console.log(`Redirecting to: ${redirectPath}`);
    return <Navigate to={redirectPath} replace />;
  }

  // If authenticated and role check passed, render the protected component
  return children;
}

export default ProtectedRoute;
