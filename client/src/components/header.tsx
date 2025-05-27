import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { HeartHandshake, Bell, User } from "lucide-react";

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <HeartHandshake className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-lg text-gray-800">JeevanCare</h1>
            <p className="text-xs text-gray-500">Your AI Health Companion</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="rounded-full">
            <Bell className="w-5 h-5 text-gray-600" />
          </Button>
          <Link href="/profile">
            <Avatar className="w-8 h-8 border-2 border-primary cursor-pointer">
              <AvatarImage 
                src={user?.profileImageUrl} 
                alt={user?.firstName || "User"} 
              />
              <AvatarFallback className="bg-primary/10 text-primary">
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
