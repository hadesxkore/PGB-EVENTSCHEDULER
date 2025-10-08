import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CustomCalendar, { type CalendarEvent } from '@/components/ui/custom-calendar';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  MapPin, 
  Calendar as CalendarIcon, 
  Plus,
  Building2,
  Save,
  Trash2,
  Lock,
  X,
  Filter,
  ChevronDown
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';

// Import Swiper styles
import 'swiper/swiper-bundle.css';
import '../../styles/swiper-custom.css';

const API_BASE_URL = 'http://localhost:5000/api';

interface LocationAvailability {
  _id?: string;
  date: string;
  locationName: string;
  capacity: number;
  description: string;
  status: 'available' | 'unavailable';
  departmentName?: string;
  createdAt?: string;
  updatedAt?: string;
}

const ManageLocationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [locationAvailabilities, setLocationAvailabilities] = useState<LocationAvailability[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [formData, setFormData] = useState({
    locationName: '',
    capacity: '',
    description: '',
    status: 'available' as 'available' | 'unavailable'
  });
  const [isAutoPopulated, setIsAutoPopulated] = useState(false);
  const [showCustomLocationInput, setShowCustomLocationInput] = useState(false);
  const [customLocationName, setCustomLocationName] = useState('');
  // Date filtering states
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedFilterDates, setSelectedFilterDates] = useState<string[]>([]);
  const [filteredLocationData, setFilteredLocationData] = useState<LocationAvailability[]>([]);
  
  const [locationsForDate, setLocationsForDate] = useState<Array<{
    locationName: string;
    capacity: string;
    description: string;
    status: 'available' | 'unavailable';
  }>>([]);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  // Default location names
  const defaultLocationNames = [
    'Atrium',
    'Grand Lobby Entrance',
    'Main Entrance Lobby',
    'Main Entrance Leasable Area',
    '4th Flr. Conference Room 1',
    '4th Flr. Conference Room 2',
    '4th Flr. Conference Room 3',
    '5th Flr. Training Room 1 (BAC)',
    '5th Flr. Training Room 2',
    '6th Flr. Meeting Room 7',
    '6th Flr. DPOD',
    'Bataan People\'s Center',
    '1BOSSCO',
    'Emiliana Hall',
    'Pavillion'
  ];

  // Get current user
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        loadLocationData();
      } catch (error) {
        console.error('Error parsing user data:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Filter location data based on selected dates
  useEffect(() => {
    if (selectedFilterDates.length === 0) {
      // No filter applied, show all data
      setFilteredLocationData(locationAvailabilities);
    } else {
      // Filter by selected dates
      const filtered = locationAvailabilities.filter(location => 
        selectedFilterDates.includes(location.date)
      );
      setFilteredLocationData(filtered);
    }
  }, [locationAvailabilities, selectedFilterDates]);

  // Get unique dates from location data for filter options
  const getAvailableDates = () => {
    const dates = [...new Set(locationAvailabilities.map(loc => loc.date))];
    return dates.sort();
  };


  // Clear all date filters
  const clearDateFilters = () => {
    setSelectedFilterDates([]);
  };

  const loadLocationData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/location-availability`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const locations = data.data || [];
        setLocationAvailabilities(locations);

        // Convert to calendar events
        const events: CalendarEvent[] = locations.map((location: LocationAvailability) => ({
          id: location._id!,
          date: location.date,
          title: `${location.locationName} (${location.status})`,
          type: location.status === 'available' ? 'available' : 'unavailable',
          notes: `Capacity: ${location.capacity} | ${location.description}`
        }));

        setCalendarEvents(events);
      } else {
        console.error('Failed to fetch location data');
      }
    } catch (error) {
      console.error('Error loading location data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = async (date: Date) => {
    setSelectedDate(date);
    setShowLocationModal(true);
    
    // Reload fresh data first to ensure we have the latest
    await loadLocationData();
    
    // Load existing locations for this date
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingLocations = locationAvailabilities.filter(loc => loc.date === dateStr);
    setLocationsForDate(existingLocations.map(loc => ({
      locationName: loc.locationName,
      capacity: loc.capacity.toString(),
      description: loc.description,
      status: loc.status
    })));
    
    // Reset form data
    setFormData({
      locationName: '',
      capacity: '',
      description: '',
      status: 'available'
    });
    setShowCustomLocationInput(false);
    setCustomLocationName('');
  };

  // Handle location name selection with auto-population
  const handleLocationNameSelect = (selectedLocationName: string) => {
    console.log('🏢 Location selected:', selectedLocationName);
    
    // Check if user selected "Add Custom Location"
    if (selectedLocationName === 'Add Custom Location') {
      setShowCustomLocationInput(true);
      setFormData({
        locationName: '',
        capacity: '',
        description: '',
        status: 'available'
      });
      setIsAutoPopulated(false);
      return;
    }
    
    // Hide custom input if a predefined location is selected
    setShowCustomLocationInput(false);
    setCustomLocationName('');
    
    // Find the most recent data for this location from existing records
    const existingLocationData = locationAvailabilities
      .filter(loc => loc.locationName === selectedLocationName)
      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
      .find(loc => loc.capacity && loc.description);

    if (existingLocationData) {
      console.log('✅ Auto-populating from existing data:', existingLocationData);
      
      // Create the auto-populated location data
      const autoPopulatedLocation = {
        locationName: selectedLocationName,
        capacity: existingLocationData.capacity.toString(),
        description: existingLocationData.description,
        status: 'available' as 'available' | 'unavailable'
      };
      
      // Automatically add to list since it's auto-populated
      setLocationsForDate(prev => [...prev, autoPopulatedLocation]);
      
      // Reset form for next entry
      setFormData({
        locationName: '',
        capacity: '',
        description: '',
        status: 'available'
      });
      setIsAutoPopulated(false);
      
      toast.success(`${selectedLocationName} auto-added to list with standardized data`);
    } else {
      console.log('ℹ️ No existing data found, using defaults');
      setFormData({
        locationName: selectedLocationName,
        capacity: '',
        description: '',
        status: 'available'
      });
      setIsAutoPopulated(false); // Mark as manual input (editable)
    }
  };

  // Handle custom location name confirmation
  const handleCustomLocationConfirm = () => {
    if (!customLocationName.trim()) {
      toast.error('Please enter a location name');
      return;
    }

    // Check if custom location already exists for this date
    const exists = locationsForDate.some(loc => 
      loc.locationName.toLowerCase() === customLocationName.trim().toLowerCase()
    );

    if (exists) {
      toast.error('Location already exists for this date');
      return;
    }

    // Set the custom location name in form data
    setFormData({
      locationName: customLocationName.trim(),
      capacity: '',
      description: '',
      status: 'available'
    });
    
    // Hide custom input and clear it
    setShowCustomLocationInput(false);
    setCustomLocationName('');
    
    toast.success(`Custom location "${customLocationName.trim()}" ready to configure`);
  };

  // Handle selecting all available locations at once
  const handleSelectAllLocations = async () => {
    // Get all available locations (not already in the list)
    const availableLocations = defaultLocationNames.filter(locationName => {
      const isAlreadyInList = locationsForDate.some(loc => 
        loc.locationName.toLowerCase() === locationName.toLowerCase()
      );
      return !isAlreadyInList;
    });

    if (availableLocations.length === 0) {
      toast.info('All locations are already added for this date');
      return;
    }

    // Create location objects with auto-populated data
    const newLocations: Array<{
      locationName: string;
      capacity: string;
      description: string;
      status: 'available' | 'unavailable';
    }> = [];
    
    for (const locationName of availableLocations) {
      // Find the most recent data for this location from existing records
      const existingLocationData = locationAvailabilities
        .filter(loc => loc.locationName === locationName)
        .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
        .find(loc => loc.capacity && loc.description);

      if (existingLocationData) {
        // Use existing data
        newLocations.push({
          locationName: locationName,
          capacity: existingLocationData.capacity.toString(),
          description: existingLocationData.description,
          status: 'available' as 'available' | 'unavailable'
        });
      } else {
        // Use default values - will need manual input
        newLocations.push({
          locationName: locationName,
          capacity: '',
          description: '',
          status: 'available' as 'available' | 'unavailable'
        });
      }
    }

    // Add all locations to the list
    setLocationsForDate(prev => [...prev, ...newLocations]);
    
    // Clear form data
    setFormData({
      locationName: '',
      capacity: '',
      description: '',
      status: 'available'
    });
    setShowCustomLocationInput(false);
    setCustomLocationName('');

    // Show success message
    const autoPopulatedCount = newLocations.filter(loc => loc.capacity && loc.description).length;
    const manualCount = newLocations.length - autoPopulatedCount;
    
    let message = `Added ${newLocations.length} location(s) to list`;
    if (autoPopulatedCount > 0 && manualCount > 0) {
      message += ` (${autoPopulatedCount} auto-filled, ${manualCount} need manual input)`;
    } else if (autoPopulatedCount > 0) {
      message += ` (all auto-filled with existing data)`;
    } else {
      message += ` (all need manual capacity/description input)`;
    }
    
    toast.success(message);
  };

  const handleAddLocation = () => {
    if (!formData.locationName || !formData.capacity) {
      toast.error('Please fill in location name and capacity');
      return;
    }

    // Check if location already exists for this date
    const exists = locationsForDate.some(loc => 
      loc.locationName.toLowerCase() === formData.locationName.toLowerCase()
    );

    if (exists) {
      toast.error('Location already exists for this date');
      return;
    }

    // Add to locations list with immediate UI update
    setLocationsForDate(prev => [...prev, { ...formData }]);
    
    // Show immediate feedback
    toast.success(`${formData.locationName} added to list`);
    
    // Reset form
    setFormData({
      locationName: '',
      capacity: '',
      description: '',
      status: 'available'
    });
  };

  const handleRemoveLocation = async (index: number) => {
    const locationToRemove = locationsForDate[index];
    setDeletingIndex(index); // Set loading state
    
    try {
      // Check if this location exists in the database (has been saved before)
      const dateStr = format(selectedDate!, 'yyyy-MM-dd');
      const existingLocation = locationAvailabilities.find(
        loc => loc.date === dateStr && 
               loc.locationName.toLowerCase() === locationToRemove.locationName.toLowerCase()
      );

      if (existingLocation && existingLocation._id) {
        // Delete from database
        const token = localStorage.getItem('authToken');
        if (!token) {
          toast.error('Please login to delete location');
          setDeletingIndex(null);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/location-availability/${existingLocation._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          toast.success(`${locationToRemove.locationName} deleted successfully`);
          
          // Immediately remove from UI first for instant feedback
          setLocationsForDate(prev => prev.filter((_, i) => i !== index));
          
          // Then reload data to sync with database and update all components
          await loadLocationData();
        } else {
          const result = await response.json();
          toast.error(result.message || 'Failed to delete location');
          setDeletingIndex(null);
          return; // Don't remove from UI if database deletion failed
        }
      } else {
        // Just remove from temporary list (location not saved to database yet)
        setLocationsForDate(prev => prev.filter((_, i) => i !== index));
        toast.success(`${locationToRemove.locationName} removed from list`);
      }
      
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Failed to delete location');
    } finally {
      setDeletingIndex(null); // Clear loading state
    }
  };

  const handleSaveAllLocations = async () => {
    if (!selectedDate) {
      toast.error('No date selected');
      return;
    }

    // Add current form data if it's filled
    let newLocationsToSave = [];
    if (formData.locationName && formData.capacity) {
      const exists = locationsForDate.some(loc => 
        loc.locationName.toLowerCase() === formData.locationName.toLowerCase()
      );
      if (!exists) {
        newLocationsToSave.push({ ...formData });
      }
    }

    // Only save NEW locations that don't exist in database yet
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existingLocationNames = locationAvailabilities
      .filter(loc => loc.date === dateStr)
      .map(loc => loc.locationName.toLowerCase());

    // Filter out locations that already exist in database
    const locationsFromList = locationsForDate.filter(loc => 
      !existingLocationNames.includes(loc.locationName.toLowerCase())
    );

    const allNewLocations = [...locationsFromList, ...newLocationsToSave];

    if (allNewLocations.length === 0) {
      toast.success('No new locations to save');
      // Close modal since there's nothing to save
      setShowLocationModal(false);
      setSelectedDate(null);
      setLocationsForDate([]);
      setFormData({
        locationName: '',
        capacity: '',
        description: '',
        status: 'available'
      });
      setShowCustomLocationInput(false);
      setCustomLocationName('');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Please login to save location availability');
        return;
      }

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Save all NEW locations for this date
      const savePromises = allNewLocations.map(location => {
        const capacityNum = parseInt(location.capacity, 10);
        
        // Validate capacity parsing
        if (isNaN(capacityNum) || capacityNum < 1) {
          throw new Error(`Invalid capacity for ${location.locationName}: ${location.capacity}`);
        }
        
        console.log(`Saving location ${location.locationName} with capacity: ${location.capacity} -> ${capacityNum}`);
        
        const locationData = {
          date: dateStr,
          locationName: location.locationName.trim(),
          capacity: capacityNum,
          description: location.description.trim(),
          status: location.status
        };

        return fetch(`${API_BASE_URL}/location-availability`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(locationData)
        });
      });

      const responses = await Promise.all(savePromises);
      const results = await Promise.all(responses.map(r => r.json()));

      const failedSaves = responses.filter(r => !r.ok);
      
      if (failedSaves.length === 0) {
        console.log('All locations saved successfully, closing modal...');
        toast.success(`${allNewLocations.length} location(s) saved successfully!`);
        
        // Reload data to get the latest from server and update all UI components
        await loadLocationData();
        
        // Close modal and reset
        console.log('Closing modal and resetting state...');
        setShowLocationModal(false);
        setSelectedDate(null);
        setLocationsForDate([]);
        setFormData({
          locationName: '',
          capacity: '',
          description: '',
          status: 'available'
        });
        setShowCustomLocationInput(false);
        setCustomLocationName('');
        console.log('Modal should be closed now');
      } else {
        const errorMessages = results
          .filter((_, index) => !responses[index].ok)
          .map(result => result.message)
          .join(', ');
        toast.error(`Some locations failed to save: ${errorMessages}`);
      }
    } catch (error) {
      console.error('Error saving locations:', error);
      toast.error('Failed to save location availability');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading location data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Location</h1>
              <p className="text-gray-600">Click on any date to set location availability</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-2">
              <Building2 className="w-4 h-4" />
              {currentUser?.department || 'PMO'}
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Location Summary - Horizontal at top */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Available Locations
              </CardTitle>
              <div className="flex items-center gap-2">
                {selectedFilterDates.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {selectedFilterDates.length} date{selectedFilterDates.length !== 1 ? 's' : ''} filtered
                  </Badge>
                )}
                <Popover open={showDateFilter} onOpenChange={setShowDateFilter}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      Filter by Date
                      <ChevronDown className={`w-4 h-4 transition-transform ${showDateFilter ? 'rotate-180' : ''}`} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-2" align="end">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-medium text-gray-700">Filter dates</h4>
                        {selectedFilterDates.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearDateFilters}
                            className="text-xs text-gray-500 hover:text-gray-700 h-5 px-1"
                          >
                            Clear ({selectedFilterDates.length})
                          </Button>
                        )}
                      </div>
                      <Calendar
                        mode="multiple"
                        selected={selectedFilterDates.map(dateStr => new Date(dateStr))}
                        onSelect={(dates) => {
                          if (dates) {
                            const dateStrings = Array.from(dates).map(date => format(date, 'yyyy-MM-dd'));
                            setSelectedFilterDates(dateStrings);
                          } else {
                            setSelectedFilterDates([]);
                          }
                        }}
                        disabled={(date) => {
                          const dateString = format(date, 'yyyy-MM-dd');
                          const availableDates = getAvailableDates();
                          return !availableDates.includes(dateString);
                        }}
                        className="rounded-md border text-xs scale-90"
                      />
                      {getAvailableDates().length === 0 && (
                        <p className="text-xs text-gray-500 text-center">No dates available</p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredLocationData.length === 0 ? (
              <div className="text-center py-6">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-2">No locations configured yet</p>
                <p className="text-xs text-gray-500">Click on calendar dates to add location availability</p>
              </div>
            ) : (
              <div className="relative">
                <Swiper
                  key={filteredLocationData.length}
                  modules={[Autoplay, Pagination]}
                  spaceBetween={16}
                  slidesPerView={1}
                  loop={true}
                  speed={800}
                  effect="slide"
                  autoplay={{
                    delay: 3000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                    waitForTransition: false,
                    stopOnLastSlide: false
                  }}
                  navigation={false}
                  pagination={false}
                  breakpoints={{
                    640: {
                      slidesPerView: 2,
                    },
                    768: {
                      slidesPerView: 3,
                    },
                    1024: {
                      slidesPerView: 4,
                    },
                  }}
                  className="location-swiper"
                >
                  {filteredLocationData.map((location) => (
                    <SwiperSlide key={location._id}>
                      <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors h-full">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-sm text-gray-900 truncate">
                            {location.locationName}
                          </h4>
                          <Badge 
                            variant={location.status === 'available' ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {location.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <CalendarIcon className="w-3 h-3" />
                            {location.date}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Building2 className="w-3 h-3" />
                            Capacity: {location.capacity}
                          </div>
                          {location.description && (
                            <div className="text-xs text-gray-500 line-clamp-2">
                              {location.description}
                            </div>
                          )}
                          <div className="text-xs text-gray-400">
                            {location.departmentName}
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Calendar - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Location Calendar
              </CardTitle>
              <div className="flex items-center gap-4">
                {/* Legend */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-200 rounded"></div>
                    <span className="text-sm text-gray-600">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-200 rounded"></div>
                    <span className="text-sm text-gray-600">Unavailable</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar */}
            <div className="border rounded-lg overflow-hidden">
              <CustomCalendar
                events={calendarEvents}
                onDateClick={handleDateClick}
                showNavigation={true}
                showLegend={false}
                cellHeight="min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Multi-Location Modal */}
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Manage Locations for {selectedDate && format(selectedDate, 'MMMM dd, yyyy')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Existing Locations */}
            {locationsForDate.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">
                  Locations for this date ({locationsForDate.length}):
                </h4>
                <div className={`space-y-2 ${locationsForDate.length > 3 ? 'max-h-64 overflow-y-auto pr-2' : ''}`}>
                  {locationsForDate.map((location, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{location.locationName}</span>
                          <Badge variant={location.status === 'available' ? "default" : "destructive"} className="text-xs">
                            {location.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600">
                          Capacity: {location.capacity} | {location.description || 'No description'}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLocation(index)}
                        disabled={deletingIndex === index}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingIndex === index ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Location Form */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900">Add New Location:</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="locationName">Location Name *</Label>
                  <Select 
                    value={showCustomLocationInput ? "Add Custom Location" : (defaultLocationNames.includes(formData.locationName) ? formData.locationName : "")} 
                    onValueChange={handleLocationNameSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        defaultLocationNames.filter(locationName => {
                          const isAlreadyInList = locationsForDate.some(loc => 
                            loc.locationName.toLowerCase() === locationName.toLowerCase()
                          );
                          return !isAlreadyInList;
                        }).length === 0 
                          ? "All locations added" 
                          : "Select available location"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Add Custom Location Option */}
                      <SelectItem value="Add Custom Location" className="text-blue-600 font-medium">
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Add Custom Location
                        </div>
                      </SelectItem>
                      
                      {/* Separator if there are available locations */}
                      {defaultLocationNames.filter(locationName => {
                        const isAlreadyInList = locationsForDate.some(loc => 
                          loc.locationName.toLowerCase() === locationName.toLowerCase()
                        );
                        return !isAlreadyInList;
                      }).length > 0 && (
                        <div className="border-t my-1"></div>
                      )}
                      
                      {/* Default Location Options */}
                      {defaultLocationNames
                        .filter(locationName => {
                          // Hide locations that are already in the current list
                          const isAlreadyInList = locationsForDate.some(loc => 
                            loc.locationName.toLowerCase() === locationName.toLowerCase()
                          );
                          return !isAlreadyInList;
                        })
                        .map((locationName) => (
                          <SelectItem key={locationName} value={locationName}>
                            {locationName}
                          </SelectItem>
                        ))}
                      
                      {/* Show message if all default locations are added */}
                      {defaultLocationNames.filter(locationName => {
                        const isAlreadyInList = locationsForDate.some(loc => 
                          loc.locationName.toLowerCase() === locationName.toLowerCase()
                        );
                        return !isAlreadyInList;
                      }).length === 0 && (
                        <div className="px-2 py-1 text-sm text-gray-500 italic border-t pt-2">
                          All default locations have been added for this date
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  
                  {/* Select All Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllLocations}
                    disabled={defaultLocationNames.filter(locationName => {
                      const isAlreadyInList = locationsForDate.some(loc => 
                        loc.locationName.toLowerCase() === locationName.toLowerCase()
                      );
                      return !isAlreadyInList;
                    }).length === 0}
                    className="text-xs gap-1 h-8 mt-2"
                    title={`Add all ${defaultLocationNames.filter(locationName => {
                      const isAlreadyInList = locationsForDate.some(loc => 
                        loc.locationName.toLowerCase() === locationName.toLowerCase()
                      );
                      return !isAlreadyInList;
                    }).length} available locations`}
                  >
                    <Plus className="w-3 h-3" />
                    Select All Available Locations ({defaultLocationNames.filter(locationName => {
                      const isAlreadyInList = locationsForDate.some(loc => 
                        loc.locationName.toLowerCase() === locationName.toLowerCase()
                      );
                      return !isAlreadyInList;
                    }).length})
                  </Button>
                  
                  {/* Show selected custom location */}
                  {formData.locationName && !defaultLocationNames.includes(formData.locationName) && !showCustomLocationInput && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Custom Location Selected:</span>
                        <span className="text-sm">{formData.locationName}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Custom Location Input */}
                  {showCustomLocationInput && (
                    <div className="mt-3 p-3 border rounded-lg bg-blue-50">
                      <Label htmlFor="customLocationName" className="text-sm font-medium text-blue-900">
                        Enter Custom Location Name *
                      </Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="customLocationName"
                          value={customLocationName}
                          onChange={(e) => setCustomLocationName(e.target.value)}
                          placeholder="e.g., New Conference Room, Outdoor Pavilion"
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCustomLocationConfirm();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={handleCustomLocationConfirm}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={!customLocationName.trim()}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowCustomLocationInput(false);
                            setCustomLocationName('');
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Press Enter or click + to confirm the custom location name
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">
                    Capacity *
                    {isAutoPopulated && (
                      <span className="text-xs text-blue-600 ml-1">(Auto-filled)</span>
                    )}
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    max="999999"
                    value={formData.capacity}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow positive integers
                      if (value === '' || (/^\d+$/.test(value) && parseInt(value, 10) > 0)) {
                        setFormData({...formData, capacity: value});
                      }
                    }}
                    placeholder="e.g., 50, 200, 500"
                    readOnly={isAutoPopulated}
                    className={isAutoPopulated ? "bg-blue-50 border-blue-200 text-blue-800" : ""}
                  />
                  {isAutoPopulated && (
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Using standardized capacity from previous records
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description
                  {isAutoPopulated && (
                    <span className="text-xs text-blue-600 ml-1">(Auto-filled)</span>
                  )}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of the location"
                  rows={2}
                  readOnly={isAutoPopulated}
                  className={isAutoPopulated ? "bg-blue-50 border-blue-200 text-blue-800" : ""}
                />
                {isAutoPopulated && (
                  <p className="text-xs text-blue-600 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Using standardized description from previous records
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Availability Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'available' | 'unavailable') => 
                    setFormData({...formData, status: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleAddLocation} 
                variant="outline" 
                className="w-full gap-2"
                disabled={!formData.locationName || !formData.capacity}
              >
                <Plus className="w-4 h-4" />
                Add New Location Data
              </Button>
            </div>
          </div>

          <div className="flex justify-between gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowLocationModal(false);
                setLocationsForDate([]);
                setFormData({
                  locationName: '',
                  capacity: '',
                  description: '',
                  status: 'available'
                });
                setShowCustomLocationInput(false);
                setCustomLocationName('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAllLocations} 
              className="gap-2"
              disabled={locationsForDate.length === 0 && (!formData.locationName || !formData.capacity)}
            >
              <Save className="w-4 h-4" />
              Save All Locations ({locationsForDate.length + (formData.locationName && formData.capacity ? 1 : 0)})
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageLocationPage;
