import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Bell,
  AlertTriangle,
  Heart,
  Calendar,
  MapPin,
  FileText,
  Clock,
  Check,
  X,
  Settings,
  Filter,
  Shield,
  Thermometer,
  Activity,
  Pill,
  Stethoscope
} from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Notification {
  id: number;
  type: 'health_alert' | 'appointment' | 'medication' | 'emergency' | 'report' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionText?: string;
  category: string;
  metadata?: any;
}

export default function Notifications() {
  const [filter, setFilter] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', filter],
    queryFn: async () => {
      const response = await fetch(`/api/notifications?filter=${filter}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    }
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = priority === 'critical' ? 'text-red-500' :
                     priority === 'high' ? 'text-orange-500' :
                     priority === 'medium' ? 'text-yellow-500' : 'text-blue-500';

    switch (type) {
      case 'health_alert': return <Heart className={`w-5 h-5 ${iconClass}`} />;
      case 'appointment': return <Calendar className={`w-5 h-5 ${iconClass}`} />;
      case 'medication': return <Pill className={`w-5 h-5 ${iconClass}`} />;
      case 'emergency': return <Shield className={`w-5 h-5 ${iconClass}`} />;
      case 'report': return <FileText className={`w-5 h-5 ${iconClass}`} />;
      default: return <Bell className={`w-5 h-5 ${iconClass}`} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const filterTypes = [
    { value: 'all', label: 'All', icon: Bell },
    { value: 'health_alert', label: 'Health Alerts', icon: Heart },
    { value: 'appointment', label: 'Appointments', icon: Calendar },
    { value: 'medication', label: 'Medications', icon: Pill },
    { value: 'emergency', label: 'Emergency', icon: Shield },
    { value: 'report', label: 'Reports', icon: FileText }
  ];

  const filteredNotifications = notifications?.filter(notification => {
    if (showUnreadOnly && notification.read) return false;
    return true;
  }) || [];

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="mobile-container bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Notifications</h1>
          {unreadCount > 0 && (
            <Badge className="bg-red-500">
              {unreadCount} new
            </Badge>
          )}
          <div className="ml-auto flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending || unreadCount === 0}
            >
              <Check className="w-4 h-4 mr-1" />
              Mark All Read
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Bell className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-lg font-bold text-gray-900">{notifications?.length || 0}</p>
              <p className="text-xs text-gray-600">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-lg font-bold text-gray-900">{unreadCount}</p>
              <p className="text-xs text-gray-600">Unread</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Shield className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <p className="text-lg font-bold text-gray-900">
                {notifications?.filter(n => n.priority === 'critical' || n.priority === 'high').length || 0}
              </p>
              <p className="text-xs text-gray-600">Priority</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Filter by Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {filterTypes.map(filterType => (
                    <button
                      key={filterType.value}
                      onClick={() => setFilter(filterType.value)}
                      className={`p-2 text-xs rounded-lg border transition-colors ${
                        filter === filterType.value
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <filterType.icon className="w-4 h-4 mx-auto mb-1" />
                      {filterType.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    checked={showUnreadOnly}
                    onChange={(e) => setShowUnreadOnly(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Show unread only</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Notifications</span>
              <Badge variant="outline">
                {filteredNotifications.length} notifications
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="flex space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`border transition-all hover:shadow-md ${
                      !notification.read ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${
                          !notification.read ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {getNotificationIcon(notification.type, notification.priority)}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className={`font-medium text-sm ${
                                !notification.read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.category} • {getTimeAgo(notification.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                                {notification.priority}
                              </Badge>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 mb-3">
                            {notification.message}
                          </p>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between">
                            <div className="flex space-x-2">
                              {notification.actionUrl && (
                                <Link href={notification.actionUrl}>
                                  <Button size="sm" variant="outline">
                                    {notification.actionText || 'View Details'}
                                  </Button>
                                </Link>
                              )}
                              {!notification.read && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => markAsReadMutation.mutate(notification.id)}
                                  disabled={markAsReadMutation.isPending}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Mark Read
                                </Button>
                              )}
                            </div>

                            <div className="flex items-center text-xs text-gray-400">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">
                  {showUnreadOnly ? 'No unread notifications' : 'No notifications found'}
                </p>
                <p className="text-sm text-gray-400">
                  {filter === 'all' 
                    ? 'New notifications will appear here'
                    : `No ${filter.replace('_', ' ')} notifications found`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Notification Preferences</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Health Alerts</p>
                  <p className="text-xs text-gray-600">Critical health conditions and warnings</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded border-gray-300" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Appointment Reminders</p>
                  <p className="text-xs text-gray-600">Upcoming doctor appointments and consultations</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded border-gray-300" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Medication Reminders</p>
                  <p className="text-xs text-gray-600">Medicine schedules and refill alerts</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded border-gray-300" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Global Health Updates</p>
                  <p className="text-xs text-gray-600">Disease outbreaks and health advisories</p>
                </div>
                <input type="checkbox" className="rounded border-gray-300" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Report Updates</p>
                  <p className="text-xs text-gray-600">New test results and medical reports</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded border-gray-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}