import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";
import {
  FileText,
  Clock,
  BarChart2,
  Lock,
  BookOpen,
  Shield,
  Brain,
  Filter,
  CheckCircle2,
  Loader2,
} from "lucide-react";

function Login() {
  const { handleLogin, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Check if user is already authenticated, if so redirect to home page
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Handle successful login and redirect
  const onLoginSuccess = async (credentialResponse) => {
    setIsLoggingIn(true);
    await handleLogin(credentialResponse);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#0D1321] text-white p-4 flex flex-col items-center justify-center">
      {/* Loading overlay */}
      {isLoggingIn && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
          <div className="text-center p-8 max-w-md bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-30"></div>
              <Loader2
                size={48}
                className="text-blue-500 animate-spin mx-auto"
              />
            </div>
            <p className="text-xl font-medium text-white mb-2">
              Signing you in...
            </p>
            <p className="text-gray-400 mb-6">
              Please wait while we prepare your dashboard
            </p>
            <div className="h-1.5 bg-gray-700 rounded-full w-full max-w-xs mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse-x"></div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Section - Features */}
        <div className="p-1 rounded-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-2xl opacity-30"></div>
          <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700 rounded-2xl p-8 relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-20"></div>
                <div className="relative bg-gray-900 rounded-full p-2 border border-blue-500/30">
                  <FileText size={28} className="text-blue-400" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                SouroVerse
              </h1>
            </div>

            <h2 className="text-2xl font-bold mb-4">
              Your Complete Exam Preparation Platform
            </h2>
            <p className="text-gray-300 mb-8">
              Join thousands of students who are acing their exams with our
              comprehensive preparation tools. Sign in to unlock all premium
              features and personalize your experience.
            </p>

            <div className="space-y-6">
              <div className="flex-1 space-y-4">
                <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                  Premium Features
                </h3>
                <div className="bg-gray-900/70 rounded-lg p-4 border border-gray-700">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">
                        Advanced mock exam tracking with detailed performance
                        analytics
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">
                        Filter past papers based on your preferred subjects
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">
                        Interactive dashboard with performance trends and
                        recommendations
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">
                        Coming soon: AI-powered mock grading and personalized
                        study plans
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Login Form */}
        <div className="p-1 rounded-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-2xl opacity-30"></div>
          <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700 rounded-2xl p-8 relative z-10">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-20"></div>
                <div className="relative bg-gray-900 rounded-full p-4 border border-blue-500/30 inline-block">
                  <Lock size={32} className="text-blue-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Sign In
              </h2>
              <p className="text-gray-300 mb-8">
                Access all premium features and personalize your experience
              </p>

              <div className="mt-4 mb-8">
                <GoogleLogin
                  onSuccess={onLoginSuccess}
                  onError={() => {
                    console.log("Login Failed");
                    setIsLoggingIn(false);
                  }}
                  useOneTap
                  theme="filled_blue"
                  text="signin_with"
                  shape="pill"
                  width="280"
                  disabled={isLoggingIn}
                />
              </div>

              <div className="bg-gray-900/70 rounded-lg p-4 border border-gray-700 max-w-sm">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-900/30 p-2 rounded-full mr-3">
                    <Clock size={18} className="text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-blue-300">
                      Mock Exam Timer
                    </h3>
                    <p className="text-xs text-gray-400">
                      Track and save your mock exam performance
                    </p>
                  </div>
                </div>

                <div className="flex items-center mb-4">
                  <div className="bg-blue-900/30 p-2 rounded-full mr-3">
                    <BarChart2 size={18} className="text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-blue-300">
                      Performance Dashboard
                    </h3>
                    <p className="text-xs text-gray-400">
                      View analytical insights into your progress
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="bg-blue-900/30 p-2 rounded-full mr-3">
                    <Filter size={18} className="text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-blue-300">
                      Subject Filtering
                    </h3>
                    <p className="text-xs text-gray-400">
                      Customize views with preferred subjects
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-gray-400 text-sm">
                <p>You can still access past papers without logging in</p>
                <a
                  href="/"
                  className="text-blue-400 hover:text-blue-300 underline mt-2 inline-block"
                >
                  Continue as guest
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
