import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user profile on mount if token exists
  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
          }
        } catch (err) {
          console.warn("Auth check failed:", err.message);
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.login(email, password);
      if (res.token) {
        localStorage.setItem("token", res.token);
        setToken(res.token);
        setUser(res.user);
        return { success: true };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  const signup = async (username, email, password) => {
    setError(null);
    try {
      const res = await api.signup(username, email, password);
      if (res.token) {
        localStorage.setItem("token", res.token);
        setToken(res.token);
        setUser(res.user);
        return { success: true };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      // ignore
    } finally {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      setError(null);
    }
  };

  const updateUserSettings = async (newSettings) => {
    try {
      const res = await api.updateSettings(newSettings);
      if (res.success && res.data?.settings) {
        setUser((prev) => prev ? { ...prev, settings: res.data.settings } : prev);
      }
      return res;
    } catch (err) {
      throw err;
    }
  };

  const updateUserProfile = async (profileData) => {
    try {
      const res = await api.updateProfile(profileData);
      if (res.success && res.data) {
        setUser((prev) => prev ? { ...prev, ...res.data } : prev);
      }
      return res;
    } catch (err) {
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        signup,
        logout,
        updateUserSettings,
        updateUserProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
