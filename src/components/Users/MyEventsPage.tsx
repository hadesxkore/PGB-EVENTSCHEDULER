import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Building2,
  FileText,
  Search,
  Filter,
  Eye,
  Trash2,
  Plus,
  RefreshCw,
  FileText as DescriptionIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock3,
  Download,
  Paperclip,
  Edit
} from 'lucide-react';

interface Event {
  _id: string;
  eventTitle: string;
  requestor: string;
  location: string;
  description?: string;
  participants: number;
  vip?: number;
  vvip?: number;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  contactNumber: string;
  contactEmail: string;
  attachments?: Array<{
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
  }>;
  govFiles?: {
    brieferTemplate?: {
      filename: string;
      originalName: string;
      mimetype: string;
      size: number;
    };
    availableForDL?: {
      filename: string;
      originalName: string;
      mimetype: string;
      size: number;
    };
    programme?: {
      filename: string;
      originalName: string;
      mimetype: string;
      size: number;
    };
  };
  taggedDepartments: string[];
  departmentRequirements: any;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'completed';
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = 'http://localhost:5000/api';

const locations = [
  'Add Custom Location',
  'Atrium',
  'Grand Lobby Entrance',
  'Main Entrance Lobby',
  'Main Entrance Leasable Area',
  '4th Flr. Conference Room 1',
  '4th Flr. Conference Room 2',
  '4th Flr. Conference Room 3',
  '5th Flr. Training Room 1 (BAC)',
  '5th Flr. Training Room 2',
  '6th Flr. DPOD',
  'Bataan People\'s Center',
  'Capitol Quadrangle',
  '1BOSSCO',
  'Emiliana Hall',
  'Pavillion'
];

const MyEventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState<string>('');
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedEventFiles, setSelectedEventFiles] = useState<Event | null>(null);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [selectedEditEvent, setSelectedEditEvent] = useState<Event | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: ''
  });
  const [showCustomLocationInput, setShowCustomLocationInput] = useState(false);
  const [customLocation, setCustomLocation] = useState('');

  // Fetch user's events
  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.get(`${API_BASE_URL}/events/my`, { headers });

      if (response.data.success) {
        setEvents(response.data.data);
        console.log('✅ Events loaded:', response.data.data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events', {
        description: 'Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  // Filter events based on search and status
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.requestor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get status badge variant and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'draft':
        return { 
          variant: 'secondary' as const, 
          icon: <FileText className="w-3 h-3" />,
          label: 'Draft'
        };
      case 'submitted':
        return { 
          variant: 'default' as const, 
          icon: <Clock3 className="w-3 h-3" />,
          label: 'Submitted'
        };
      case 'approved':
        return { 
          variant: 'default' as const, 
          icon: <CheckCircle className="w-3 h-3" />,
          label: 'Approved',
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'rejected':
        return { 
          variant: 'destructive' as const, 
          icon: <XCircle className="w-3 h-3" />,
          label: 'Rejected'
        };
      case 'completed':
        return { 
          variant: 'default' as const, 
          icon: <CheckCircle className="w-3 h-3" />,
          label: 'Completed',
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      default:
        return { 
          variant: 'secondary' as const, 
          icon: <AlertCircle className="w-3 h-3" />,
          label: status
        };
    }
  };

  // Format time helper
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // View event details
  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  // Delete event
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      await axios.delete(`${API_BASE_URL}/events/${eventId}`, { headers });
      
      toast.success('Event deleted successfully');
      fetchMyEvents(); // Refresh the list
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  // Handle description modal
  const handleShowDescription = (description: string) => {
    setSelectedDescription(description);
    setShowDescriptionModal(true);
  };

  // Handle files modal
  const handleShowFiles = (event: Event) => {
    setSelectedEventFiles(event);
    setShowFilesModal(true);
  };

  // Handle edit event
  const handleEditEvent = (event: Event) => {
    setSelectedEditEvent(event);
    setEditFormData({
      location: event.location,
      startDate: event.startDate,
      startTime: event.startTime,
      endDate: event.endDate,
      endTime: event.endTime
    });
    setShowCustomLocationInput(false);
    setCustomLocation('');
    setShowEditModal(true);
  };

  // Handle save edited event
  const handleSaveEditedEvent = async () => {
    if (!selectedEditEvent) return;

    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const updateData = {
        location: editFormData.location,
        startDate: editFormData.startDate,
        startTime: editFormData.startTime,
        endDate: editFormData.endDate,
        endTime: editFormData.endTime
      };

      const response = await axios.put(
        `${API_BASE_URL}/events/${selectedEditEvent._id}`, 
        updateData, 
        { headers }
      );

      if (response.data.success) {
        toast.success('Event updated successfully!');
        setShowEditModal(false);
        fetchMyEvents(); // Refresh the events list
      } else {
        toast.error('Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    }
  };

  return (
    <div className="p-4 max-w-[95%] mx-auto">
      <Card className="shadow-lg">
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-2xl font-semibold">My Events</h1>
              <p className="text-sm text-muted-foreground">
                View and manage your event requests
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={fetchMyEvents}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button
                onClick={() => window.location.href = '/users/request-event'}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                New Event
              </Button>
            </div>
          </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{events.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="text-2xl font-bold text-orange-600">
                  {events.filter(e => e.status === 'submitted').length}
                </p>
              </div>
              <Clock3 className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {events.filter(e => e.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {events.filter(e => e.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search events by title, location, or requestor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Events List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4 mt-8 max-h-[70vh] overflow-y-auto pr-2"
      >
        {loading ? (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading your events...</span>
              </div>
            </CardContent>
          </Card>
        ) : filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No events found' : 'No events yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'You haven\'t created any event requests yet.'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => window.location.href = '/users/request-event'}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Event
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredEvents.map((event, index) => {
            const statusInfo = getStatusInfo(event.status);
            
            return (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Status Badge and Right Actions */}
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant={statusInfo.variant}
                            className={`gap-1 ${statusInfo.className || ''}`}
                          >
                            {statusInfo.icon}
                            {statusInfo.label}
                          </Badge>
                          
                          {/* Right Side Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditEvent(event)}
                              className="gap-1 h-7 px-2 text-xs"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </Button>
                            {(event.status === 'draft' || event.status === 'rejected') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteEvent(event._id)}
                                className="gap-1 h-7 px-2 text-xs text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Title */}
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate" title={event.eventTitle}>
                            {event.eventTitle}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Requested by {event.requestor}
                          </p>
                        </div>

                        {/* Event Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <CalendarIcon className="w-4 h-4" />
                            <span>
                              {format(new Date(event.startDate), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>
                              {formatTime(event.startTime)} - {formatTime(event.endTime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{event.participants} participants</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            <span>{event.taggedDepartments.length} departments</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Created {format(new Date(event.createdAt), 'MMM dd, yyyy')}
                          </div>
                        </div>

                        {/* Bottom Action Buttons */}
                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewEvent(event)}
                            className="gap-1 h-7 px-2 text-xs"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShowDescription(event.description || 'No description available')}
                            className="gap-1 h-7 px-2 text-xs"
                          >
                            <DescriptionIcon className="w-3 h-3" />
                            Description
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShowFiles(event)}
                            className="gap-1 h-7 px-2 text-xs"
                          >
                            <Paperclip className="w-3 h-3" />
                            Files
                          </Button>
                        </div>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          </div>
        )}
      </motion.div>

      {/* Event Details Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="max-w-none w-[40vw] min-w-[40vw] max-h-[90vh] overflow-y-auto p-8" style={{ width: '40vw', maxWidth: '40vw' }}>
          <DialogHeader>
            <DialogTitle className="text-xl">Event Details</DialogTitle>
            <DialogDescription>
              Complete information about your event request
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Event Title</label>
                    <p className="text-sm text-gray-900 mt-1 truncate" title={selectedEvent.eventTitle}>{selectedEvent.eventTitle}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Requestor</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedEvent.requestor}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Location</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedEvent.location}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">
                      <Badge 
                        variant={getStatusInfo(selectedEvent.status).variant}
                        className={`gap-1 ${getStatusInfo(selectedEvent.status).className || ''}`}
                      >
                        {getStatusInfo(selectedEvent.status).icon}
                        {getStatusInfo(selectedEvent.status).label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Participants</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedEvent.participants} total
                      {selectedEvent.vip && selectedEvent.vip > 0 && ` (${selectedEvent.vip} VIP)`}
                      {selectedEvent.vvip && selectedEvent.vvip > 0 && ` (${selectedEvent.vvip} VVIP)`}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Contact Number</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedEvent.contactNumber}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Contact Email</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedEvent.contactEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created</label>
                    <p className="text-sm text-gray-900 mt-1">{format(new Date(selectedEvent.createdAt), 'PPp')}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Schedule */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Schedule</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Start</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(selectedEvent.startDate), 'EEEE, MMMM dd, yyyy')} at {formatTime(selectedEvent.startTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium">End</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(selectedEvent.endDate), 'EEEE, MMMM dd, yyyy')} at {formatTime(selectedEvent.endTime)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tagged Departments */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Tagged Departments</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.taggedDepartments.map((dept, index) => (
                    <Badge key={index} variant="outline" className="gap-1">
                      <Building2 className="w-3 h-3" />
                      {dept}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Timestamps - Bottom Right */}
              <div className="flex justify-end">
                {selectedEvent.submittedAt && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Submitted:</span> {format(new Date(selectedEvent.submittedAt), 'PPpp')}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Description Modal */}
      <Dialog open={showDescriptionModal} onOpenChange={setShowDescriptionModal}>
        <DialogContent className="max-w-2xl w-[85vw] max-h-[80vh] p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-medium text-gray-900">
              Event Description
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-1">
              Detailed information about this event
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <div className="bg-white rounded-md p-5 border border-gray-200 shadow-sm max-h-[50vh] overflow-y-auto">
              <p className="text-gray-800 leading-relaxed text-base whitespace-pre-wrap font-normal">
                {selectedDescription}
              </p>
            </div>
          </div>
          
          <div className="flex justify-center pt-4">
            <Button 
              onClick={() => setShowDescriptionModal(false)}
              variant="outline"
              className="px-6 py-2"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Files Modal */}
      <Dialog open={showFilesModal} onOpenChange={setShowFilesModal}>
        <DialogContent className="max-w-3xl w-[75vw] max-h-[80vh] overflow-y-auto p-5">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-medium text-gray-900">
              Event Files
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              All attachments and government files for this event
            </DialogDescription>
          </DialogHeader>
          
          {selectedEventFiles && (
            <div className="space-y-6">
              {/* Regular Attachments */}
              {selectedEventFiles.attachments && selectedEventFiles.attachments.length > 0 && (
                <div>
                  <h4 className="text-base font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attachments ({selectedEventFiles.attachments.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedEventFiles.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{attachment.originalName}</p>
                            <p className="text-xs text-gray-500">
                              {attachment.mimetype} • {(attachment.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.open(`${API_BASE_URL}/events/attachment/${attachment.filename}`, '_blank');
                            }}
                            className="gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.open(`${API_BASE_URL}/events/attachment/${attachment.filename}?download=true`, '_blank');
                            }}
                            className="gap-1"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Government Files */}
              {selectedEventFiles.govFiles && (
                selectedEventFiles.govFiles.brieferTemplate || 
                selectedEventFiles.govFiles.availableForDL || 
                selectedEventFiles.govFiles.programme
              ) && (
                <div>
                  <h4 className="text-base font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Government Files
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {/* Briefer Template */}
                    {selectedEventFiles.govFiles.brieferTemplate && (
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{selectedEventFiles.govFiles.brieferTemplate.originalName}</p>
                            <p className="text-xs text-gray-500">
                              {selectedEventFiles.govFiles.brieferTemplate.mimetype} • {(selectedEventFiles.govFiles.brieferTemplate.size / 1024).toFixed(1)} KB
                            </p>
                            <p className="text-xs text-green-600 font-medium">Briefer Template</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.open(`${API_BASE_URL}/events/govfile/${selectedEventFiles.govFiles!.brieferTemplate!.filename}`, '_blank');
                            }}
                            className="gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.open(`${API_BASE_URL}/events/govfile/${selectedEventFiles.govFiles!.brieferTemplate!.filename}?download=true`, '_blank');
                            }}
                            className="gap-1"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Available for DL */}
                    {selectedEventFiles.govFiles.availableForDL && (
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{selectedEventFiles.govFiles.availableForDL.originalName}</p>
                            <p className="text-xs text-gray-500">
                              {selectedEventFiles.govFiles.availableForDL.mimetype} • {(selectedEventFiles.govFiles.availableForDL.size / 1024).toFixed(1)} KB
                            </p>
                            <p className="text-xs text-green-600 font-medium">Available for DL</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.open(`${API_BASE_URL}/events/govfile/${selectedEventFiles.govFiles!.availableForDL!.filename}`, '_blank');
                            }}
                            className="gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.open(`${API_BASE_URL}/events/govfile/${selectedEventFiles.govFiles!.availableForDL!.filename}?download=true`, '_blank');
                            }}
                            className="gap-1"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Programme */}
                    {selectedEventFiles.govFiles.programme && (
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{selectedEventFiles.govFiles.programme.originalName}</p>
                            <p className="text-xs text-gray-500">
                              {selectedEventFiles.govFiles.programme.mimetype} • {(selectedEventFiles.govFiles.programme.size / 1024).toFixed(1)} KB
                            </p>
                            <p className="text-xs text-green-600 font-medium">Programme</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.open(`${API_BASE_URL}/events/govfile/${selectedEventFiles.govFiles!.programme!.filename}`, '_blank');
                            }}
                            className="gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.open(`${API_BASE_URL}/events/govfile/${selectedEventFiles.govFiles!.programme!.filename}?download=true`, '_blank');
                            }}
                            className="gap-1"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No Files Message */}
              {(!selectedEventFiles.attachments || selectedEventFiles.attachments.length === 0) && 
               (!selectedEventFiles.govFiles || 
                (!selectedEventFiles.govFiles.brieferTemplate && 
                 !selectedEventFiles.govFiles.availableForDL && 
                 !selectedEventFiles.govFiles.programme)) && (
                <div className="text-center py-8">
                  <Paperclip className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Files Attached</h3>
                  <p className="text-gray-500">This event doesn't have any attachments or government files.</p>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-center pt-4 mt-6">
            <Button 
              onClick={() => setShowFilesModal(false)}
              variant="outline"
              className="px-6 py-2"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl w-[85vw] p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-medium text-gray-900">
              Edit Event
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Update location, dates, and times for this event
            </DialogDescription>
          </DialogHeader>
          
          {selectedEditEvent && (
            <div className="space-y-6">
              {/* Event Title (Read-only) */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Event Title</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                  <p className="text-sm text-gray-900">{selectedEditEvent.eventTitle}</p>
                </div>
              </div>

              {/* Location Section */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Location</Label>
                <div className="space-y-3 mt-1">
                  <Select 
                    value={editFormData.location || (showCustomLocationInput ? 'Add Custom Location' : '')} 
                    onValueChange={(value) => {
                      if (value === 'Add Custom Location') {
                        setShowCustomLocationInput(true);
                        setCustomLocation('');
                      } else {
                        setShowCustomLocationInput(false);
                        setEditFormData(prev => ({ ...prev, location: value }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Show custom location if it exists and is not in the predefined list */}
                      {editFormData.location && !locations.includes(editFormData.location) && (
                        <SelectItem key={editFormData.location} value={editFormData.location}>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span>{editFormData.location}</span>
                            <span className="text-xs text-gray-500">(Custom)</span>
                          </div>
                        </SelectItem>
                      )}
                      
                      {/* Predefined locations */}
                      {locations.map((location) => (
                        <SelectItem 
                          key={location} 
                          value={location}
                          className={location === 'Add Custom Location' ? 'text-blue-600 font-medium' : ''}
                        >
                          <div className="flex items-center gap-2">
                            {location === 'Add Custom Location' && (
                              <Plus className="w-4 h-4 text-blue-600" />
                            )}
                            <span className={location === 'Add Custom Location' ? 'text-blue-600' : ''}>
                              {location}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Custom Location Input */}
                  {showCustomLocationInput && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter custom location"
                        value={customLocation}
                        onChange={(e) => setCustomLocation(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (customLocation.trim()) {
                            setEditFormData(prev => ({ ...prev, location: customLocation.trim() }));
                            setShowCustomLocationInput(false);
                            setCustomLocation('');
                          }
                        }}
                        className="px-3"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Date and Time Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Date & Time */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">Start</h4>
                  
                  {/* Start Date */}
                  <div>
                    <Label className="text-xs text-gray-600">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal mt-1"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editFormData.startDate ? format(new Date(editFormData.startDate), 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={editFormData.startDate ? new Date(editFormData.startDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setEditFormData(prev => ({ ...prev, startDate: date.toISOString().split('T')[0] }));
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Start Time */}
                  <div>
                    <Label className="text-xs text-gray-600">Time</Label>
                    <Input
                      type="time"
                      value={editFormData.startTime}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* End Date & Time */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">End</h4>
                  
                  {/* End Date */}
                  <div>
                    <Label className="text-xs text-gray-600">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal mt-1"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editFormData.endDate ? format(new Date(editFormData.endDate), 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={editFormData.endDate ? new Date(editFormData.endDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setEditFormData(prev => ({ ...prev, endDate: date.toISOString().split('T')[0] }));
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* End Time */}
                  <div>
                    <Label className="text-xs text-gray-600">Time</Label>
                    <Input
                      type="time"
                      value={editFormData.endTime}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveEditedEvent}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyEventsPage;
