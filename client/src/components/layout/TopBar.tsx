import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Bell, Search, Settings, User, LogOut, Clock, AlertTriangle, Calendar, CheckCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { signOutUser } from "@/lib/auth";
import { useLocation } from "wouter";
import { useCollection } from "@/hooks/useFirestore";
import { where, orderBy } from "firebase/firestore";
import { format, isAfter, isBefore, subDays, startOfDay } from "date-fns";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Fetch data for notifications
  const { data: tasks } = useCollection("tasks", user?.uid ? [
    where("assigneeId", "==", user.uid),
    orderBy("dueDate", "asc")
  ] : []);

  const { data: timeEntries } = useCollection("timeEntries", user?.uid ? [
    where("userId", "==", user.uid),
    orderBy("startTime", "desc")
  ] : []);

  const { data: events } = useCollection("events", user?.uid ? [
    where("userId", "==", user.uid),
    orderBy("date", "asc")
  ] : []);

  const { data: projects } = useCollection("projects", user?.uid ? [
    where("ownerId", "==", user.uid),
    orderBy("updatedAt", "desc")
  ] : []);

  // Generate notifications
  const generateNotifications = () => {
    const notifications = [];
    const now = new Date();
    const today = startOfDay(now);
    const yesterday = subDays(today, 1);

    // Overdue tasks
    const overdueTasks = tasks?.filter(task => 
      task.dueDate && 
      isBefore(task.dueDate.toDate(), today) && 
      task.status !== "completed"
    ) || [];

    if (overdueTasks.length > 0) {
      notifications.push({
        id: "overdue-tasks",
        type: "urgent",
        icon: AlertTriangle,
        title: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,
        description: `${overdueTasks[0]?.title}${overdueTasks.length > 1 ? ` and ${overdueTasks.length - 1} more` : ''}`,
        time: "Overdue",
        action: () => navigate("/projects")
      });
    }

    // Tasks due today
    const tasksDueToday = tasks?.filter(task => 
      task.dueDate && 
      format(task.dueDate.toDate(), "yyyy-MM-dd") === format(today, "yyyy-MM-dd") && 
      task.status !== "completed"
    ) || [];

    if (tasksDueToday.length > 0) {
      notifications.push({
        id: "due-today",
        type: "warning",
        icon: Calendar,
        title: `${tasksDueToday.length} task${tasksDueToday.length > 1 ? 's' : ''} due today`,
        description: tasksDueToday[0]?.title,
        time: "Today",
        action: () => navigate("/projects")
      });
    }

    // Time tracking reminder (no entries yesterday)
    const yesterdayEntries = timeEntries?.filter(entry =>
      entry.startTime && 
      format(entry.startTime.toDate(), "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd")
    ) || [];

    if (yesterdayEntries.length === 0 && timeEntries && timeEntries.length > 0) {
      notifications.push({
        id: "time-reminder",
        type: "info",
        icon: Clock,
        title: "Don't forget to track your time",
        description: "No time entries logged yesterday",
        time: "1 day ago",
        action: () => navigate("/time-tracking")
      });
    }

    // Upcoming calendar events (today)
    const todayEvents = events?.filter(event =>
      event.date && 
      format(event.date.toDate(), "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
    ) || [];

    if (todayEvents.length > 0) {
      notifications.push({
        id: "today-events",
        type: "info",
        icon: Calendar,
        title: `${todayEvents.length} event${todayEvents.length > 1 ? 's' : ''} today`,
        description: todayEvents[0]?.title,
        time: "Today",
        action: () => navigate("/calendar")
      });
    }

    // Project milestone (recently updated projects)
    const recentProjects = projects?.filter(project =>
      project.updatedAt && 
      isAfter(project.updatedAt.toDate(), subDays(now, 3))
    ) || [];

    if (recentProjects.length > 0) {
      notifications.push({
        id: "project-updates",
        type: "success",
        icon: CheckCircle,
        title: "Recent project activity",
        description: `${recentProjects[0]?.name} was updated`,
        time: "Recent",
        action: () => navigate("/projects")
      });
    }

    return notifications.filter(notification => 
      !dismissedNotifications.includes(notification.id)
    );
  };

  const notifications = generateNotifications();

  const dismissNotification = (notificationId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDismissedNotifications(prev => [...prev, notificationId]);
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setShowSignOutModal(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleMyAccount = () => {
    navigate("/profile");
  };

  const handleSignOutClick = () => {
    setShowSignOutModal(true);
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "urgent": return "text-red-400";
      case "warning": return "text-yellow-400";
      case "success": return "text-green-400";
      default: return "text-blue-400";
    }
  };

  return (
    <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
        {subtitle && (
          <span className="text-sm text-slate-400">{subtitle}</span>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 pl-10 bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-blue-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
        
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="relative text-slate-300 hover:text-slate-100 hover:bg-slate-800"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-red-600"
                >
                  {notifications.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-80 bg-slate-900 border-slate-700"
          >
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
                <p className="text-xs">You're all caught up!</p>
              </div>
            ) : (
              <>
                <div className="px-4 py-2 border-b border-slate-700">
                  <h4 className="font-semibold text-slate-100">Notifications</h4>
                  <p className="text-xs text-slate-400">{notifications.length} new alert{notifications.length !== 1 ? 's' : ''}</p>
                </div>
                <div className={`${notifications.length > 5 ? 'max-h-80 overflow-y-auto' : ''}`}>
                  {notifications.map((notification) => {
                    const IconComponent = notification.icon;
                    return (
                      <DropdownMenuItem
                        key={notification.id}
                        onClick={notification.action}
                        className="p-3 cursor-pointer hover:bg-slate-800 focus:bg-slate-800 relative"
                      >
                        <div className="flex items-start space-x-3 w-full pr-8">
                          <IconComponent 
                            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${getNotificationColor(notification.type)}`} 
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {notification.description}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => dismissNotification(notification.id, e)}
                          className="absolute top-2 right-2 h-6 w-6 p-0 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Settings Dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-slate-100 hover:bg-slate-800"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-900 border-slate-700">
              <DropdownMenuItem 
                onClick={handleMyAccount}
                className="text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                <User className="w-4 h-4 mr-2" />
                My Account
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleSignOutClick}
                className="text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Sign Out Confirmation Modal */}
      <AlertDialog open={showSignOutModal} onOpenChange={setShowSignOutModal}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">Sign Out</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to sign out? You'll need to sign back in to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
