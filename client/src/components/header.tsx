import { Bell, Menu, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function Header() {
  const { user } = useAuth();
  const [location] = useLocation();
  const isHomePage = location === '/';

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-primary">JeevanCare</h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="p-2">
            <Search className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Welcome Section - Only on Home Page */}
      {isHomePage && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-3 rounded-lg mb-3 mx-4 mt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Welcome!</h2>
              <p className="text-sm font-medium text-gray-600">
                {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <img 
                src={user?.profileImageUrl || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64"}
                alt="Profile" 
                className="w-8 h-8 rounded-full object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}