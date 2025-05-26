import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "@/hooks/useFirestore";
import { where, orderBy, limit } from "firebase/firestore";
import { 
  LayoutDashboard, 
  FileText, 
  FolderOpen, 
  Calendar, 
  Clock, 
  Plus,
  Settings,
  User
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Time Tracking", href: "/time-tracking", icon: Clock },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const { data: recentProjects } = useCollection("projects", [
    where("ownerId", "==", user?.uid || ""),
    orderBy("updatedAt", "desc"),
    limit(3)
  ]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-progress":
        return "bg-emerald-500";
      case "planning":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "on-hold":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
      {/* Logo & User */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-slate-100">ProjectFlow</h1>
        </div>
        
        {user && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || ""} 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <span className="text-sm font-medium text-white">
                  {getInitials(user.displayName || user.email || "U")}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-100 truncate">
                {user.displayName || "User"}
              </p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <div
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                      isActive
                        ? "bg-emerald-600/10 text-emerald-400 border border-emerald-600/20"
                        : "text-slate-300 hover:bg-slate-800/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Recent Projects */}
        <div className="mt-8">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
            Recent Projects
          </h3>
          <ul className="space-y-1">
            {recentProjects?.map((project) => (
              <li key={project.id}>
                <Link href={`/projects/${project.id}`}>
                  <div className="flex items-center space-x-2 px-2 py-1 text-sm rounded hover:bg-slate-800/30 transition-colors text-slate-300 cursor-pointer">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                    <span className="truncate">{project.name}</span>
                  </div>
                </Link>
              </li>
            ))}
            {recentProjects?.length === 0 && (
              <li className="text-xs text-slate-500 px-2 py-1">No recent projects</li>
            )}
          </ul>
        </div>
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-800">
        <Link href="/projects">
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>
    </aside>
  );
}
