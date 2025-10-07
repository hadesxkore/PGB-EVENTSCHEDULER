import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { 
  LayoutDashboard, 
  CalendarPlus, 
  Calendar, 
  CalendarDays, 
  MessageSquare, 
  Building2,
  Package,
  PanelLeft,
  LogOut,
  MapPin
} from 'lucide-react';

interface UsersSidebarProps {
  user?: {
    name: string;
    email: string;
    department: string;
    avatar?: string;
  };
}

const UsersSidebar: React.FC<UsersSidebarProps> = ({ user }) => {
  // Use actual user data or fallback with proper null checks
  const currentUser = {
    name: user?.name || "User",
    email: user?.email || "user@bataan.gov.ph",
    department: user?.department || "Department"
  };
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [permissions, setPermissions] = useState({
    myRequirements: false,
    manageLocation: false,
    myCalendar: false
  });
  const navigate = useNavigate();
  const location = useLocation();

  // API Configuration
  const API_BASE_URL = 'http://localhost:5000/api';
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Fetch department permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/department-permissions/${currentUser.department}`, {
          headers: getAuthHeaders()
        });
        
        if (response.data.success) {
          setPermissions(response.data.data.permissions);
        }
      } catch (error) {
        console.error('Error fetching department permissions:', error);
        // Keep default permissions if fetch fails
      }
    };

    if (currentUser.department && currentUser.department !== "Department") {
      fetchPermissions();
    }
  }, [currentUser.department]);
  
  // Dynamic navigation items based on permissions
  const getNavigationItems = () => {
    const baseItems = [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/users/dashboard' },
      { icon: CalendarPlus, label: 'Request Event', href: '/users/request-event' },
      { icon: Calendar, label: 'My Events', href: '/users/my-events' },
    ];

    const conditionalItems = [];
    
    // Add My Calendar if permitted
    if (permissions.myCalendar) {
      conditionalItems.push({ icon: CalendarDays, label: 'My Calendar', href: '/users/my-calendar' });
    }
    
    // Add My Requirements if permitted
    if (permissions.myRequirements) {
      conditionalItems.push({ icon: Package, label: 'My Requirements', href: '/users/my-requirements' });
    }
    
    // Add Manage Location if permitted
    if (permissions.manageLocation) {
      conditionalItems.push({ icon: MapPin, label: 'Manage Location', href: '/users/manage-location' });
    }

    const endItems = [
      { icon: MessageSquare, label: 'Messages', href: '/users/messages' },
      { icon: Building2, label: 'Tagged Departments', href: '/users/tagged-departments' },
    ];

    return [...baseItems, ...conditionalItems, ...endItems];
  };

  const navigationItems = getNavigationItems();

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  const handleLogout = () => {
    // Clear any stored authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    // Navigate to login page
    navigate('/login');
  };

  return (
    <div className={`flex flex-col h-screen bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 relative">
        <img 
          src="/images/bataanlogo.png" 
          alt="Bataan Logo" 
          className="w-8 h-8 object-contain flex-shrink-0"
        />
        <div className={`flex-1 min-w-0 transition-opacity duration-200 ${
          isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
        }`}>
          <h2 className="text-sm font-semibold text-gray-900 truncate">Event Scheduler</h2>
          <p className="text-xs text-blue-600 truncate">Provincial Government</p>
        </div>
        
        {/* Floating Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 bg-white border border-gray-200 hover:bg-gray-50 rounded-full shadow-sm z-10"
        >
          <PanelLeft className={`h-3 w-3 transition-transform duration-200 ${
            isCollapsed ? 'rotate-180' : ''
          }`} />
        </Button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Button
              key={item.label}
              variant="ghost"
              onClick={() => handleNavigation(item.href)}
              className={`w-full h-10 transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              } ${
                isCollapsed 
                  ? 'justify-center px-2' 
                  : 'justify-start gap-3 px-3'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className={`truncate transition-opacity duration-200 ${
                isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
              }`}>
                {item.label}
              </span>
            </Button>
          );
        })}
      </nav>
      
      {/* Footer */}
      <div className="border-t border-gray-100 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-white">
              {currentUser.department?.charAt(0)?.toUpperCase() || 'D'}
            </span>
          </div>
          <div className={`flex-1 min-w-0 transition-opacity duration-200 ${
            isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
          }`}>
            <p className="text-sm font-semibold text-gray-900 truncate">{currentUser.department}</p>
            <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
          </div>
        </div>
        
        {/* Logout Button */}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={`w-full h-9 transition-all duration-200 text-red-600 hover:bg-red-50 hover:text-red-700 ${
            isCollapsed 
              ? 'justify-center px-2' 
              : 'justify-start gap-3 px-3'
          }`}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span className={`truncate transition-opacity duration-200 ${
            isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
          }`}>
            Logout
          </span>
        </Button>
      </div>
    </div>
  );
};

export default UsersSidebar;
