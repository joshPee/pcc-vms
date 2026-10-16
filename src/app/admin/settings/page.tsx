'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Users, Lock, Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // User accounts state
  const [users, setUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Admin' });

  // Password settings state
  const [passwordSettings, setPasswordSettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // System settings state
  const [systemSettings, setSystemSettings] = useState({
    siteName: 'Pentecost Convention Centre',
    registrationOpen: true,
    maxDailyVisitors: 500,
    autoCheckOutHours: 8,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Failed to add user');
      } else {
        setUsers([...users, data]);
        setNewUser({ name: '', email: '', password: '', role: 'Admin' });
        setMessage('User added successfully');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (passwordSettings.newPassword !== passwordSettings.confirmPassword) {
      setMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordSettings.currentPassword,
          newPassword: passwordSettings.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Failed to change password');
      } else {
        setPasswordSettings({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setMessage('Password changed successfully');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemSettings),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Failed to save settings');
      } else {
        setMessage('System settings saved successfully');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">User Accounts</TabsTrigger>
          <TabsTrigger value="password">Password Settings</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {message && (
                <div className={`mb-4 px-3 py-2 rounded-lg flex items-start gap-2 text-xs ${
                  message.includes('success') 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {message.includes('success') ? (
                    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  )}
                  <span>{message}</span>
                </div>
              )}

              {/* Existing Users */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Existing Users</h3>
                <div className="space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                        {user.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New User */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Add New User</h3>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <Label htmlFor="userName">Full Name</Label>
                    <Input
                      id="userName"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="userEmail">Email</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="userPassword">Password</Label>
                    <Input
                      id="userPassword"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="userRole">Role</Label>
                    <select
                      id="userRole"
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full h-10 px-3 py-2 border border-gray-300 bg-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Staff">Staff</option>
                    </select>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-700 hover:bg-blue-800"
                  >
                    {loading ? 'Adding...' : 'Add User'}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              {message && (
                <div className={`mb-4 px-3 py-2 rounded-lg flex items-start gap-2 text-xs ${
                  message.includes('success') 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {message.includes('success') ? (
                    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  )}
                  <span>{message}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordSettings.currentPassword}
                    onChange={(e) => setPasswordSettings({ ...passwordSettings, currentPassword: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordSettings.newPassword}
                    onChange={(e) => setPasswordSettings({ ...passwordSettings, newPassword: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordSettings.confirmPassword}
                    onChange={(e) => setPasswordSettings({ ...passwordSettings, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-700 hover:bg-blue-800"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {message && (
                <div className={`mb-4 px-3 py-2 rounded-lg flex items-start gap-2 text-xs ${
                  message.includes('success') 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {message.includes('success') ? (
                    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  )}
                  <span>{message}</span>
                </div>
              )}

              <form onSubmit={handleSystemSettingsSave} className="space-y-4">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={systemSettings.siteName}
                    onChange={(e) => setSystemSettings({ ...systemSettings, siteName: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="registrationOpen"
                    type="checkbox"
                    checked={systemSettings.registrationOpen}
                    onChange={(e) => setSystemSettings({ ...systemSettings, registrationOpen: e.target.checked })}
                    className="h-4 w-4 text-blue-700 focus:ring-blue-700 border-gray-300 rounded"
                  />
                  <Label htmlFor="registrationOpen" className="text-sm text-gray-900 cursor-pointer">
                    Registration Open
                  </Label>
                </div>
                <div>
                  <Label htmlFor="maxDailyVisitors">Maximum Daily Visitors</Label>
                  <Input
                    id="maxDailyVisitors"
                    type="number"
                    value={systemSettings.maxDailyVisitors}
                    onChange={(e) => setSystemSettings({ ...systemSettings, maxDailyVisitors: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="autoCheckOutHours">Auto Check-out After (Hours)</Label>
                  <Input
                    id="autoCheckOutHours"
                    type="number"
                    value={systemSettings.autoCheckOutHours}
                    onChange={(e) => setSystemSettings({ ...systemSettings, autoCheckOutHours: parseInt(e.target.value) })}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-700 hover:bg-blue-800"
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
