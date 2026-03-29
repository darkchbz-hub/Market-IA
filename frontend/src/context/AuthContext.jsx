import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../lib/api.js";

const TOKEN_KEY = "marketzone_token";
const USER_KEY = "marketzone_user";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let active = true;

    apiFetch("/auth/me", { token })
      .then((payload) => {
        if (!active) {
          return;
        }

        setUser(payload.user);
        localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setToken("");
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  const setSession = (session) => {
    setToken(session.token);
    setUser(session.user);
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  };

  const login = async (credentials) => {
    const session = await apiFetch("/auth/login", {
      method: "POST",
      body: credentials
    });

    setSession(session);
    return session;
  };

  const register = async (payload) => {
    const session = await apiFetch("/auth/register", {
      method: "POST",
      body: payload
    });

    setSession(session);
    return session;
  };

  const refreshUser = async () => {
    if (!token) {
      return null;
    }

    const payload = await apiFetch("/auth/me", { token });
    setUser(payload.user);
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    return payload.user;
  };

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: Boolean(token && user),
        isAdmin: user?.role === "admin",
        login,
        register,
        refreshUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return context;
}
