
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
import { format, startOfMonth, endOfMonth, isSameDay, startOfWeek, endOfWeek, addDays, isToday, subMonths, addMonths, isWithinInterval } from "date-fns";
import { Plus, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, MapPin, Users } from "lucide-react";
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
  const [localEvents, setLocalEvents] = useState<any[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch events with better date range filtering
  const startOfRange = startOfMonth(subMonths(currentMonth, 1));
  const endOfRange = endOfMonth(addMonths(currentMonth, 1));
  
  const { data: events, loading: eventsLoading, error } = useCollection("events", [
    where("userId", "==", user?.uid || ""),
    orderBy("startTime", "asc")
  ]);

  // Filter events to current view range and combine with local events
  const filteredEvents = events?.filter(event => {
    if (!event.startTime) return false;
    const eventDate = event.startTime.toDate();
    return isWithinInterval(eventDate, { start: startOfRange, end: endOfRange });
  }) || [];

  const allEvents = [...filteredEvents, ...localEvents];

  // Debug logging
  useEffect(() => {
    console.log("Events from Firestore:", events?.length || 0);
    console.log("Filtered events:", filteredEvents.length);
    console.log("Local events:", localEvents.length);
    console.log("All events:", allEvents.length);
  }, [events, filteredEvents, localEvents, allEvents]);

  // Handle Firestore connection errors with better UX
  useEffect(() => {
    if (error) {
      console.warn("Firestore connection error:", error);
      toast({
        title: "Connection Issue",
        description: "Some events may not be visible. Trying to reconnect...",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Sync local events to Firestore when connection is restored
  useEffect(() => {
    if (events && localEvents.length > 0 && !error) {
      // Try to sync local events to Firestore
      const syncLocalEvents = async () => {
        for (const localEvent of localEvents) {
          if (localEvent.isLocal) {
            try {
              await addDocument("events", {
                title: localEvent.title,
                description: localEvent.description,
                type: localEvent.type,
                startTime: localEvent.startTime.toDate(),
                endTime: localEvent.endTime.toDate(),
                userId: user?.uid,
                createdAt: new Date(),
              });
              
              // Remove from local storage after successful sync
              const updatedLocalEvents = localEvents.filter(e => e.id !== localEvent.id);
              setLocalEvents(updatedLocalEvents);
              localStorage.setItem('calendar-local-events', JSON.stringify(
                updatedLocalEvents.map(event => ({
                  ...event,
                  startTime: event.startTime.toDate().toISOString(),
                  endTime: event.endTime.toDate().toISOString()
                }))
              ));
            } catch (syncError) {
              console.warn("Failed to sync local event:", syncError);
            }
          }
        }
      };
      
      syncLocalEvents();
    }
  }, [events, localEvents, error, user?.uid]);

  // Persist local events to localStorage
  useEffect(() => {
    const savedEvents = localStorage.getItem('calendar-local-events');
    if (savedEvents) {
      try {
        const parsed = JSON.parse(savedEvents);
        setLocalEvents(parsed.map((event: any) => ({
          ...event,
          startTime: { toDate: () => new Date(event.startTime) },
          endTime: { toDate: () => new Date(event.endTime) }
        })));
      } catch (e) {
        console.warn('Failed to parse local events:', e);
      }
    }
  }, []);

  const eventsForSelectedDate = allEvents.filter(event => 
    event.startTime && isSameDay(event.startTime.toDate(), selectedDate)
  );

  // Debug selected date events
  useEffect(() => {
    console.log(`Events for ${format(selectedDate, "yyyy-MM-dd")}:`, eventsForSelectedDate.length);
  }, [selectedDate, eventsForSelectedDate]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return allEvents.filter(event => 
      event.startTime && isSameDay(event.startTime.toDate(), date)
    );
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
        createdAt: new Date(),
      };

      try {
        // Try to save to Firestore first
        await addDocument("events", eventData);
        toast({
          title: "Success",
          description: "Event created successfully!",
        });
      } catch (firestoreError) {
        // If Firestore fails, save locally
        const localEvent = {
          ...eventData,
          id: `local-${Date.now()}`,
          isLocal: true,
          startTime: { toDate: () => startDateTime },
          endTime: { toDate: () => endDateTime }
        };
        
        const updatedLocalEvents = [...localEvents, localEvent];
        setLocalEvents(updatedLocalEvents);
        
        // Persist to localStorage
        localStorage.setItem('calendar-local-events', JSON.stringify(
          updatedLocalEvents.map(event => ({
            ...event,
            startTime: event.startTime.toDate().toISOString(),
            endTime: event.endTime.toDate().toISOString()
          }))
        ));
        
        toast({
          title: "Saved Offline",
          description: "Event saved locally. Will sync when online.",
        });
      }
      
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

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-600';
      case 'deadline': return 'bg-red-600';
      case 'reminder': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const getEventTypeTextColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'text-blue-400 bg-blue-600/20';
      case 'deadline': return 'text-red-400 bg-red-600/20';
      case 'reminder': return 'text-green-400 bg-green-600/20';
      default: return 'text-gray-400 bg-gray-600/20';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Calendar" />
      
      <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {/* Enhanced Modern Calendar */}
          <Card className="xl:col-span-3 bg-slate-950 border-slate-800 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-4">
                <CardTitle className="text-2xl font-bold text-slate-100">
                  {format(currentMonth, "MMMM yyyy")}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                >
                  Today
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 h-9 w-9 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 h-9 w-9 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-slate-700 mx-2" />
                <Button 
                  onClick={() => setIsEventFormOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Event
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                  <div key={day} className="p-4 text-center">
                    <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                      {day.slice(0, 3)}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid */}
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
                        min-h-[140px] p-3 border border-slate-800 cursor-pointer transition-all duration-200
                        hover:bg-slate-800/50 hover:border-slate-700 rounded-xl
                        ${isSelected ? 'bg-emerald-600/20 border-emerald-600 ring-1 ring-emerald-600/50' : ''}
                        ${isTodayDate ? 'bg-blue-600/10 border-blue-600/50' : ''}
                        ${!isCurrentMonth ? 'opacity-30' : ''}
                      `}
                    >
                      <div className={`
                        text-sm font-semibold mb-2 flex items-center justify-center w-8 h-8 rounded-full transition-colors
                        ${isTodayDate ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300'}
                        ${isSelected && !isTodayDate ? 'text-emerald-400 bg-emerald-600/20' : ''}
                      `}>
                        {day.getDate()}
                      </div>
                      
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event, eventIndex) => (
                          <div
                            key={eventIndex}
                            className={`
                              text-xs p-2 rounded-lg truncate text-white shadow-sm transition-transform hover:scale-105
                              ${getEventTypeColor(event.type)}
                              ${event.isLocal ? 'opacity-75 border border-dashed border-white/30' : ''}
                            `}
                            title={`${event.title}${event.isLocal ? ' (Local)' : ''}`}
                          >
                            <div className="font-medium">{event.title}</div>
                            <div className="text-xs opacity-90">
                              {format(event.startTime.toDate(), "h:mm a")}
                            </div>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-slate-400 p-1 text-center bg-slate-800/50 rounded">
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

          {/* Enhanced Events Panel */}
          <Card className="bg-slate-950 border-slate-800 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-emerald-500" />
                {format(selectedDate, "MMM d, yyyy")}
              </CardTitle>
              <p className="text-sm text-slate-400">{format(selectedDate, "EEEE")}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {eventsLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-3"></div>
                    <p className="text-slate-400 text-sm">Loading events...</p>
                  </div>
                ) : eventsForSelectedDate.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm mb-4">No events scheduled</p>
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
                  eventsForSelectedDate.map((event, index) => (
                    <div key={event.id || index} className="p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                          {event.title}
                          {event.isLocal && (
                            <span className="text-xs bg-orange-600/20 text-orange-400 px-2 py-1 rounded">
                              Local
                            </span>
                          )}
                        </h4>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getEventTypeTextColor(event.type)}`}>
                          {event.type}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-slate-400 mb-3">
                        <Clock className="w-4 h-4 mr-2" />
                        {format(event.startTime.toDate(), "h:mm a")} - {format(event.endTime.toDate(), "h:mm a")}
                      </div>
                      
                      {event.description && (
                        <p className="text-sm text-slate-400 leading-relaxed bg-slate-800/50 p-3 rounded-lg">
                          {event.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Event Creation Dialog */}
        <Dialog open={isEventFormOpen} onOpenChange={setIsEventFormOpen}>
          <DialogContent className="max-w-md bg-slate-950 border-slate-800 text-slate-100 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-500" />
                Create New Event
              </DialogTitle>
              <p className="text-slate-400">For {format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
            </DialogHeader>

            <form onSubmit={handleCreateEvent} className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-200 font-medium">Event Title *</Label>
                <Input
                  id="title"
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700 text-slate-100 focus:border-emerald-500 focus:ring-emerald-500/20"
                  placeholder="Enter event title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-200 font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-100 resize-none focus:border-emerald-500 focus:ring-emerald-500/20"
                  placeholder="Enter event description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-slate-200 font-medium">Event Type</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 focus:border-emerald-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="meeting">🤝 Meeting</SelectItem>
                    <SelectItem value="deadline">⚡ Deadline</SelectItem>
                    <SelectItem value="reminder">📝 Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-slate-200 font-medium">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    required
                    className="bg-slate-800 border-slate-700 text-slate-100 focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-slate-200 font-medium">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    required
                    className="bg-slate-800 border-slate-700 text-slate-100 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6">
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
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
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
