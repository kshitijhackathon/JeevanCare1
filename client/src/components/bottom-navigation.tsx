import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, MessageCircle, Calendar, User, Bell } from 'lucide-react';

const BottomNavigation = () => {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: MessageCircle, label: 'AI Chat', path: '/ai-consultation' },
    { icon: Calendar, label: 'Reports', path: '/reports' },
    { icon: Bell, label: 'Alerts', path: '/notifications' },
    { icon: User, label: 'Profile', path: '/profile-simple' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center py-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <Link key={item.path} href={item.path}>
              <div className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
              }`}>
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;