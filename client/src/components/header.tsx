import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { HeartHandshake, Bell, User, X, Calendar, Heart, Pill, FileText } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function Header() {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch notifications
  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: showNotifications,
  });

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'health_alert': return <Heart className="w-4 h-4 text-red-500" />;
      case 'appointment': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'medication': return <Pill className="w-4 h-4 text-green-500" />;
      case 'report': return <FileText className="w-4 h-4 text-purple-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

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
        <div className="flex items-center space-x-3 relative">
          {/* Notification Bell */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-full relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center p-0">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {unreadCount} new
                      </Badge>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowNotifications(false)}
                      className="p-1"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications && notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification: any) => (
                      <div key={notification.id} className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}>
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 line-clamp-2">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {notification.message || 'New notification'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(notification.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center">
                      <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No notifications yet</p>
                    </div>
                  )}
                </div>

                {notifications && notifications.length > 5 && (
                  <div className="p-3 border-t border-gray-100">
                    <Link href="/notifications">
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setShowNotifications(false)}>
                        View All Notifications
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

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

      {/* Overlay to close notifications when clicking outside */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </header>
  );
}
