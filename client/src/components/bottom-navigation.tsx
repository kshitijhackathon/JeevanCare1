import { Link, useLocation } from "wouter";
import { Home, FileText, Bell, User, Globe } from "lucide-react";

export default function BottomNavigation() {
  const [location] = useLocation();

  const navItems = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Reports", icon: FileText, path: "/reports" },
    { name: "Heatmap", icon: Globe, path: "/heatmap" },
    { name: "Profile", icon: User, path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.name} href={item.path}>
              <button className={`flex flex-col items-center py-2 px-3 transition-colors ${
                isActive ? 'text-secondary' : 'text-gray-400 hover:text-secondary'
              }`}>
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.name}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
