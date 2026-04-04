import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/services/api";
import { useLang } from "@/context/LangContext";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  birth_date?: string;
  role: string;
  lang: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  isLoading: true,
  login: () => {},
  logout: async () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setLang } = useLang();

  const applyUserLang = (userData: User) => {
    if (userData.lang === "en" || userData.lang === "fr") {
      setLang(userData.lang);
    }
  };

  useEffect(() => {
    AsyncStorage.getItem("nbk-access-token").then((savedToken) => {
      if (savedToken) {
        api.auth.getMe(savedToken).then((res) => {
          if (res.data?.user) {
            const u = res.data.user as User;
            setUser(u);
            setAccessToken(savedToken);
            applyUserLang(u);
          } else {
            AsyncStorage.removeItem("nbk-access-token");
          }
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (token: string, userData: User) => {
    AsyncStorage.setItem("nbk-access-token", token);
    setAccessToken(token);
    setUser(userData);
    applyUserLang(userData);
  };

  const logout = async () => {
    if (accessToken) {
      await api.auth.logout(accessToken);
    }
    await AsyncStorage.removeItem("nbk-access-token");
    setAccessToken(null);
    setUser(null);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
