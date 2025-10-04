import React, { useState } from 'react';
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

const Dashboard: React.FC = () => {
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Sample notifications data
  const notifications = [
    {
      id: 1,
      title: "Event Approved",
      message: "Your Annual Budget Meeting has been approved",
      type: "status",
      category: "upcoming",
      time: "2 hours ago",
      read: false,
      icon: CheckCircle,
      iconColor: "text-green-600"
    },
    {
      id: 2,
      title: "New Event Tagged",
      message: "You've been tagged in IT Security Training",
      type: "tagged",
      category: "tagged",
      time: "4 hours ago",
      read: false,
      icon: Tag,
      iconColor: "text-blue-600"
    },
    {
      id: 3,
      title: "Event Reminder",
      message: "Department Head Meeting is tomorrow at 10:30 AM",
      type: "upcoming",
      category: "upcoming",
      time: "1 day ago",
      read: true,
      icon: AlertCircle,
      iconColor: "text-orange-600"
    },
    {
      id: 4,
      title: "Status Update",
      message: "Public Health Seminar status changed to confirmed",
      type: "status",
      category: "status",
      time: "2 days ago",
      read: true,
      icon: CheckCircle,
      iconColor: "text-green-600"
    }
  ];

  // Sample upcoming events data
  const upcomingEvents = [
    {
      id: 1,
      title: "Annual Budget Meeting",
      department: "Finance Department",
      date: "2024-10-15",
      time: "09:00 AM",
      location: "Conference Room A",
      status: "confirmed"
    },
    {
      id: 2,
      title: "IT Security Training",
      department: "Information Technology",
      date: "2024-10-18",
      time: "02:00 PM",
      location: "Training Center",
      status: "pending"
    },
    {
      id: 3,
      title: "Department Head Meeting",
      department: "Administration",
      date: "2024-10-20",
      time: "10:30 AM",
      location: "Executive Hall",
      status: "confirmed"
    },
    {
      id: 4,
      title: "Public Health Seminar",
      department: "Health Department",
      date: "2024-10-22",
      time: "08:00 AM",
      location: "Main Auditorium",
      status: "confirmed"
    }
  ];

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
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
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
                    {notifications.map((notification) => {
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
                    })}
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
                <p className="text-3xl font-bold text-blue-600 mt-1">24</p>
                <p className="text-sm text-gray-500">All time events</p>
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
                <p className="text-3xl font-bold text-green-600 mt-1">8</p>
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
                <p className="text-3xl font-bold text-purple-600 mt-1">12</p>
                <p className="text-sm text-gray-500">Your department</p>
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
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                  <p className="text-sm text-gray-600 truncate">{event.department}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{event.date} at {event.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <Badge variant={event.status === 'confirmed' ? 'default' : 'secondary'}>
                    {event.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
