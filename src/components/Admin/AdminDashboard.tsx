import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Calendar, 
  Building2, 
  Activity,
  TrendingUp,
  Clock
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const stats = [
    {
      title: 'Total Users',
      value: '1,234',
      change: '+12%',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Total Events',
      value: '856',
      change: '+8%',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Active Departments',
      value: '24',
      change: '+2%',
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Pending Requests',
      value: '43',
      change: '-5%',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to the Event Scheduler Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">{stat.change}</span>
                  <span className="text-xs text-gray-500 ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'New event request submitted', user: 'John Doe', time: '2 minutes ago' },
                { action: 'Event approved', user: 'Admin', time: '15 minutes ago' },
                { action: 'User registered', user: 'Jane Smith', time: '1 hour ago' },
                { action: 'Department tagged', user: 'Mike Johnson', time: '2 hours ago' }
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-600">by {activity.user}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-600" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: 'Provincial Meeting', date: 'Oct 15, 2024', department: 'Administration' },
                { title: 'IT Training Session', date: 'Oct 18, 2024', department: 'Information Technology' },
                { title: 'Budget Review', date: 'Oct 22, 2024', department: 'Finance' },
                { title: 'Health Summit', date: 'Oct 25, 2024', department: 'Health Department' }
              ].map((event, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-600">{event.department}</p>
                    <p className="text-xs text-gray-500">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
