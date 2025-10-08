import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Calendar, 
  CalendarDays, 
  Building2, 
  Bell,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  Tag,
  X
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

interface Event {
  _id: string;
  eventTitle: string;
  requestor: string;
  requestorDepartment?: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  status: string;
  participants: number;
  taggedDepartments: string[];
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  time: string;
  read: boolean;
  icon: any;
  iconColor: string;
  eventId?: string;
}

const Dashboard: React.FC = () => {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUserEvents, setTotalUserEvents] = useState(0);
  const [totalSystemEvents, setTotalSystemEvents] = useState(0);

  // Helper function to format time
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Helper function to calculate days until event
  const getDaysUntilEvent = (eventDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const event = new Date(eventDate);
    event.setHours(0, 0, 0, 0);
    
    const diffTime = event.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Helper function to generate notification message
  const generateNotificationMessage = (event: Event): string => {
    const daysUntil = getDaysUntilEvent(event.startDate);
    const formattedTime = formatTime(event.startTime);
    
    if (daysUntil === 1) {
      return `Your event "${event.eventTitle}" is tomorrow at ${formattedTime}`;
    } else if (daysUntil === 2) {
      return `Your event "${event.eventTitle}" is coming in 2 days at ${formattedTime}`;
    } else if (daysUntil > 0 && daysUntil <= 7) {
      return `Your event "${event.eventTitle}" is coming in ${daysUntil} days at ${formattedTime}`;
    }
    return `Your event "${event.eventTitle}" is scheduled for ${event.startDate} at ${formattedTime}`;
  };

  // Generate notifications from upcoming events
  const generateUpcomingEventNotifications = (events: Event[]): Notification[] => {
    const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
    const userDepartment = currentUser.department || currentUser.departmentName || '';
    
    return events
      .filter(event => {
        const daysUntil = getDaysUntilEvent(event.startDate);
        // Show notifications for events happening in the next 7 days
        return daysUntil >= 0 && daysUntil <= 7 && 
               (event.requestor === currentUser.name || 
                event.requestorDepartment === userDepartment ||
                event.taggedDepartments?.includes(userDepartment));
      })
      .map(event => ({
        id: `upcoming-${event._id}`,
        title: "Upcoming Event",
        message: generateNotificationMessage(event),
        type: "upcoming",
        category: "upcoming",
        time: getDaysUntilEvent(event.startDate) === 1 ? "Tomorrow" : 
              getDaysUntilEvent(event.startDate) === 2 ? "In 2 days" :
              `In ${getDaysUntilEvent(event.startDate)} days`,
        read: false,
        icon: AlertCircle,
        iconColor: getDaysUntilEvent(event.startDate) === 1 ? "text-red-600" : "text-orange-600",
        eventId: event._id
      }));
  };

  // Fetch user's events and generate notifications
  const fetchEventsAndNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch user's own events only
      const userResponse = await axios.get(`${API_BASE_URL}/events/my`, { headers });

      if (userResponse.data.success) {
        const userEvents = userResponse.data.data || [];
        
        // Set total user events count
        setTotalUserEvents(userEvents.length);
        
        // Filter upcoming events (next 30 days) - only user's own events
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);
        
        const upcoming = userEvents.filter((event: Event) => {
          const eventDate = new Date(event.startDate);
          return eventDate >= now && eventDate <= thirtyDaysFromNow && 
                 (event.status === 'approved' || event.status === 'submitted');
        });
        
        setUpcomingEvents(upcoming);
        
        // For notifications and total system events count, fetch all events
        const allEventsResponse = await axios.get(`${API_BASE_URL}/events`, { headers });
        if (allEventsResponse.data.success) {
          const allEvents = allEventsResponse.data.data || [];
          
          // Set total system events count (all events in the system)
          setTotalSystemEvents(allEvents.length);
          
          const allUpcoming = allEvents.filter((event: Event) => {
            const eventDate = new Date(event.startDate);
            return eventDate >= now && eventDate <= thirtyDaysFromNow && 
                   (event.status === 'approved' || event.status === 'submitted');
          });
          
          // Generate notifications from all upcoming events (including tagged ones)
          const eventNotifications = generateUpcomingEventNotifications(allUpcoming);
          setNotifications(eventNotifications);
          
          console.log(`📊 User Events: ${userEvents.length}, System Events: ${allEvents.length}`);
          console.log(`📅 Found ${upcoming.length} user's upcoming events`);
          console.log(`🔔 Generated ${eventNotifications.length} notifications from all events`);
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setNotifications([]);
      setUpcomingEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchEventsAndNotifications();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Notification */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to the Event Scheduler Dashboard</p>
        </div>
        
        {/* Notification Dropdown */}
        <DropdownMenu open={notificationOpen} onOpenChange={setNotificationOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 p-0" align="end">
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Notifications</h3>
                <Button variant="ghost" size="sm" onClick={() => setNotificationOpen(false)} className="h-6 w-6 p-0">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <Tabs defaultValue="all" className="w-full">
              <div className="px-3 pt-2">
                <TabsList className="grid w-full grid-cols-4 h-8">
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                  <TabsTrigger value="upcoming" className="text-xs">Upcoming</TabsTrigger>
                  <TabsTrigger value="tagged" className="text-xs">Tagged</TabsTrigger>
                  <TabsTrigger value="status" className="text-xs">Status</TabsTrigger>
                </TabsList>
              </div>
              
              <div className="max-h-72 overflow-y-auto">
                <TabsContent value="all" className="mt-0">
                  <div className="space-y-0">
                    {loading ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-xs text-gray-500 mt-2">Loading notifications...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-4 text-center">
                        <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => {
                        const IconComponent = notification.icon;
                        return (
                          <div key={notification.id} className={`p-3 hover:bg-gray-50 transition-colors border-l-2 ${
                            !notification.read ? 'border-l-blue-500 bg-blue-50/20' : 'border-l-transparent'
                          }`}>
                            <div className="flex items-start gap-2">
                              <div className={`p-1 rounded ${notification.iconColor}`}>
                                <IconComponent className="h-3 w-3" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-medium text-xs text-gray-900 leading-tight">{notification.title}</h4>
                                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{notification.time}</span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{notification.message}</p>
                                {!notification.read && (
                                  <Badge variant="secondary" className="text-xs mt-1 h-4 px-1">New</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="upcoming" className="mt-0">
                  <div className="space-y-1">
                    {notifications.filter(n => n.category === 'upcoming').map((notification) => {
                      const IconComponent = notification.icon;
                      return (
                        <div key={notification.id} className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                          !notification.read ? 'border-l-blue-500 bg-blue-50/30' : 'border-l-transparent'
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg bg-gray-100 ${notification.iconColor}`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm text-gray-900">{notification.title}</h4>
                                <span className="text-xs text-gray-500">{notification.time}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              {!notification.read && (
                                <div className="mt-2">
                                  <Badge variant="secondary" className="text-xs">New</Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
                
                <TabsContent value="tagged" className="mt-0">
                  <div className="space-y-1">
                    {notifications.filter(n => n.category === 'tagged').map((notification) => {
                      const IconComponent = notification.icon;
                      return (
                        <div key={notification.id} className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                          !notification.read ? 'border-l-blue-500 bg-blue-50/30' : 'border-l-transparent'
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg bg-gray-100 ${notification.iconColor}`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm text-gray-900">{notification.title}</h4>
                                <span className="text-xs text-gray-500">{notification.time}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              {!notification.read && (
                                <div className="mt-2">
                                  <Badge variant="secondary" className="text-xs">New</Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
                
                <TabsContent value="status" className="mt-0">
                  <div className="space-y-1">
                    {notifications.filter(n => n.category === 'status').map((notification) => {
                      const IconComponent = notification.icon;
                      return (
                        <div key={notification.id} className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                          !notification.read ? 'border-l-blue-500 bg-blue-50/30' : 'border-l-transparent'
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg bg-gray-100 ${notification.iconColor}`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm text-gray-900">{notification.title}</h4>
                                <span className="text-xs text-gray-500">{notification.time}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              {!notification.read && (
                                <div className="mt-2">
                                  <Badge variant="secondary" className="text-xs">New</Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              </div>
              
              <div className="p-2 border-t">
                <Button variant="outline" className="w-full h-8 text-xs">
                  View All Notifications
                </Button>
              </div>
            </Tabs>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total Events</h3>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {loading ? '...' : totalUserEvents}
                </p>
                <p className="text-sm text-gray-500">Your events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CalendarDays className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {loading ? '...' : upcomingEvents.length}
                </p>
                <p className="text-sm text-gray-500">Next 30 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Department Events</h3>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {loading ? '...' : totalSystemEvents}
                </p>
                <p className="text-sm text-gray-500">All system events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Upcoming Events Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Upcoming Events</CardTitle>
            <Button variant="outline" size="sm" className="gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading upcoming events...</p>
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Events</h3>
                <p className="text-gray-500">You don't have any upcoming events in the next 30 days.</p>
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <div key={event._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{event.eventTitle}</h3>
                    <p className="text-sm text-gray-600 truncate">
                      {event.requestorDepartment || 'Unknown Department'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(event.startDate).toLocaleDateString()} at {formatTime(event.startTime)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <Badge variant={event.status === 'approved' ? 'default' : 'secondary'}>
                      {event.status === 'approved' ? 'Approved' : event.status === 'submitted' ? 'Pending' : event.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
