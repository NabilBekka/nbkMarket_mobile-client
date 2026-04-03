import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/services/api";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  role: string;
  lang: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  isLoading: true,
  login: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("nbk-access-token").then((savedToken) => {
      if (savedToken) {
        api.auth.getMe(savedToken).then((res) => {
          if (res.data?.user) {
            setUser(res.data.user as User);
            setAccessToken(savedToken);
          } else {
            AsyncStorage.removeItem("nbk-access-token");
          }
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });
  }, []);

  const login = (token: string, userData: User) => {
    AsyncStorage.setItem("nbk-access-token", token);
    setAccessToken(token);
    setUser(userData);
  };

  const logout = async () => {
    if (accessToken) {
      await api.auth.logout(accessToken);
    }
    await AsyncStorage.removeItem("nbk-access-token");
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
