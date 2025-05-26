
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Plus, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "@/hooks/useFirestore";
import { where, orderBy, Timestamp } from "firebase/firestore";
import { format, isToday, isTomorrow, addDays, startOfDay, endOfDay } from "date-fns";
import { Link } from "wouter";

export default function TodayEvents() {
  const { user } = useAuth();
  
  const { data: events, loading } = useCollection("events", [
    where("userId", "==", user?.uid || ""),
    where("startTime", ">=", Timestamp.fromDate(startOfDay(new Date()))),
    where("startTime", "<=", Timestamp.fromDate(endOfDay(addDays(new Date(), 7)))),
    orderBy("startTime", "asc")
  ]);

  const todayEvents = events?.filter(event => 
    event.startTime && isToday(event.startTime.toDate())
  ) || [];

  const upcomingEvents = events?.filter(event => 
    event.startTime && !isToday(event.startTime.toDate())
  ).slice(0, 3) || [];

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      case 'deadline': return 'bg-red-600/20 text-red-400 border-red-600/30';
      case 'reminder': return 'bg-green-600/20 text-green-400 border-green-600/30';
      default: return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  const getRelativeDate = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  if (loading) {
    return (
      <Card className="bg-slate-950 border-slate-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-950 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-500" />
          Today's Schedule
        </CardTitle>
        <Link href="/calendar">
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {todayEvents.length === 0 && upcomingEvents.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm mb-4">No events scheduled</p>
            <Link href="/calendar">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-3 h-3 mr-1" />
                Add Event
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Today's Events */}
            {todayEvents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Today ({todayEvents.length})
                </h4>
                <div className="space-y-2">
                  {todayEvents.slice(0, 3).map((event, index) => (
                    <div key={event.id || index} className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-slate-200 text-sm">{event.title}</h5>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getEventTypeColor(event.type)}`}>
                          {event.type}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-slate-400">
                        <Clock className="w-3 h-3 mr-1" />
                        {format(event.startTime.toDate(), "h:mm a")} - {format(event.endTime.toDate(), "h:mm a")}
                      </div>
                    </div>
                  ))}
                  {todayEvents.length > 3 && (
                    <Link href="/calendar">
                      <Button variant="ghost" size="sm" className="w-full text-slate-400 hover:text-slate-300">
                        +{todayEvents.length - 3} more events
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3">Upcoming</h4>
                <div className="space-y-2">
                  {upcomingEvents.map((event, index) => (
                    <div key={event.id || index} className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/50">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-medium text-slate-300 text-sm">{event.title}</h5>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getEventTypeColor(event.type)}`}>
                          {event.type}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{getRelativeDate(event.startTime.toDate())}</span>
                        <span>{format(event.startTime.toDate(), "h:mm a")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
