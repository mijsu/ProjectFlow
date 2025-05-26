
import { useState, useEffect } from "react";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useCollection, addDocument } from "@/hooks/useFirestore";
import { where, orderBy } from "firebase/firestore";
import { format, startOfMonth, endOfMonth, isSameDay, getDaysInMonth, startOfWeek, endOfWeek, addDays, isToday } from "date-fns";
import { Plus, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventType, setEventType] = useState("meeting");
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch events with better error handling
  const { data: events, loading: eventsLoading, error } = useCollection("events", [
    where("userId", "==", user?.uid || ""),
    orderBy("startTime", "asc")
  ]);

  // Handle Firestore connection errors
  useEffect(() => {
    if (error) {
      console.warn("Firestore connection error:", error);
      toast({
        title: "Connection Issue",
        description: "There might be a connection issue. Events will reload automatically.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const eventsForSelectedDate = events?.filter(event => 
    event.startTime && isSameDay(event.startTime.toDate(), selectedDate)
  ) || [];

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events?.filter(event => 
      event.startTime && isSameDay(event.startTime.toDate(), date)
    ) || [];
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    const days = [];
    let current = start;

    while (current <= end) {
      days.push(current);
      current = addDays(current, 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!eventTitle.trim() || !eventStartTime || !eventEndTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const startDateTime = new Date(`${format(selectedDate, "yyyy-MM-dd")}T${eventStartTime}`);
      const endDateTime = new Date(`${format(selectedDate, "yyyy-MM-dd")}T${eventEndTime}`);

      if (endDateTime <= startDateTime) {
        throw new Error("End time must be after start time");
      }

      const eventData = {
        title: eventTitle.trim(),
        description: eventDescription.trim(),
        type: eventType,
        startTime: startDateTime,
        endTime: endDateTime,
        userId: user.uid,
      };

      await addDocument("events", eventData);
      
      toast({
        title: "Success",
        description: "Event created successfully!",
      });
      
      // Reset form
      setEventTitle("");
      setEventDescription("");
      setEventType("meeting");
      setEventStartTime("");
      setEventEndTime("");
      setIsEventFormOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Calendar" />
      
      <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Modern Calendar */}
          <Card className="xl:col-span-3 bg-slate-950 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-slate-100">
                {format(currentMonth, "MMMM yyyy")}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={() => setIsEventFormOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Event
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-slate-400">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const dayEvents = getEventsForDate(day);
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isSelected = isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);
                  
                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        min-h-[120px] p-2 border border-slate-800 cursor-pointer transition-colors
                        hover:bg-slate-800/50 rounded-lg
                        ${isSelected ? 'bg-emerald-600/20 border-emerald-600' : ''}
                        ${isTodayDate ? 'bg-blue-600/10 border-blue-600/50' : ''}
                        ${!isCurrentMonth ? 'opacity-30' : ''}
                      `}
                    >
                      <div className={`
                        text-sm font-medium mb-1 flex items-center justify-center w-6 h-6 rounded-full
                        ${isTodayDate ? 'bg-blue-600 text-white' : 'text-slate-300'}
                        ${isSelected ? 'text-emerald-400' : ''}
                      `}>
                        {day.getDate()}
                      </div>
                      
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event, eventIndex) => (
                          <div
                            key={eventIndex}
                            className={`
                              text-xs p-1 rounded truncate text-white
                              ${event.type === 'meeting' ? 'bg-blue-600' : 
                                event.type === 'deadline' ? 'bg-red-600' : 'bg-green-600'}
                            `}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-slate-400 p-1">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Events for Selected Date */}
          <Card className="bg-slate-950 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-100">
                Events for {format(selectedDate, "MMM d, yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {eventsLoading ? (
                  <p className="text-slate-400 text-sm">Loading events...</p>
                ) : eventsForSelectedDate.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-slate-400 text-sm mb-3">No events scheduled</p>
                    <Button 
                      onClick={() => setIsEventFormOpen(true)}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Event
                    </Button>
                  </div>
                ) : (
                  eventsForSelectedDate.map((event) => (
                    <div key={event.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                      <h4 className="font-medium text-slate-200 mb-1">{event.title}</h4>
                      <div className="flex items-center text-xs text-slate-400 mb-2">
                        <Clock className="w-3 h-3 mr-1" />
                        {format(event.startTime.toDate(), "h:mm a")} - {format(event.endTime.toDate(), "h:mm a")}
                      </div>
                      {event.description && (
                        <p className="text-sm text-slate-400 mb-2">{event.description}</p>
                      )}
                      <span className={`inline-block px-2 py-1 rounded text-xs ${
                        event.type === "meeting" ? "bg-blue-600/20 text-blue-400" :
                        event.type === "deadline" ? "bg-red-600/20 text-red-400" :
                        "bg-green-600/20 text-green-400"
                      }`}>
                        {event.type}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Creation Dialog */}
        <Dialog open={isEventFormOpen} onOpenChange={setIsEventFormOpen}>
          <DialogContent className="max-w-md bg-slate-950 border-slate-800 text-slate-100">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Create New Event</DialogTitle>
              <p className="text-slate-400">For {format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
            </DialogHeader>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-200">Event Title</Label>
                <Input
                  id="title"
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700 text-slate-100"
                  placeholder="Enter event title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-200">Description</Label>
                <Textarea
                  id="description"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-100 resize-none"
                  placeholder="Enter event description"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-slate-200">Event Type</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-slate-200">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    required
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-slate-200">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    required
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEventFormOpen(false)}
                  className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
