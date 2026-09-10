import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  PublicUser,
} from "../lib/api";

const TOKEN_KEY = "boardgame_access_token";

interface AuthContextValue {
  user: PublicUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (savedToken) {
          const currentUser = await getCurrentUser(savedToken);
          setToken(savedToken);
          setUser(currentUser);
        }
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    setError(null);
    try {
      const { accessToken } = await loginUser({ email, password });
      await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
      const currentUser = await getCurrentUser(accessToken);
      setToken(accessToken);
      setUser(currentUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      throw err;
    }
  }

  async function register(email: string, password: string, name: string) {
    setError(null);
    try {
      const { accessToken } = await registerUser({ email, password, name });
      await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
      const currentUser = await getCurrentUser(accessToken);
      setToken(accessToken);
      setUser(currentUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      throw err;
    }
  }

  async function logout() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, error, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used with an AuthProvider");
  return ctx;
}
