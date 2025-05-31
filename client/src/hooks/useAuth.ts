import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import type { User } from "@shared/schema";

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUserData = localStorage.getItem('userData');
    
    setToken(storedToken);
    setUserData(storedUserData);
    setIsReady(true);
    
    // Listen for storage changes (logout from other tabs)
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('authToken');
      const newUserData = localStorage.getItem('userData');
      
      setToken(newToken);
      setUserData(newUserData);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const { data: apiUser, isLoading: queryLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: isReady && !!token && !userData,
    retry: false,
  });

  // Parse user data
  let user = null;
  if (userData) {
    try {
      user = JSON.parse(userData);
    } catch (error) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      setToken(null);
      setUserData(null);
    }
  } else if (apiUser) {
    user = apiUser;
  }

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setToken(null);
    setUserData(null);
    window.location.href = '/';
  };

  return {
    user,
    isLoading: !isReady || queryLoading,
    isAuthenticated: !!(token && user),
    logout
  };
}
