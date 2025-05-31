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
  
  // If we have token and user data in localStorage, use it directly
  if (isReady && token && userData) {
    try {
      const user = JSON.parse(userData);
      return {
        user,
        isLoading: false,
        isAuthenticated: true,
        logout: () => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          setToken(null);
          setUserData(null);
          window.location.href = '/';
        }
      };
    } catch (error) {
      // If parsing fails, clear storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      setToken(null);
      setUserData(null);
    }
  }
  
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: isReady && !!token,
    retry: false,
  });

  return {
    user,
    isLoading: !isReady || isLoading,
    isAuthenticated: !!(token && user),
    logout: () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      setToken(null);
      setUserData(null);
      window.location.href = '/';
    }
  };
}
