import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus, CalendarPlus, Play } from "lucide-react";
import { useLocation } from "wouter";
import { useCollection } from "@/hooks/useFirestore";
import { where, orderBy, limit } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

export default function QuickActions() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  const { data: upcomingEvents } = useCollection("events", [
    where("userId", "==", user?.uid || ""),
    where("startTime", ">=", new Date()),
    orderBy("startTime", "asc"),
    limit(3)
  ]);

  const quickActions = [
    {
      label: "New Document",
      icon: Plus,
      action: () => navigate("/documents/new"),
      bgColor: "bg-emerald-600 hover:bg-emerald-700",
    },
    {
      label: "Create Project",
      icon: FolderPlus,
      action: () => navigate("/projects/new"),
      bgColor: "bg-blue-600 hover:bg-blue-700",
    },
    {
      label: "Schedule Event",
      icon: CalendarPlus,
      action: () => navigate("/calendar"),
      bgColor: "bg-slate-700 hover:bg-slate-600",
    },
    {
      label: "Start Time Tracking",
      icon: Play,
      action: () => navigate("/time-tracking"),
      bgColor: "bg-slate-700 hover:bg-slate-600",
    },
  ];

  return (
    <Card className="bg-slate-950 border-slate-800">
      <CardHeader>
        <CardTitle className="text-slate-100">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                onClick={action.action}
                className={`w-full flex items-center justify-start space-x-3 ${action.bgColor} text-white`}
              >
                <Icon className="w-4 h-4" />
                <span>{action.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Upcoming Events */}
        <div className="mt-8">
          <h4 className="text-sm font-medium text-slate-400 mb-3">Upcoming Events</h4>
          <div className="space-y-3">
            {upcomingEvents?.length === 0 ? (
              <p className="text-slate-500 text-sm">No upcoming events</p>
            ) : (
              upcomingEvents?.map((event) => (
                <div key={event.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <p className="text-sm font-medium text-slate-200">{event.title}</p>
                  <p className="text-xs text-slate-400">
                    {event.startTime && format(event.startTime.toDate(), "MMM d, h:mm a")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
