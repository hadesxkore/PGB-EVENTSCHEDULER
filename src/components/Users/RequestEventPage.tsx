import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
  FileText,
  Paperclip,
  Building2,
  CheckSquare,
  Calendar as CalendarIcon,
  ChevronRight,
  Send,
  StickyNote,
  X,
  Upload,
  Plus,
  Trash2,
  Info,
  Check
} from 'lucide-react';

interface DepartmentRequirement {
  id: string;
  name: string;
  selected: boolean;
  notes: string;
}

interface DepartmentRequirements {
  [department: string]: DepartmentRequirement[];
}

interface FormData {
  eventTitle: string;
  requestor: string;
  location: string;
  participants: string;
  vip: string;
  vvip: string;
  withoutGov: boolean;
  multipleLocations: boolean;
  description: string;
  noAttachments: boolean;
  attachments: File[];
  taggedDepartments: string[];
  departmentRequirements: DepartmentRequirements;
  startDate: Date | undefined;
  startTime: string;
  endDate: Date | undefined;
  endTime: string;
  contactNumber: string;
  contactEmail: string;
}

interface Department {
  _id: string;
  name: string;
  isVisible: boolean;
  requirements: Array<{
    _id: string;
    text: string;
    createdAt: string;
  }>;
}

const API_BASE_URL = 'http://localhost:5000/api';

const RequestEventPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showCustomLocation, setShowCustomLocation] = useState(false);
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [customRequirement, setCustomRequirement] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [showGovModal, setShowGovModal] = useState(false);
  const [govFiles, setGovFiles] = useState<{
    brieferTemplate: File | null;
    availableForDL: File | null;
    programme: File | null;
  }>({
    brieferTemplate: null,
    availableForDL: null,
    programme: null
  });
  
  // Dynamic data from database
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    eventTitle: '',
    requestor: '',
    location: '',
    participants: '',
    vip: '',
    vvip: '',
    withoutGov: false,
    multipleLocations: false,
    description: '',
    noAttachments: false,
    attachments: [],
    taggedDepartments: [],
    departmentRequirements: {},
    startDate: undefined,
    startTime: '',
    endDate: undefined,
    endTime: '',
    contactNumber: '',
    contactEmail: ''
  });

  const steps = [
    { id: 1, title: 'Event Details', icon: FileText, description: 'Basic event information' },
    { id: 2, title: 'Attachments', icon: Paperclip, description: 'Upload supporting documents' },
    { id: 3, title: 'Tag Departments', icon: Building2, description: 'Select relevant departments' },
    { id: 4, title: 'Requirements', icon: CheckSquare, description: 'Specify event requirements' },
    { id: 5, title: 'Schedule', icon: CalendarIcon, description: 'Set date and time' },
    { id: 6, title: 'Ready to Submit', icon: Send, description: 'Review and submit' }
  ];

  // Check if attachments step is completed
  const isAttachmentsCompleted = formData.noAttachments || formData.attachments.length > 0;

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


  const defaultRequirements: DepartmentRequirements = {};

  // Fetch departments from API on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const response = await axios.get(`${API_BASE_URL}/departments/visible`, { headers });

        if (response.data.success) {
          setDepartments(response.data.data);
          console.log('✅ Departments loaded:', response.data.data);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        // Fallback to empty array if fetch fails
        setDepartments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleInputChange = (field: keyof FormData, value: string | boolean | File[] | string[] | DepartmentRequirements | Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = (value: string) => {
    if (value === 'Add Custom Location') {
      setShowCustomLocation(true);
      handleInputChange('location', '');
    } else {
      setShowCustomLocation(false);
      handleInputChange('location', value);
      // Open schedule modal when a location is selected
      setSelectedLocation(value);
      setShowScheduleModal(true);
    }
  };

  const handleScheduleSave = () => {
    setShowScheduleModal(false);
    setSelectedLocation('');
  };

  const handleWithoutGovChange = (checked: boolean) => {
    handleInputChange('withoutGov', checked);
    if (checked) {
      setShowGovModal(true);
    }
  };

  const handleGovFileUpload = (fileType: 'brieferTemplate' | 'availableForDL' | 'programme', file: File | null) => {
    setGovFiles(prev => ({
      ...prev,
      [fileType]: file
    }));
  };

  const handleDepartmentToggle = (departmentName: string) => {
    // If department is being selected, open requirements modal
    if (!formData.taggedDepartments.includes(departmentName)) {
      setSelectedDepartment(departmentName);
      setShowRequirementsModal(true);
      
      // Find the department and use its requirements
      const department = departments.find(dept => dept.name === departmentName);
      if (department && department.requirements) {
        // Convert database requirements to frontend format
        const dbRequirements = department.requirements.map((req) => ({
          id: req._id,
          name: req.text,
          selected: false,
          notes: ''
        }));

        // Initialize requirements for this department
        const newRequirements = { ...formData.departmentRequirements };
        newRequirements[departmentName] = dbRequirements;
        handleInputChange('departmentRequirements', newRequirements);
        
        console.log('✅ Department requirements loaded:', dbRequirements);
      } else {
        // No requirements found, initialize with empty array
        const newRequirements = { ...formData.departmentRequirements };
        newRequirements[departmentName] = [];
        handleInputChange('departmentRequirements', newRequirements);
      }
    } else {
      // If unchecking, remove from tagged departments
      const updatedDepartments = formData.taggedDepartments.filter(d => d !== departmentName);
      handleInputChange('taggedDepartments', updatedDepartments);
    }
  };

  const handleRequirementToggle = (requirementId: string) => {
    const currentReqs = formData.departmentRequirements[selectedDepartment] || [];
    const updatedReqs = currentReqs.map(req => 
      req.id === requirementId ? { ...req, selected: !req.selected } : req
    );
    
    const newDeptReqs = { ...formData.departmentRequirements };
    newDeptReqs[selectedDepartment] = updatedReqs;
    handleInputChange('departmentRequirements', newDeptReqs);
  };

  const handleRequirementNotes = (requirementId: string, notes: string) => {
    const currentReqs = formData.departmentRequirements[selectedDepartment] || [];
    const updatedReqs = currentReqs.map(req => 
      req.id === requirementId ? { ...req, notes } : req
    );
    
    const newDeptReqs = { ...formData.departmentRequirements };
    newDeptReqs[selectedDepartment] = updatedReqs;
    handleInputChange('departmentRequirements', newDeptReqs);
  };

  const handleAddCustomRequirement = () => {
    if (customRequirement.trim()) {
      const currentReqs = formData.departmentRequirements[selectedDepartment] || [];
      const newId = `${selectedDepartment.toLowerCase().replace(/\s+/g, '-')}-custom-${Date.now()}`;
      const newRequirement: DepartmentRequirement = {
        id: newId,
        name: customRequirement.trim(),
        selected: true,
        notes: ''
      };
      
      const updatedReqs = [...currentReqs, newRequirement];
      const newDeptReqs = { ...formData.departmentRequirements };
      newDeptReqs[selectedDepartment] = updatedReqs;
      handleInputChange('departmentRequirements', newDeptReqs);
      
      setCustomRequirement('');
    }
  };

  const handleSaveRequirements = () => {
    // Check if at least one requirement is selected
    const selectedReqs = formData.departmentRequirements[selectedDepartment]?.filter(req => req.selected) || [];
    
    if (selectedReqs.length === 0) {
      toast.error('Please select at least one requirement for this department.');
      return;
    }

    // Add department to tagged list if not already added
    if (!formData.taggedDepartments.includes(selectedDepartment)) {
      const updatedDepartments = [...formData.taggedDepartments, selectedDepartment];
      handleInputChange('taggedDepartments', updatedDepartments);
    }
    
    // Close modal
    setShowRequirementsModal(false);
    setSelectedDepartment('');
    setCustomRequirement('');
    setShowCustomInput(false);
    
    // Show success message
    const requirementCount = selectedReqs.length;
    const notesCount = selectedReqs.filter(req => req.notes && req.notes.trim()).length;
    
    toast.success(`Requirements saved for ${selectedDepartment}!`, {
      description: `${requirementCount} requirement(s) selected${notesCount > 0 ? ` with ${notesCount} note(s)` : ''}.`
    });
    console.log(`Requirements saved for ${selectedDepartment}:`, selectedReqs);
  };

  // Check if departments have requirements added
  const hasRequirementsForDepartments = () => {
    return formData.taggedDepartments.some(dept => {
      const deptReqs = formData.departmentRequirements[dept];
      return deptReqs && deptReqs.some(req => req.selected);
    });
  };

  // Check if form is ready to submit (all validation passes)
  const isFormReadyToSubmit = () => {
    return (
      formData.eventTitle &&
      formData.requestor &&
      formData.location &&
      formData.participants &&
      formData.startDate &&
      formData.startTime &&
      formData.endDate &&
      formData.endTime &&
      formData.contactNumber &&
      formData.contactEmail &&
      formData.contactNumber.length === 11 &&
      formData.contactEmail.includes('@') &&
      formData.taggedDepartments.length > 0 &&
      hasRequirementsForDepartments()
    );
  };

  // Calculate completed steps count
  const getCompletedStepsCount = () => {
    let completedCount = 0;
    
    // Step 1: Event Details
    if (formData.eventTitle && formData.requestor && formData.location && formData.participants) {
      completedCount++;
    }
    
    // Step 2: Attachments
    if (isAttachmentsCompleted) {
      completedCount++;
    }
    
    // Step 3: Tag Departments
    if (formData.taggedDepartments.length > 0) {
      completedCount++;
    }
    
    // Step 4: Requirements
    if (hasRequirementsForDepartments()) {
      completedCount++;
    }
    
    // Step 5: Schedule
    if (formData.startDate && formData.startTime && formData.endDate && formData.endTime && 
        formData.contactNumber && formData.contactEmail && 
        formData.contactNumber.length === 11 && formData.contactEmail.includes('@')) {
      completedCount++;
    }
    
    // Step 6: Ready to Submit
    if (isFormReadyToSubmit()) {
      completedCount++;
    }
    
    return completedCount;
  };

  // Handle final form submission
  const handleSubmitEventRequest = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Please login to submit an event request.');
        return;
      }

      // Prepare form data for submission
      const formDataToSubmit = new FormData();
      
      // Basic event information
      formDataToSubmit.append('eventTitle', formData.eventTitle);
      formDataToSubmit.append('requestor', formData.requestor);
      formDataToSubmit.append('location', formData.location);
      formDataToSubmit.append('participants', formData.participants);
      formDataToSubmit.append('vip', formData.vip || '0');
      formDataToSubmit.append('vvip', formData.vvip || '0');
      formDataToSubmit.append('withoutGov', formData.withoutGov.toString());
      formDataToSubmit.append('multipleLocations', formData.multipleLocations.toString());
      formDataToSubmit.append('description', formData.description || '');
      
      // Schedule information
      formDataToSubmit.append('startDate', formData.startDate?.toISOString() || '');
      formDataToSubmit.append('startTime', formData.startTime);
      formDataToSubmit.append('endDate', formData.endDate?.toISOString() || '');
      formDataToSubmit.append('endTime', formData.endTime);
      
      // Contact information
      formDataToSubmit.append('contactNumber', formData.contactNumber);
      formDataToSubmit.append('contactEmail', formData.contactEmail);
      
      // Department and requirements information
      formDataToSubmit.append('taggedDepartments', JSON.stringify(formData.taggedDepartments));
      
      // Filter to only include SELECTED requirements for each department
      const selectedRequirementsOnly: DepartmentRequirements = {};
      Object.keys(formData.departmentRequirements).forEach(deptName => {
        const selectedReqs = formData.departmentRequirements[deptName]?.filter(req => req.selected) || [];
        if (selectedReqs.length > 0) {
          selectedRequirementsOnly[deptName] = selectedReqs;
        }
      });
      
      formDataToSubmit.append('departmentRequirements', JSON.stringify(selectedRequirementsOnly));
      
      // File attachments
      formDataToSubmit.append('noAttachments', formData.noAttachments.toString());
      formData.attachments.forEach((file, index) => {
        formDataToSubmit.append('attachments', file);
      });
      
      // Government files (if w/o gov is true)
      if (formData.withoutGov && govFiles.brieferTemplate) {
        formDataToSubmit.append('brieferTemplate', govFiles.brieferTemplate);
      }
      if (formData.withoutGov && govFiles.availableForDL) {
        formDataToSubmit.append('availableForDL', govFiles.availableForDL);
      }
      if (formData.withoutGov && govFiles.programme) {
        formDataToSubmit.append('programme', govFiles.programme);
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData, let browser set it with boundary
      };

      console.log('📤 Submitting event request...');
      console.log('🔍 Selected requirements only:', selectedRequirementsOnly);
      console.log('🔍 Tagged departments:', formData.taggedDepartments);
      console.log('🔍 Form data keys:', Array.from(formDataToSubmit.keys()));
      
      const response = await axios.post(`${API_BASE_URL}/events`, formDataToSubmit, { headers });

      if (response.data.success) {
        toast.success('Event request submitted successfully!', {
          description: 'Your event request has been sent for approval.'
        });
        console.log('Event created:', response.data.data);
        
        // Navigate to My Events page after successful submission
        setTimeout(() => {
          navigate('/users/my-events');
        }, 1500); // Wait 1.5 seconds to show the success toast
      }
    } catch (error: any) {
      console.error('Error submitting event request:', error);
      toast.error('Failed to submit event request', {
        description: error.response?.data?.message || 'Please try again later.'
      });
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(departmentSearch.toLowerCase())
  );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });
    
    handleInputChange('attachments', [...formData.attachments, ...validFiles]);
  };

  const removeFile = (index: number) => {
    const newAttachments = formData.attachments.filter((_, i) => i !== index);
    handleInputChange('attachments', newAttachments);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const calculateDuration = (startDate: Date, startTime: string, endDate: Date, endTime: string): string => {
    if (!startDate || !startTime || !endDate || !endTime) return '';
    
    const start = new Date(startDate);
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    start.setHours(startHours, startMinutes);
    
    const end = new Date(endDate);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    end.setHours(endHours, endMinutes);
    
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  // Validate contact details
  const validateContactDetails = () => {
    const errors = [];
    
    if (!formData.contactNumber) {
      errors.push('Contact number is required');
    } else if (formData.contactNumber.length !== 11) {
      errors.push('Contact number must be 11 digits');
    } else if (!formData.contactNumber.startsWith('09')) {
      errors.push('Contact number must start with 09');
    }
    
    if (!formData.contactEmail) {
      errors.push('Email address is required');
    } else if (!formData.contactEmail.includes('@')) {
      errors.push('Please enter a valid email address');
    }
    
    return errors;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold">Request Event</h1>
          <p className="text-sm text-muted-foreground">Create a new event request</p>
        </div>
        <Badge variant="outline" className="text-xs">
          Step {currentStep} of {steps.length}
        </Badge>
      </motion.div>

      {/* Modern Progress Stepper */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep || 
                                (step.id === 2 && isAttachmentsCompleted) ||
                                (step.id === 6 && isFormReadyToSubmit());
              
              return (
                <React.Fragment key={step.id}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                      isCompleted 
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : isActive 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                    </div>
                    <div className="hidden sm:block">
                      <p className={`text-sm font-medium ${
                        isActive ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-4">
                      <div className="h-px bg-gray-200 relative">
                        <motion.div
                          className="h-full bg-green-400"
                          initial={{ width: '0%' }}
                          animate={{ width: step.id < currentStep ? '100%' : '0%' }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* Step 1: Event Details */}
      {currentStep === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Event Information
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="multipleLocations" className="text-sm font-medium">
                      Multiple Locations/Events
                    </Label>
                    <Switch
                      id="multipleLocations"
                      checked={formData.multipleLocations}
                      onCheckedChange={(checked) => handleInputChange('multipleLocations', checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Row 1: Title */}
                <div>
                  <Label htmlFor="eventTitle" className="text-sm font-medium">Event Title *</Label>
                  <Input
                    id="eventTitle"
                    placeholder="Enter event title"
                    value={formData.eventTitle}
                    onChange={(e) => handleInputChange('eventTitle', e.target.value)}
                    className="mt-1"
                  />
                </div>

                {/* Row 2: Requestor & Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="requestor" className="text-sm font-medium">Requestor *</Label>
                    <Input
                      id="requestor"
                      placeholder="Enter requestor name"
                      value={formData.requestor}
                      onChange={(e) => handleInputChange('requestor', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location" className="text-sm font-medium">Location *</Label>
                    {!showCustomLocation ? (
                      <Select onValueChange={handleLocationChange}>
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent className="max-h-48">
                          {locations.map((location) => (
                            <SelectItem 
                              key={location} 
                              value={location}
                              className={location === 'Add Custom Location' ? 'text-blue-600 font-medium' : ''}
                            >
                              <div className="flex items-center gap-2">
                                {location === 'Add Custom Location' && (
                                  <Plus className="w-3 h-3" />
                                )}
                                {location}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          placeholder="Enter custom location"
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          className="mt-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowCustomLocation(false);
                            handleInputChange('location', '');
                          }}
                          className="text-xs"
                        >
                          Choose from list instead
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 3: Participants */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="participants" className="text-sm font-medium">Participants *</Label>
                    <Input
                      id="participants"
                      type="number"
                      placeholder="0"
                      value={formData.participants}
                      onChange={(e) => handleInputChange('participants', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vip" className="text-sm font-medium">VIP</Label>
                    <Input
                      id="vip"
                      type="number"
                      placeholder="0"
                      value={formData.vip}
                      onChange={(e) => handleInputChange('vip', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vvip" className="text-sm font-medium">VVIP</Label>
                    <Input
                      id="vvip"
                      type="number"
                      placeholder="0"
                      value={formData.vvip}
                      onChange={(e) => handleInputChange('vvip', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="withoutGov" className="text-sm font-medium">w/o gov</Label>
                    <div className="mt-1 h-10 flex items-center border border-input rounded-md px-3 bg-background">
                      <Switch
                        id="withoutGov"
                        checked={formData.withoutGov}
                        onCheckedChange={handleWithoutGovChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter event description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="mt-1 h-20"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Attachments Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Paperclip className="w-5 h-5 text-blue-600" />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="noAttachments"
                    checked={formData.noAttachments}
                    onCheckedChange={(checked) => handleInputChange('noAttachments', checked as boolean)}
                  />
                  <Label htmlFor="noAttachments" className="text-sm">No attachments needed</Label>
                </div>

                {!formData.noAttachments && (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-600 mb-2">Drop files or click to upload</p>
                      <p className="text-xs text-gray-400 mb-3">PDF, DOC, JPG, PNG (max 10MB)</p>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="fileUpload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('fileUpload')?.click()}
                      >
                        Choose Files
                      </Button>
                    </div>

                    {formData.attachments.length > 0 && (
                      <div className="space-y-2">
                        {formData.attachments.map((file, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Paperclip className="w-3 h-3 text-gray-500 flex-shrink-0" />
                              <span className="font-medium truncate">{file.name}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="h-5 w-5 p-0 flex-shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="secondary" className="text-xs">Draft</Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Progress:</span>
                  <span className="font-medium">{getCompletedStepsCount()}/{steps.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Step 3: Tag Departments */}
      {currentStep === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Tag Departments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search Input */}
                <div>
                  <Label htmlFor="departmentSearch" className="text-sm font-medium">Search Departments</Label>
                  <Input
                    id="departmentSearch"
                    placeholder="Search for departments..."
                    value={departmentSearch}
                    onChange={(e) => setDepartmentSearch(e.target.value)}
                    className="mt-1"
                  />
                </div>

                {/* Departments List */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Select Departments to Tag</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2 border rounded-lg">
                    {loading ? (
                      <div className="col-span-2 flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-sm text-gray-500">Loading departments...</span>
                      </div>
                    ) : filteredDepartments.map((department) => (
                      <motion.div
                        key={department._id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Checkbox
                          id={department._id}
                          checked={formData.taggedDepartments.includes(department.name)}
                          onCheckedChange={() => handleDepartmentToggle(department.name)}
                        />
                        <Label 
                          htmlFor={department._id} 
                          className="text-sm cursor-pointer flex-1"
                        >
                          {department.name}
                        </Label>
                      </motion.div>
                    ))}
                  </div>
                  
                  {!loading && filteredDepartments.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No departments found matching your search.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Departments */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">Selected Departments</CardTitle>
              </CardHeader>
              <CardContent>
                {formData.taggedDepartments.length > 0 ? (
                  <div className={`space-y-2 ${formData.taggedDepartments.length >= 3 ? 'max-h-64 overflow-y-auto pr-2' : ''}`}>
                    {formData.taggedDepartments.map((dept) => {
                      const deptRequirements = formData.departmentRequirements[dept]?.filter(req => req.selected) || [];
                      const notesCount = deptRequirements.filter(req => req.notes && req.notes.trim()).length;
                      
                      return (
                        <motion.div
                          key={dept}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="p-2 bg-blue-50 rounded-md border border-blue-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-blue-900">{dept}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDepartmentToggle(dept)}
                                  className="h-4 w-4 p-0 text-blue-600 hover:text-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                              
                              {deptRequirements.length > 0 && (
                                <div className="space-y-1">
                                  <div className="text-xs text-blue-600 flex items-center gap-1">
                                    <FileText className="w-2.5 h-2.5" />
                                    {deptRequirements.length} requirement(s)
                                    {notesCount > 0 && ` • ${notesCount} with notes`}
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {deptRequirements.slice(0, 2).map((req) => (
                                      <span 
                                        key={req.id} 
                                        className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded"
                                      >
                                        {req.name}
                                        {req.notes && req.notes.trim() && (
                                          <StickyNote className="w-2 h-2 ml-1 inline" />
                                        )}
                                      </span>
                                    ))}
                                    {deptRequirements.length > 2 && (
                                      <span className="text-xs text-blue-500">
                                        +{deptRequirements.length - 2} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No departments selected yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="secondary" className="text-xs">Draft</Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Progress:</span>
                  <span className="font-medium">{getCompletedStepsCount()}/{steps.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Step 5: Schedule & Contact Details */}
      {currentStep === 5 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Schedule Card - Display Only */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                    Event Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Schedule Display */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="text-sm text-gray-600 mb-3">
                      Schedule based on your location preferences
                    </div>
                    
                    {formData.startDate && formData.startTime ? (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">Start</div>
                          <div className="text-sm text-gray-600">
                            {format(formData.startDate, "EEEE, MMMM dd, yyyy")} at {formatTime(formData.startTime)}
                          </div>
                          {formData.location && (
                            <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {formData.location}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-500">Start Date & Time</div>
                          <div className="text-sm text-gray-400">Not selected yet</div>
                        </div>
                      </div>
                    )}

                    {formData.endDate && formData.endTime ? (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">End</div>
                          <div className="text-sm text-gray-600">
                            {format(formData.endDate, "EEEE, MMMM dd, yyyy")} at {formatTime(formData.endTime)}
                          </div>
                          {formData.location && (
                            <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {formData.location}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-500">End Date & Time</div>
                          <div className="text-sm text-gray-400">Not selected yet</div>
                        </div>
                      </div>
                    )}

                    {formData.startDate && formData.endDate && formData.startTime && formData.endTime && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500">
                          Duration: {calculateDuration(formData.startDate, formData.startTime, formData.endDate, formData.endTime)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                    <Info className="w-3 h-3" />
                    Schedule is set from your location preferences
                  </div>
                </CardContent>
              </Card>

              {/* Contact Details Card */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <StickyNote className="w-5 h-5 text-blue-600" />
                    Contact Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactNumber" className="text-sm font-medium">Contact Number *</Label>
                      <Input
                        id="contactNumber"
                        type="tel"
                        placeholder="09XXXXXXXXX (11 digits)"
                        value={formData.contactNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Only numbers
                          if (value.length <= 11) {
                            handleInputChange('contactNumber', value);
                          }
                        }}
                        className="mt-1"
                        maxLength={11}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter 11-digit mobile number (e.g., 09123456789)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="contactEmail" className="text-sm font-medium">Email Address *</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.contactEmail}
                        onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="secondary" className="text-xs">Draft</Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Progress:</span>
                  <span className="font-medium">{getCompletedStepsCount()}/{steps.length}</span>
                </div>
                <Separator />
                {formData.startDate && formData.startTime && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start:</span>
                      <span className="font-medium text-xs">
                        {format(formData.startDate, "MMM dd")} at {formatTime(formData.startTime)}
                      </span>
                    </div>
                    <Separator />
                  </>
                )}
                {formData.endDate && formData.endTime && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End:</span>
                      <span className="font-medium text-xs">
                        {format(formData.endDate, "MMM dd")} at {formatTime(formData.endTime)}
                      </span>
                    </div>
                    <Separator />
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Departments:</span>
                  <span className="font-medium">{formData.taggedDepartments.length}</span>
                </div>
              </CardContent>
            </Card>

          </div>
        </motion.div>
      )}

      {/* Step 3 Navigation */}
      {currentStep === 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-between pt-4"
        >
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(2)}
          >
            Previous
          </Button>
          <Button 
            onClick={() => setCurrentStep(5)} 
            disabled={!formData.taggedDepartments.length || !hasRequirementsForDepartments()}
            className="gap-2"
          >
            Continue to Schedule
            <ChevronRight className="w-4 h-4" />
          </Button>
        </motion.div>
      )}

      {/* Step 5 Navigation */}
      {currentStep === 5 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-between pt-4"
        >
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(3)}
          >
            Previous
          </Button>
          <Button 
            onClick={handleSubmitEventRequest}
            disabled={!isFormReadyToSubmit()}
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            <Send className="w-4 h-4" />
            Submit Request
          </Button>
        </motion.div>
      )}

      {/* Navigation for other steps */}
      {currentStep !== 3 && currentStep !== 5 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-between pt-4"
        >
          <Button variant="outline" disabled>
            Previous
          </Button>
          <Button onClick={() => setCurrentStep(3)} className="gap-2">
            Continue to Tag Departments
            <ChevronRight className="w-4 h-4" />
          </Button>
        </motion.div>
      )}

      {/* Requirements Modal */}
      <Dialog open={showRequirementsModal} onOpenChange={setShowRequirementsModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">
              Requirements - {selectedDepartment}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Select requirements for this department
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Available Requirements */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Available Requirements</h4>
              <div className="flex flex-wrap gap-2">
                {formData.departmentRequirements[selectedDepartment]?.map((requirement) => (
                  <Button
                    key={requirement.id}
                    onClick={() => handleRequirementToggle(requirement.id)}
                    variant={requirement.selected ? "default" : "outline"}
                    size="sm"
                    className={`text-xs h-7 ${
                      requirement.selected 
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                        : 'border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {requirement.name}
                  </Button>
                ))}
                <Button
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  variant="outline"
                  size="sm"
                  className={`text-xs h-7 border-dashed border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground ${
                    showCustomInput ? 'bg-accent text-accent-foreground' : ''
                  }`}
                >
                  + Add Custom
                </Button>
              </div>
            </div>
          </div>

          {/* Custom Requirement Input */}
          {showCustomInput && (
            <div className="mb-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter custom requirement..."
                  value={customRequirement}
                  onChange={(e) => setCustomRequirement(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomRequirement()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleAddCustomRequirement}
                  disabled={!customRequirement.trim()}
                  variant="outline"
                  size="sm"
                >
                  Add
                </Button>
              </div>
            </div>
          )}

          {/* Selected Requirements */}
          {formData.departmentRequirements[selectedDepartment]?.filter(req => req.selected).length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Selected Requirements</h3>
              <div className="flex flex-wrap gap-2">
                {formData.departmentRequirements[selectedDepartment]
                  ?.filter(req => req.selected)
                  .map((requirement) => (
                  <div key={requirement.id} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
                    <span className="text-sm text-gray-700">{requirement.name}</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-gray-500 hover:text-blue-600"
                        >
                          <StickyNote className="w-3 h-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Notes for {requirement.name}</h4>
                          <Textarea
                            placeholder="Add specific notes or requirements..."
                            value={requirement.notes}
                            onChange={(e) => handleRequirementNotes(requirement.id, e.target.value)}
                            className="min-h-20 text-sm"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRequirementToggle(requirement.id)}
                      className="h-5 w-5 p-0 text-gray-500 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRequirementsModal(false);
                setSelectedDepartment('');
                setCustomRequirement('');
                setShowCustomInput(false);
              }}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveRequirements}
              disabled={!formData.departmentRequirements[selectedDepartment]?.some(req => req.selected)}
              className="text-xs"
            >
              Save Requirements
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="!max-w-2xl !w-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Schedule Event at {selectedLocation}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Select your preferred start and end date/time for the event.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Start Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Start Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => handleInputChange('startDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="startTime" className="text-sm font-medium text-gray-700 mb-2 block">
                  Start Time
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* End Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  End Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => handleInputChange('endDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="endTime" className="text-sm font-medium text-gray-700 mb-2 block">
                  End Time
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Schedule Summary */}
            {(formData.startDate || formData.startTime || formData.endDate || formData.endTime) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Event Schedule Summary</h4>
                <div className="text-sm text-blue-800">
                  <p><strong>Location:</strong> {selectedLocation}</p>
                  {formData.startDate && formData.startTime && (
                    <p><strong>Start:</strong> {format(formData.startDate, "PPP")} at {formatTime(formData.startTime)}</p>
                  )}
                  {formData.endDate && formData.endTime && (
                    <p><strong>End:</strong> {format(formData.endDate, "PPP")} at {formatTime(formData.endTime)}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowScheduleModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleScheduleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* W/O Gov Files Modal */}
      <Dialog open={showGovModal} onOpenChange={setShowGovModal}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Government Files</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Upload required files for events without government officials
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            {/* Briefer Template */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">Briefer Template</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center hover:border-gray-300 transition-colors min-h-[120px] flex flex-col justify-center">
                {govFiles.brieferTemplate ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center">
                      <Paperclip className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-xs font-medium text-gray-900 truncate">{govFiles.brieferTemplate.name}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGovFileUpload('brieferTemplate', null)}
                      className="h-6 w-6 p-0 mx-auto"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 mb-2">Click to upload</p>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleGovFileUpload('brieferTemplate', file);
                      }}
                      className="hidden"
                      id="brieferTemplate"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('brieferTemplate')?.click()}
                      className="text-xs h-7"
                    >
                      Choose File
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Available for DL Briefer */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">Available for DL</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center hover:border-gray-300 transition-colors min-h-[120px] flex flex-col justify-center">
                {govFiles.availableForDL ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center">
                      <Paperclip className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-xs font-medium text-gray-900 truncate">{govFiles.availableForDL.name}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGovFileUpload('availableForDL', null)}
                      className="h-6 w-6 p-0 mx-auto"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 mb-2">Click to upload</p>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleGovFileUpload('availableForDL', file);
                      }}
                      className="hidden"
                      id="availableForDL"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('availableForDL')?.click()}
                      className="text-xs h-7"
                    >
                      Choose File
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Programme */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">Programme</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center hover:border-gray-300 transition-colors min-h-[120px] flex flex-col justify-center">
                {govFiles.programme ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center">
                      <Paperclip className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-xs font-medium text-gray-900 truncate">{govFiles.programme.name}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGovFileUpload('programme', null)}
                      className="h-6 w-6 p-0 mx-auto"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 mb-2">Click to upload</p>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleGovFileUpload('programme', file);
                      }}
                      className="hidden"
                      id="programme"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('programme')?.click()}
                      className="text-xs h-7"
                    >
                      Choose File
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowGovModal(false);
                if (!govFiles.brieferTemplate && !govFiles.availableForDL && !govFiles.programme) {
                  handleInputChange('withoutGov', false);
                }
              }}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => setShowGovModal(false)}
              className="bg-blue-600 hover:bg-blue-700 text-xs"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestEventPage;
