import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Edit3,
  Save,
  X,
  Package,
  Settings,
  AlertCircle
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

interface RequirementAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  departmentId: string;
  departmentName: string;
  requirements: Requirement[];
  onSave: (date: Date, availabilities: RequirementAvailability[]) => void;
  existingAvailabilities?: RequirementAvailability[];
}

const RequirementAvailabilityModal: React.FC<RequirementAvailabilityModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  departmentName,
  requirements,
  onSave,
  existingAvailabilities = []
}) => {
  const [availabilities, setAvailabilities] = useState<RequirementAvailability[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const [showSelection, setShowSelection] = useState(true);

  // Initialize states when modal opens
  useEffect(() => {
    if (isOpen && requirements.length > 0) {
      // If there are existing availabilities, show them directly (editing mode)
      if (existingAvailabilities.length > 0) {
        setShowSelection(false);
        setSelectedRequirements(existingAvailabilities.map(av => av.requirementId));
      } else {
        // New date, show selection first
        setShowSelection(true);
        setSelectedRequirements([]);
      }
      
      const initialAvailabilities = requirements.map(req => {
        const existing = existingAvailabilities.find(av => av.requirementId === req._id);
        return existing || {
          requirementId: req._id,
          requirementText: req.text,
          isAvailable: true,
          notes: '',
          quantity: req.type === 'physical' ? (req.totalQuantity || 1) : 1,
          maxCapacity: req.type === 'physical' ? (req.totalQuantity || 1) : 1
        };
      });
      setAvailabilities(initialAvailabilities);
    }
  }, [isOpen, requirements, existingAvailabilities]);

  // Toggle requirement selection
  const toggleRequirementSelection = (requirementId: string) => {
    setSelectedRequirements(prev => 
      prev.includes(requirementId)
        ? prev.filter(id => id !== requirementId)
        : [...prev, requirementId]
    );
  };

  // Proceed to availability setting
  const proceedToAvailability = () => {
    if (selectedRequirements.length > 0) {
      setShowSelection(false);
    }
  };

  // Update a specific requirement's availability
  const updateAvailability = (requirementId: string, updates: Partial<RequirementAvailability>) => {
    setAvailabilities(prev => 
      prev.map(av => 
        av.requirementId === requirementId 
          ? { ...av, ...updates }
          : av
      )
    );
  };

  // Set all requirements to available/unavailable
  const setAllAvailability = (isAvailable: boolean) => {
    setAvailabilities(prev => 
      prev.map(av => ({ ...av, isAvailable }))
    );
  };

  // Handle save
  const handleSave = async () => {
    if (!selectedDate || selectedRequirements.length === 0) return;
    
    setIsSaving(true);
    try {
      // Only save availabilities for selected requirements
      const selectedAvailabilities = availabilities.filter(av => 
        selectedRequirements.includes(av.requirementId)
      );
      await onSave(selectedDate, selectedAvailabilities);
      onClose();
    } catch (error) {
      console.error('Error saving availability:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Get summary stats
  const availableCount = availabilities.filter(av => av.isAvailable).length;
  const unavailableCount = availabilities.length - availableCount;

  if (!selectedDate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="flex flex-col overflow-hidden"
        style={{ 
          maxWidth: '56rem', 
          width: '95vw', 
          height: '85vh', 
          maxHeight: '85vh', 
          padding: 0, 
          gap: 0 
        }}
      >
        {/* Fixed Header */}
        <div className="flex-shrink-0 p-6 pb-4 border-b bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Edit3 className="w-5 h-5 text-blue-600" />
              Set Resource Availability
            </DialogTitle>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
              <p className="text-sm text-gray-600 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
              </p>
              <p className="text-sm text-gray-600 flex items-center">
                <Package className="w-4 h-4 mr-1" />
                {departmentName} - {requirements.length} Resources
              </p>
            </div>
          </DialogHeader>

          {/* Summary Stats & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="gap-1 bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="w-3 h-3" />
                Available: {availableCount}
              </Badge>
              <Badge variant="outline" className="gap-1 bg-red-100 text-red-800 border-red-200">
                <XCircle className="w-3 h-3" />
                Unavailable: {unavailableCount}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setAllAvailability(true)}
                className="gap-1 text-xs"
              >
                <CheckCircle className="w-3 h-3" />
                All Available
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setAllAvailability(false)}
                className="gap-1 text-xs"
              >
                <XCircle className="w-3 h-3" />
                All Unavailable
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6">
              {showSelection ? (
                /* Requirement Selection Screen */
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Select Requirements for this Date</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose which requirements you need to set availability for on {selectedDate ? format(selectedDate, 'MMMM dd, yyyy') : 'this date'}
                    </p>
                  </div>

                  {/* Physical Requirements Selection */}
                  {requirements.filter(req => req.type === 'physical').length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                        <Package className="w-5 h-5 text-purple-600" />
                        <h4 className="text-md font-semibold">Physical Requirements</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {requirements
                          .filter(req => req.type === 'physical')
                          .map(req => (
                            <Button
                              key={req._id}
                              variant={selectedRequirements.includes(req._id) ? "default" : "outline"}
                              className="h-auto p-4 justify-start text-left"
                              onClick={() => toggleRequirementSelection(req._id)}
                            >
                              <div className="flex items-center gap-3 w-full">
                                <Package className="w-4 h-4 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{req.text}</p>
                                  <p className="text-xs opacity-70">Total: {req.totalQuantity || 1} units</p>
                                </div>
                                {selectedRequirements.includes(req._id) && (
                                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                )}
                              </div>
                            </Button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Services Requirements Selection */}
                  {requirements.filter(req => req.type === 'service').length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                        <Settings className="w-5 h-5 text-orange-600" />
                        <h4 className="text-md font-semibold">Services Requirements</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {requirements
                          .filter(req => req.type === 'service')
                          .map(req => (
                            <Button
                              key={req._id}
                              variant={selectedRequirements.includes(req._id) ? "default" : "outline"}
                              className="h-auto p-4 justify-start text-left"
                              onClick={() => toggleRequirementSelection(req._id)}
                            >
                              <div className="flex items-center gap-3 w-full">
                                <Settings className="w-4 h-4 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{req.text}</p>
                                  <p className="text-xs opacity-70">
                                    {req.responsiblePerson ? `By: ${req.responsiblePerson}` : 'Service'}
                                  </p>
                                </div>
                                {selectedRequirements.includes(req._id) && (
                                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                )}
                              </div>
                            </Button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Selection Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      {selectedRequirements.length} requirement{selectedRequirements.length !== 1 ? 's' : ''} selected
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRequirements(requirements.map(r => r._id))}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRequirements([])}
                      >
                        Clear All
                      </Button>
                      <Button
                        onClick={proceedToAvailability}
                        disabled={selectedRequirements.length === 0}
                        className="gap-2"
                      >
                        Continue
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Availability Setting Screen */
                <div className="space-y-8">
              {/* Physical Requirements Section */}
              {availabilities.filter(av => selectedRequirements.includes(av.requirementId) && requirements.find(req => req._id === av.requirementId)?.type === 'physical').length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                    <Package className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-foreground">Physical Requirements</h3>
                    <Badge variant="outline" className="ml-auto">
                      {availabilities.filter(av => selectedRequirements.includes(av.requirementId) && requirements.find(req => req._id === av.requirementId)?.type === 'physical').length} items
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {availabilities
                      .filter(av => selectedRequirements.includes(av.requirementId) && requirements.find(req => req._id === av.requirementId)?.type === 'physical')
                      .map((availability, index) => (
                <motion.div
                  key={availability.requirementId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md"
                >
                  {/* Header */}
                  <div className="flex flex-col gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-muted text-muted-foreground">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-foreground text-sm leading-tight">{availability.requirementText}</h4>
                        <p className="text-xs text-muted-foreground">ID: {availability.requirementId.slice(-8)}</p>
                      </div>
                    </div>
                    
                    {/* Availability Toggle */}
                    <div className="flex items-center justify-center gap-2 p-2 bg-muted/30 rounded-md">
                      <span className={`text-xs ${!availability.isAvailable ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        Unavailable
                      </span>
                      <Switch
                        checked={availability.isAvailable}
                        onCheckedChange={(checked) => 
                          updateAvailability(availability.requirementId, { isAvailable: checked })
                        }
                      />
                      <span className={`text-xs ${availability.isAvailable ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        Available
                      </span>
                    </div>
                  </div>

                  {/* Quantity Controls (only for physical items and if available) */}
                  {availability.isAvailable && requirements.find(req => req._id === availability.requirementId)?.type === 'physical' && (
                    <div className="mb-4 space-y-3">
                      {/* Total Quantity Display */}
                      <div className="p-2 bg-muted/30 rounded-md">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Total Quantity Available
                        </Label>
                        <p className="text-sm font-semibold text-foreground">
                          {requirements.find(req => req._id === availability.requirementId)?.totalQuantity || 1} units
                        </p>
                      </div>
                      
                      {/* Set Quantity Input */}
                      <div>
                        <Label htmlFor={`quantity-${availability.requirementId}`} className="text-xs font-medium text-foreground">
                          Set Quantity for this Date
                        </Label>
                        <Input
                          id={`quantity-${availability.requirementId}`}
                          type="number"
                          min="0"
                          max={requirements.find(req => req._id === availability.requirementId)?.totalQuantity || 1}
                          value={availability.quantity}
                          onChange={(e) => {
                            const maxQuantity = requirements.find(req => req._id === availability.requirementId)?.totalQuantity || 1;
                            updateAvailability(availability.requirementId, { 
                              quantity: Math.max(0, Math.min(maxQuantity, parseInt(e.target.value) || 0))
                            });
                          }}
                          className="h-8 mt-1 text-sm"
                          placeholder="Enter quantity for this date"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          How many units will be available on {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'this date'}?
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <Label htmlFor={`notes-${availability.requirementId}`} className="text-xs font-medium text-foreground mb-2 block">
                      Notes {!availability.isAvailable && <span className="text-destructive">(Required for unavailable items)</span>}
                    </Label>
                    <Textarea
                      id={`notes-${availability.requirementId}`}
                      placeholder={
                        availability.isAvailable 
                          ? "Optional notes..."
                          : "Reason for unavailability..."
                      }
                      value={availability.notes}
                      onChange={(e) => 
                        updateAvailability(availability.requirementId, { notes: e.target.value })
                      }
                      className="min-h-[60px] resize-none text-sm"
                    />
                  </div>

                  {/* Validation Warning */}
                  {!availability.isAvailable && !availability.notes.trim() && (
                    <div className="flex items-center gap-2 mt-3 p-2 bg-muted border border-border rounded text-muted-foreground">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs">Please provide a reason for unavailability</span>
                    </div>
                  )}
                </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services Requirements Section */}
              {availabilities.filter(av => selectedRequirements.includes(av.requirementId) && requirements.find(req => req._id === av.requirementId)?.type === 'service').length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                    <Settings className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-foreground">Services Requirements</h3>
                    <Badge variant="outline" className="ml-auto">
                      {availabilities.filter(av => selectedRequirements.includes(av.requirementId) && requirements.find(req => req._id === av.requirementId)?.type === 'service').length} services
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {availabilities
                      .filter(av => selectedRequirements.includes(av.requirementId) && requirements.find(req => req._id === av.requirementId)?.type === 'service')
                      .map((availability, index) => (
                <motion.div
                  key={availability.requirementId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md"
                >
                  {/* Header */}
                  <div className="flex flex-col gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-muted text-muted-foreground">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-foreground text-sm leading-tight">{availability.requirementText}</h4>
                        <p className="text-xs text-muted-foreground">ID: {availability.requirementId.slice(-8)}</p>
                      </div>
                    </div>
                    
                    {/* Availability Toggle */}
                    <div className="flex items-center justify-center gap-2 p-2 bg-muted/30 rounded-md">
                      <span className={`text-xs ${!availability.isAvailable ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        Unavailable
                      </span>
                      <Switch
                        checked={availability.isAvailable}
                        onCheckedChange={(checked) => 
                          updateAvailability(availability.requirementId, { isAvailable: checked })
                        }
                      />
                      <span className={`text-xs ${availability.isAvailable ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        Available
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label htmlFor={`notes-${availability.requirementId}`} className="text-xs font-medium text-foreground mb-2 block">
                      Notes {!availability.isAvailable && <span className="text-destructive">(Required for unavailable services)</span>}
                    </Label>
                    <Textarea
                      id={`notes-${availability.requirementId}`}
                      placeholder={
                        availability.isAvailable 
                          ? "Optional notes..."
                          : "Reason for unavailability..."
                      }
                      value={availability.notes}
                      onChange={(e) => 
                        updateAvailability(availability.requirementId, { notes: e.target.value })
                      }
                      className="min-h-[60px] resize-none text-sm"
                    />
                  </div>

                  {/* Validation Warning */}
                  {!availability.isAvailable && !availability.notes.trim() && (
                    <div className="flex items-center gap-2 mt-3 p-2 bg-muted border border-border rounded text-muted-foreground">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs">Please provide a reason for unavailability</span>
                    </div>
                  )}
                </motion.div>
                    ))}
                  </div>
                </div>
              )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 p-6 pt-4 border-t bg-white">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {!showSelection && (
              <Button
                variant="outline"
                onClick={() => setShowSelection(true)}
                className="w-full sm:w-auto gap-2"
                disabled={isSaving}
              >
                <Edit3 className="w-4 h-4" />
                Change Selection
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:flex-1 gap-2"
              disabled={isSaving}
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            {!showSelection && (
              <Button
                onClick={handleSave}
                className="w-full sm:flex-1 gap-2"
                disabled={isSaving || selectedRequirements.length === 0}
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Availability'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequirementAvailabilityModal;
