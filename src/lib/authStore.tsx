import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { fetchMe, type AuthUser } from './api';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);
const STORAGE_KEY = 'itil4_auth';

interface Stored {
  token: string;
  user: AuthUser;
}

function load(): Stored | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Stored;
  } catch {
    return null;
  }
}

function save(s: Stored | null) {
  if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  else localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = load();
    if (!stored) {
      setLoading(false);
      return;
    }
    // Validar token contra el backend (refresca user state)
    fetchMe(stored.token)
      .then(r => {
        setToken(stored.token);
        setUser(r.user);
        save({ token: stored.token, user: r.user });
      })
      .catch(() => {
        save(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (newToken: string, newUser: AuthUser) => {
    save({ token: newToken, user: newUser });
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    save(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
