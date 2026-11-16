'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  CheckCircle,
  Users,
  Lock,
  Settings as SettingsIcon,
  Trash2,
  Database,
  AlertTriangle,
  Loader2,
  Calendar,
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // User accounts state
  const [users, setUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'security_officer', shift: 'day' });

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

  // Database Maintenance state
  const [purgeRange, setPurgeRange] = useState<'all' | 'older_than_week' | 'older_than_month' | 'older_than_year'>('all');
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [purgeLoading, setPurgeLoading] = useState(false);
  const [purgeMessage, setPurgeMessage] = useState<{ text: string; success: boolean } | null>(null);

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
        setNewUser({ name: '', email: '', password: '', role: 'security_officer', shift: 'day' });
        setMessage('User added successfully');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number, name: string, email: string) => {
    if ((email || '').toLowerCase() === 'admin@pcc.gov.gh') {
      alert('The root system administrator account cannot be deleted.');
      return;
    }

    if (!confirm(`Are you sure you want to delete the user account for "${name || email}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Failed to delete user');
      } else {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setMessage(data.message || 'User deleted successfully');
        setTimeout(() => setMessage(''), 3500);
      }
    } catch {
      setMessage('An error occurred while deleting user. Please try again.');
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
        setMessage('Password changed successfully');
        setPasswordSettings({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {
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

      if (response.ok) {
        setMessage('Settings saved successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to save settings');
      }
    } catch {
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurgeVisitors = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmPhrase.trim() !== 'DELETE VISITORS') {
      alert('Please type "DELETE VISITORS" exactly as shown to confirm.');
      return;
    }

    const rangeNames: Record<string, string> = {
      all: 'ALL visitor records',
      older_than_week: 'records older than 1 week (7 days)',
      older_than_month: 'records older than 1 month (30 days)',
      older_than_year: 'records older than 1 year (365 days)',
    };

    if (!confirm(`Are you completely sure you want to permanently delete ${rangeNames[purgeRange]}? This cannot be undone.`)) {
      return;
    }

    setPurgeLoading(true);
    setPurgeMessage(null);

    try {
      const res = await fetch('/api/reset-participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ range: purgeRange }),
      });

      const data = await res.json();
      if (res.ok) {
        setPurgeMessage({
          text: data.message || `Successfully purged ${data.deletedCount} visitor records.`,
          success: true,
        });
        setConfirmPhrase('');
      } else {
        setPurgeMessage({
          text: data.error || 'Failed to purge visitor data.',
          success: false,
        });
      }
    } catch {
      setPurgeMessage({
        text: 'Network error occurred while clearing visitor records.',
        success: false,
      });
    } finally {
      setPurgeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Password</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2 text-rose-600 data-[state=active]:text-rose-700">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Maintenance</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Users */}
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
                <div className="space-y-2.5">
                  {users.map((user) => {
                    const isRootAdmin = (user.email || '').toLowerCase() === 'admin@pcc.gov.gh';
                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white transition shadow-2xs"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900 text-sm truncate">{user.name}</p>
                            {isRootAdmin && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                Root Admin
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-mono truncate">{user.email}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {user.shift && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
                              user.shift === 'night'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {user.shift === 'night' ? '🌙 Night' : '☀️ Day'}
                            </span>
                          )}
                          <span className="text-xs font-semibold text-[#123B70] bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-lg">
                            {user.role}
                          </span>
                          {!isRootAdmin && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={loading}
                              onClick={() => handleDeleteUser(user.id, user.name, user.email)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add User Form */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Add New User</h3>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <select
                        id="role"
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                      >
                        <option value="security_officer">Security Officer</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="sector_head">Sector Head</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="shift">Shift Schedule</Label>
                      <select
                        id="shift"
                        value={newUser.shift}
                        onChange={(e) => setNewUser({ ...newUser, shift: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                      >
                        <option value="day">Day (06:00 - 18:00)</option>
                        <option value="night">Night (18:00 - 06:00)</option>
                      </select>
                    </div>
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

        {/* Tab 2: Password */}
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

              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
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

        {/* Tab 3: System */}
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

        {/* Tab 4: Database Maintenance & Purge */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card className="border-rose-200">
            <CardHeader className="bg-rose-50/50 rounded-t-xl border-b border-rose-100">
              <CardTitle className="flex items-center gap-2 text-rose-800">
                <Database className="h-5 w-5 text-rose-600" />
                Clear & Reset Visitor Data
              </CardTitle>
              <CardDescription className="text-rose-700/90 text-xs">
                Permanently purge registered visitor records, check-ins, check-outs, and associated visit logs. User accounts, security watchlist, and system configuration will not be affected.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {purgeMessage && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    purgeMessage.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {purgeMessage.success ? (
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <span>{purgeMessage.text}</span>
                </div>
              )}

              <form onSubmit={handlePurgeVisitors} className="space-y-5">
                {/* Filter Selector */}
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                    Select Purge Scope
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        value: 'all',
                        label: 'Complete Database Reset (All Visitors)',
                        desc: 'Deletes every visitor, check-in, and check-out record',
                        badge: 'Total Wipe',
                        color: 'border-rose-300 bg-rose-50/30',
                      },
                      {
                        value: 'older_than_week',
                        label: 'Older than 1 Week',
                        desc: 'Clears records created more than 7 days ago',
                        badge: 'Weekly Purge',
                        color: 'border-slate-200 bg-slate-50/50',
                      },
                      {
                        value: 'older_than_month',
                        label: 'Older than 1 Month',
                        desc: 'Clears records created more than 30 days ago',
                        badge: 'Monthly Purge',
                        color: 'border-slate-200 bg-slate-50/50',
                      },
                      {
                        value: 'older_than_year',
                        label: 'Older than 1 Year',
                        desc: 'Retains active & recent, clears records > 365 days',
                        badge: 'Annual Archive',
                        color: 'border-slate-200 bg-slate-50/50',
                      },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                          purgeRange === opt.value
                            ? 'border-rose-500 bg-rose-50/80 shadow-xs ring-1 ring-rose-500/30'
                            : `${opt.color} hover:bg-slate-100/80`
                        }`}
                      >
                        <input
                          type="radio"
                          name="purgeRange"
                          value={opt.value}
                          checked={purgeRange === opt.value}
                          onChange={(e) => setPurgeRange(e.target.value as any)}
                          className="mt-1 text-rose-600 focus:ring-rose-500"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{opt.label}</span>
                            <span className="text-[10px] font-semibold text-rose-700 px-1.5 py-0.5 rounded bg-rose-100">
                              {opt.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Warning Card */}
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Permanent Action Notice</span>
                  </div>
                  <p className="text-amber-800/90 leading-relaxed">
                    This action will delete all matching visitor profiles, pass numbers, and check-in history. The operation is logged in the immutable security audit trail.
                  </p>
                </div>

                {/* Confirmation Input */}
                <div>
                  <Label htmlFor="confirmPhrase" className="text-xs font-semibold text-slate-700">
                    To confirm, please type <span className="font-mono font-bold text-rose-700">DELETE VISITORS</span> below:
                  </Label>
                  <Input
                    id="confirmPhrase"
                    type="text"
                    placeholder="DELETE VISITORS"
                    value={confirmPhrase}
                    onChange={(e) => setConfirmPhrase(e.target.value)}
                    className="mt-1.5 font-mono text-sm uppercase max-w-md border-rose-300 focus:ring-rose-500"
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={purgeLoading || confirmPhrase.trim() !== 'DELETE VISITORS'}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-10 px-6 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {purgeLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Purging Data...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Execute Data Purge
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
