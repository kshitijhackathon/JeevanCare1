import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  // Check if JWT token exists
  const token = localStorage.getItem('authToken');
  
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
