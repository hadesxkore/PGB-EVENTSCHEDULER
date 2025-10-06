import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import CustomCalendar, { type CalendarEvent } from '@/components/ui/custom-calendar';
import RequirementAvailabilityModal from './RequirementAvailabilityModal';
import { 
  Calendar as CalendarIcon, 
  CheckCircle,
  XCircle,
  Package
} from 'lucide-react';
import { format } from 'date-fns';

interface Requirement {
  _id: string;
  text: string;
  type: 'physical' | 'service';
  totalQuantity?: number;
  isActive: boolean;
  isAvailable?: boolean;
  responsiblePerson?: string;
  createdAt: string;
  updatedAt?: string;
}

interface RequirementAvailability {
  requirementId: string;
  requirementText: string;
  isAvailable: boolean;
  notes: string;
  quantity: number;
  maxCapacity: number;
}

interface ResourceAvailabilityData {
  _id: string;
  departmentId: string;
  departmentName: string;
  requirementId: string;
  requirementText: string;
  date: string;
  isAvailable: boolean;
  notes: string;
  quantity: number;
  maxCapacity: number;
}

const MyCalendarPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [availabilityData, setAvailabilityData] = useState<ResourceAvailabilityData[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Get current user and department info
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('Current user data:', user);
        setCurrentUser(user);
        
        // If user has department data with requirements, use it directly
        if (user.departmentData && user.departmentData.requirements) {
          console.log('Using department data from user:', user.departmentData);
          setRequirements(user.departmentData.requirements);
          setLoading(false);
        } else {
          // Fallback to API call
          fetchDepartmentRequirements(user.department || 'PGSO');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch department requirements
  const fetchDepartmentRequirements = async (departmentName: string) => {
    try {
      console.log('Attempting to fetch requirements for department:', departmentName);
      
      // Try API call first
      const departmentsResponse = await fetch('/api/departments/visible');
      if (!departmentsResponse.ok) {
        throw new Error(`API returned ${departmentsResponse.status}: ${departmentsResponse.statusText}`);
      }
      
      const departmentsData = await departmentsResponse.json();
      const departments = departmentsData.data || [];
      
      const department = departments.find((dept: any) => dept.name === departmentName);
      if (!department) {
        throw new Error(`Department '${departmentName}' not found in API response`);
      }

      console.log('Department found via API:', department);
      const departmentRequirements: Requirement[] = department.requirements || [];
      
      setRequirements(departmentRequirements);
      await fetchAvailabilityData(department._id);
    } catch (error) {
      console.error('API call failed, using fallback data:', error);
      
      // Fallback to hardcoded department data when API fails
      const fallbackDepartments: Record<string, Requirement[]> = {
        'PGSO': [
          { _id: '1', text: 'Office Supplies', type: 'physical', totalQuantity: 50, isActive: true, createdAt: '2025-10-04T08:07:55.800Z' },
          { _id: '2', text: 'Meeting Room', type: 'physical', totalQuantity: 3, isActive: true, createdAt: '2025-10-04T08:08:00.360Z' },
          { _id: '3', text: 'Administrative Staff', type: 'service', isActive: true, isAvailable: true, responsiblePerson: 'Admin Team', createdAt: '2025-10-04T08:08:04.543Z' },
          { _id: '4', text: 'Document Processing', type: 'service', isActive: true, isAvailable: true, responsiblePerson: 'Records Office', createdAt: '2025-10-04T08:08:11.058Z' }
        ],
        'PDRRMO': [
          { _id: '1', text: 'Mannequins', type: 'physical', totalQuantity: 10, isActive: true, createdAt: '2025-10-04T08:07:55.800Z' },
          { _id: '2', text: 'AED Training', type: 'service', isActive: true, isAvailable: true, responsiblePerson: 'Safety Team', createdAt: '2025-10-04T08:08:00.360Z' },
          { _id: '3', text: 'Safety briefing', type: 'service', isActive: true, isAvailable: true, responsiblePerson: 'Safety Officer', createdAt: '2025-10-04T08:08:04.543Z' },
          { _id: '4', text: 'Security Personnel (CSIU)', type: 'service', isActive: true, isAvailable: true, responsiblePerson: 'Security Chief', createdAt: '2025-10-04T08:08:11.058Z' }
        ]
      };
      
      const fallbackRequirements = fallbackDepartments[departmentName] || [
        { _id: '1', text: 'General Resource 1', type: 'physical', totalQuantity: 5, isActive: true, createdAt: '2025-10-04T08:07:55.800Z' },
        { _id: '2', text: 'General Resource 2', type: 'service', isActive: true, isAvailable: true, createdAt: '2025-10-04T08:08:00.360Z' }
      ];
      
      console.log(`Using fallback requirements for ${departmentName}:`, fallbackRequirements);
      setRequirements(fallbackRequirements);
      
      // Set empty availability data for fallback
      setAvailabilityData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch availability data
  const fetchAvailabilityData = async (departmentId: string) => {
    try {
      // Fetch actual availability data from API
      const response = await fetch(`/api/resource-availability/department/${departmentId}/availability`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch availability data: ${response.statusText}`);
      }

      const availabilityData = await response.json();
      setAvailabilityData(availabilityData || []);
    } catch (error) {
      console.error('Error fetching availability data:', error);
      // Fallback to empty array on error
      setAvailabilityData([]);
    }
  };

  // Convert availability data to calendar events
  const calendarEvents: CalendarEvent[] = availabilityData.reduce((events, availability) => {
    const existingEvent = events.find(e => e.date === availability.date);
    
    if (existingEvent) {
      // Update existing event title to show summary
      const availableCount = availabilityData.filter(a => 
        a.date === availability.date && a.isAvailable
      ).length;
      const totalCount = availabilityData.filter(a => 
        a.date === availability.date
      ).length;
      
      existingEvent.title = `${availableCount}/${totalCount} Available`;
      existingEvent.type = availableCount === totalCount ? 'available' : 
                          availableCount === 0 ? 'unavailable' : 'custom';
    } else {
      // Create new event
      const dayAvailability = availabilityData.filter(a => a.date === availability.date);
      const availableCount = dayAvailability.filter(a => a.isAvailable).length;
      const totalCount = dayAvailability.length;
      
      events.push({
        id: availability.date,
        date: availability.date,
        title: `${availableCount}/${totalCount} Available`,
        type: availableCount === totalCount ? 'available' : 
              availableCount === 0 ? 'unavailable' : 'custom',
        notes: `${availableCount} of ${totalCount} resources available`
      });
    }
    
    return events;
  }, [] as CalendarEvent[]);

  // Handle date selection
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  // Handle save availability
  const handleSaveAvailability = async (date: Date, availabilities: RequirementAvailability[]) => {
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      
      // Get department info
      const departmentsResponse = await fetch('/api/departments/visible');
      if (!departmentsResponse.ok) {
        throw new Error(`Failed to fetch departments: ${departmentsResponse.statusText}`);
      }
      const departmentsData = await departmentsResponse.json();
      const departments = departmentsData.data || [];
      const department = departments.find((dept: any) => dept.name === (currentUser?.department || 'PGSO'));
      
      if (!department) {
        throw new Error('Department not found');
      }

      // Make actual API call to save availability
      const response = await fetch('/api/resource-availability/availability/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          departmentId: department._id,
          departmentName: department.name,
          date: dateString,
          requirements: availabilities.map(availability => ({
            requirementId: availability.requirementId,
            requirementText: availability.requirementText,
            isAvailable: availability.isAvailable,
            notes: availability.notes,
            quantity: availability.quantity,
            maxCapacity: availability.maxCapacity
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save availability: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Availability saved successfully:', result);
      
      // Refresh availability data
      await fetchAvailabilityData(department._id);
      
    } catch (error) {
      console.error('Error saving availability:', error);
      throw error;
    }
  };

  // Get existing availabilities for selected date
  const getExistingAvailabilities = (date: Date): RequirementAvailability[] => {
    const dateString = format(date, 'yyyy-MM-dd');
    return availabilityData
      .filter(item => item.date === dateString)
      .map(item => ({
        requirementId: item.requirementId,
        requirementText: item.requirementText,
        isAvailable: item.isAvailable,
        notes: item.notes,
        quantity: item.quantity,
        maxCapacity: item.maxCapacity
      }));
  };

  // Calculate summary stats
  const totalRequirements = requirements.length;
  const availableToday = availabilityData.filter(item => 
    item.date === format(new Date(), 'yyyy-MM-dd') && item.isAvailable
  ).length;
  const unavailableToday = availabilityData.filter(item => 
    item.date === format(new Date(), 'yyyy-MM-dd') && !item.isAvailable
  ).length;

  return (
    <div className="p-2 max-w-[98%] mx-auto">
      <Card className="shadow-lg">
        <CardContent className="p-8 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
                My Calendar
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your department's resource availability
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Package className="w-3 h-3 text-blue-600" />
                Total Resources: {totalRequirements}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="w-3 h-3 text-green-600" />
                Available Today: {availableToday}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <XCircle className="w-3 h-3 text-red-600" />
                Unavailable Today: {unavailableToday}
              </Badge>
            </div>
          </motion.div>

          <Separator />

          {/* Custom Calendar Component */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading resources...</span>
            </div>
          ) : (
            <CustomCalendar
              events={calendarEvents}
              onDateClick={handleDateClick}
              showNavigation={true}
              showLegend={true}
              cellHeight="min-h-[100px]"
            />
          )}
        </CardContent>
      </Card>

      {/* Requirement Availability Modal */}
      <RequirementAvailabilityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        departmentId={currentUser?.departmentId || 'pgso-dept-id'}
        departmentName={currentUser?.department || 'PGSO'}
        requirements={requirements}
        onSave={handleSaveAvailability}
        existingAvailabilities={selectedDate ? getExistingAvailabilities(selectedDate) : []}
      />
    </div>
  );
};

export default MyCalendarPage;
