import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const fetchUser = useCallback(async () => {
    setIsAuthenticating(true);
    try {
      const response = await fetch(`${BASE_URL}/user`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("AuthContext: Error fetching user info:", err);
      setUser(null);
    } finally {
      // Small delay to ensure the overlay is visible and smooth
      setTimeout(() => setIsAuthenticating(false), 500);
    }
  }, [BASE_URL]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, setUser, isAuthenticating, setIsAuthenticating, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
