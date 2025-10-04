import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  UserPlus
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  department: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface NewUser {
  department: string;
  departmentEmail: string;
  username: string;
  role: string;
  password: string;
  confirmPassword: string;
}

const UsersManagement: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newUser, setNewUser] = useState<NewUser>({
    department: '',
    departmentEmail: '',
    username: '',
    role: '',
    password: '',
    confirmPassword: ''
  });

  // Users data from API
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const departments = [
    'ACCOUNTING',
    'ADMINISTRATOR',
    'ASSESSOR',
    'BAC',
    'BCMH',
    'BHSO',
    'BUDGET',
    'DOLE',
    'INB',
    'JCPJMH',
    'LEGAL',
    'MBDA',
    'MDH',
    'ODH',
    'OMSP',
    'OPA',
    'OPAgriculturist',
    'OPG',
    'OPPDC',
    'OSM',
    'OSSP',
    'OVG',
    'PCEDO',
    'PDRRMO',
    'PEO',
    'PESO',
    'PG-ENRO',
    'PGO',
    'PGO-BAC',
    'PGO-IAS',
    'PGO-ISKOLAR',
    'PGSO',
    'PHO',
    'PHRMO',
    'PIO',
    'PITO',
    'PLO',
    'PMO',
    'PPDO',
    'PPO',
    'PPP',
    'PSWDO',
    'SAP',
    'SP',
    'TOURISM',
    'TREASURY',
    'VET'
  ];

  const roles = ['User', 'Admin'];

  // API Configuration
  const API_BASE_URL = 'http://localhost:5000/api';
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (field: keyof NewUser, value: string) => {
    setNewUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddUser = async () => {
    // Validation
    if (!newUser.department || !newUser.departmentEmail || !newUser.username || 
        !newUser.role || !newUser.password || !newUser.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newUser.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      
      // Check if user is logged in (has token)
      const token = localStorage.getItem('authToken');
      let endpoint = '/users/register';
      let headers: any = getAuthHeaders();
      
      // If no token, try setup endpoint for first admin
      if (!token) {
        endpoint = '/users/setup';
        headers = { 'Content-Type': 'application/json' }; // No auth needed for setup
      }
      
      // Create user via API
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
        username: newUser.username,
        email: newUser.departmentEmail,
        password: newUser.password,
        department: newUser.department,
        role: newUser.role
      }, {
        headers
      });

      if (response.data.success) {
        // If setup endpoint was used, save the token
        if (endpoint === '/users/setup' && response.data.data.token) {
          localStorage.setItem('authToken', response.data.data.token);
          toast.success('First admin user created! You are now logged in.');
        } else {
          toast.success('User created successfully!');
        }
        
        // Refresh users list
        await fetchUsers();
        
        // Reset form
        setNewUser({
          department: '',
          departmentEmail: '',
          username: '',
          role: '',
          password: '',
          confirmPassword: ''
        });
        
        setShowAddModal(false);
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeUsers = users.filter(user => user.status === 'active').length;
  const totalUsers = users.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-2">Manage user accounts and permissions</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Add New User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Users
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{activeUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Departments
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{departments.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Users List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'Admin' ? 'destructive' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={newUser.department} onValueChange={(value) => handleInputChange('department', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="departmentEmail">Email</Label>
                <Input
                  id="departmentEmail"
                  type="email"
                  placeholder="user@bataan.gov.ph"
                  value={newUser.departmentEmail}
                  onChange={(e) => handleInputChange('departmentEmail', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter username"
                  value={newUser.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={(value) => handleInputChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={newUser.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={newUser.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddUser} 
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManagement;
