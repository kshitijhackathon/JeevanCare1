import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  // Check if JWT token exists
  const token = localStorage.getItem('authToken');
  const userData = localStorage.getItem('userData');
  
  // If we have token and user data in localStorage, use it directly
  if (token && userData) {
    try {
      const user = JSON.parse(userData);
      return {
        user,
        isLoading: false,
        isAuthenticated: true,
      };
    } catch (error) {
      // If parsing fails, clear storage and continue with API call
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    }
  }
  
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: !!token, // Only fetch if token exists
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!token && !!user,
  };
}
