import React, { useState, useEffect, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import PastPapersNavigator from "./components/PastPapersNavigator";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";
import DashboardRedirect from "./components/DashboardRedirect";
import HelpSupport from "./components/HelpSupport";
import { useIsMobile, useIsTablet, useIsDesktop } from "./hooks/useMediaQuery";

function App() {
  const { user } = useAuth();
  const [showFileNavigator, setShowFileNavigator] = useState(true);

  // Use enhanced media query hooks
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const isSmallScreen = isMobile || isTablet;

  const toggleFileNavigator = () => {
    setShowFileNavigator(!showFileNavigator);
  };

  // Loading component
  const LoadingScreen = () => (
    <div className="flex h-screen items-center justify-center bg-[#0D1321] text-white">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p className="text-lg">Loading...</p>
      </div>
    </div>
  );

  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        {isSmallScreen ? (
          // Mobile and Tablet Routes - Unified Experience
          <Routes>
            <Route
              path="/"
              element={
                <PastPapersNavigator
                  isMobileApp={true}
                  sidebarFileNavigatorOpen={showFileNavigator}
                  onToggleFileNavigator={toggleFileNavigator}
                />
              }
            />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/help" element={<HelpSupport />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        ) : (
          // Desktop Routes with Sidebar
          <div className="flex h-screen bg-[#0D1321] text-white">
            <Sidebar
              showFileNavigator={showFileNavigator}
              toggleFileNavigator={toggleFileNavigator}
            />
            <div className="flex-1 overflow-hidden">
              <Routes>
                <Route
                  path="/"
                  element={
                    <PastPapersNavigator
                      sidebarFileNavigatorOpen={showFileNavigator}
                      onToggleFileNavigator={toggleFileNavigator}
                    />
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <UserDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole="Admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/help" element={<HelpSupport />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </div>
        )}
      </Suspense>
    </Router>
  );
}

export default App;
