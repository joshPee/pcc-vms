'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Upload,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Users,
  Plus,
  Phone,
  Building,
  Briefcase,
  Calendar,
} from 'lucide-react';

interface ExpectedAttendee {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  organisation: string;
  position: string;
  region: string;
  tags: string;
  registered: boolean;
  registered_at: string;
  check_in_status: string;
  check_in_date: string;
  participant_id: number;
  reminder_sent: boolean;
}

export default function ExpectedAttendeesPage() {
  const [attendees, setAttendees] = useState<ExpectedAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegistration, setFilterRegistration] = useState('ALL');
  const [filterCheckIn, setFilterCheckIn] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<ExpectedAttendee | null>(null);
  const [addForm, setAddForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    organisation: '',
    position: '',
    region: '',
    tags: '',
  });
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    organisation: '',
    position: '',
    region: '',
    tags: '',
  });
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchExpectedAttendees();
  }, [filterRegistration, filterCheckIn]);

  const fetchExpectedAttendees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRegistration !== 'ALL') params.append('registered', filterRegistration === 'REGISTERED' ? 'true' : 'false');
      if (filterCheckIn !== 'ALL') params.append('check_in_status', filterCheckIn);

      const response = await fetch(`/api/expected-attendees?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAttendees(data);
      }
    } catch (error) {
      console.error('Error fetching expected attendees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const response = await fetch('/api/expected-attendees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });

      if (response.ok) {
        setShowAddModal(false);
        setAddForm({
          full_name: '',
          email: '',
          phone: '',
          organisation: '',
          position: '',
          region: '',
          tags: '',
        });
        fetchExpectedAttendees();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add attendee');
      }
    } catch (error) {
      console.error('Error adding attendee:', error);
      alert('Failed to add attendee');
    } finally {
      setAdding(false);
    }
  };

  const handleEditClick = (attendee: ExpectedAttendee) => {
    setSelectedAttendee(attendee);
    setEditForm({
      full_name: attendee.full_name,
      email: attendee.email || '',
      phone: attendee.phone || '',
      organisation: attendee.organisation || '',
      position: attendee.position || '',
      region: attendee.region || '',
      tags: attendee.tags || '',
    });
    setShowEditModal(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttendee) return;
    setEditing(true);
    try {
      const response = await fetch(`/api/expected-attendees/${selectedAttendee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedAttendee(null);
        fetchExpectedAttendees();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update attendee');
      }
    } catch (error) {
      console.error('Error updating attendee:', error);
      alert('Failed to update attendee');
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expected attendee?')) return;

    try {
      const response = await fetch(`/api/expected-attendees/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchExpectedAttendees();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete attendee');
      }
    } catch (error) {
      console.error('Error deleting attendee:', error);
      alert('Failed to delete attendee');
    }
  };

  const handleView = (attendee: ExpectedAttendee) => {
    setSelectedAttendee(attendee);
    setShowViewModal(true);
  };

  const handleExport = () => {
    try {
      const headers = ['Full Name', 'Email', 'Phone', 'Organisation', 'Position', 'Region', 'Tags', 'Registered', 'Check-in Status'];
      const csvContent = [
        headers.join(','),
        ...filteredAttendees.map(a => [
          `"${a.full_name || ''}"`,
          `"${a.email || ''}"`,
          `"${a.phone || ''}"`,
          `"${a.organisation || ''}"`,
          `"${a.position || ''}"`,
          `"${a.region || ''}"`,
          `"${a.tags || ''}"`,
          a.registered ? 'Yes' : 'No',
          a.check_in_status || 'NOT_CHECKED_IN'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expected-attendees-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting expected attendees:', error);
      alert('Failed to export expected attendees');
    }
  };

  const filteredAttendees = attendees.filter(attendee =>
    attendee.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    attendee.organisation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    attendee.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    attendee.phone?.includes(searchQuery) ||
    attendee.position?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: attendees.length,
    registered: attendees.filter(a => a.registered).length,
    checkedIn: attendees.filter(a => a.check_in_status === 'CHECKED_IN').length,
    pending: attendees.filter(a => !a.registered).length,
  };

  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with Title and Unified Toolbar matching Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Expected Attendees & VIPs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            RSVPs, scheduled conference delegates, and anticipated VIP visitors
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-[#123B70]" />
            <span>{todayFormatted}</span>
          </div>

          <Button
            onClick={() => setShowAddModal(true)}
            size="sm"
            className="bg-[#123B70] hover:bg-[#0C284E] text-white font-bold h-9 rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5 text-[#E5A823]" />
            Add Attendee
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-9 rounded-xl font-semibold border-slate-200"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Total Expected</p>
                <p className="text-2xl sm:text-3xl font-black text-[#123B70] mt-1">{stats.total}</p>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-blue-50 text-[#123B70] flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Pre-Registered</p>
                <p className="text-2xl sm:text-3xl font-black text-green-600 mt-1">{stats.registered}</p>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">On Grounds</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{stats.checkedIn}</p>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Pending</p>
                <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{stats.pending}</p>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="rounded-2xl border-slate-200">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-6 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, organisation, role, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-xl bg-slate-50 border-slate-200 text-xs"
              />
            </div>
            <div className="sm:col-span-3">
              <select
                value={filterRegistration}
                onChange={(e) => setFilterRegistration(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#123B70]"
              >
                <option value="ALL">All Registrations</option>
                <option value="REGISTERED">Pre-Registered</option>
                <option value="NOT_REGISTERED">Pending Invitation</option>
              </select>
            </div>
            <div className="sm:col-span-3 flex gap-2">
              <select
                value={filterCheckIn}
                onChange={(e) => setFilterCheckIn(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#123B70]"
              >
                <option value="ALL">All Gate Status</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="NOT_CHECKED_IN">Not Arrived</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilterRegistration('ALL');
                  setFilterCheckIn('ALL');
                }}
                className="h-10 px-3 rounded-xl border-slate-200"
                title="Reset Filters"
              >
                <RefreshCw className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Directory Table & Mobile Cards */}
      <Card className="rounded-3xl border-slate-200 overflow-hidden shadow-2xs">
        <CardHeader className="bg-slate-50/60 border-b border-slate-100 py-3.5 px-5">
          <CardTitle className="text-sm font-bold text-slate-800">
            Expected Attendees Directory ({filteredAttendees.length} records)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading attendee roster...</div>
          ) : filteredAttendees.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              {searchQuery ? `No expected attendees found matching "${searchQuery}"` : 'No expected attendees listed.'}
            </div>
          ) : (
            <>
              {/* Mobile View: High-Density Card Cards */}
              <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
                {filteredAttendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">{attendee.full_name}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {attendee.position ? `${attendee.position} • ` : ''}
                          <span className="text-slate-700">{attendee.organisation || 'N/A'}</span>
                        </p>
                      </div>
                      <Badge className={`${
                        attendee.check_in_status === 'CHECKED_IN'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      } text-[10px] font-bold shrink-0`}>
                        {attendee.check_in_status === 'CHECKED_IN' ? 'On Site' : 'Expected'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1.5 border-t border-slate-100 font-mono">
                      {attendee.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {attendee.phone}
                        </span>
                      )}
                      {attendee.region && (
                        <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-sans font-medium">
                          {attendee.region}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-medium text-slate-400">
                        Registration: <strong className={attendee.registered ? 'text-green-600' : 'text-amber-600'}>
                          {attendee.registered ? 'Pre-Registered' : 'Pending'}
                        </strong>
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(attendee)}
                          className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-900"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(attendee)}
                          className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-900"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(attendee.id)}
                          className="h-8 w-8 p-0 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Attendee Name</th>
                      <th className="py-3 px-4">Role / Title</th>
                      <th className="py-3 px-4">Organisation</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Registration</th>
                      <th className="py-3 px-4">Arrival Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAttendees.map((attendee) => (
                      <tr key={attendee.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{attendee.full_name}</td>
                        <td className="py-3.5 px-4 text-slate-600">{attendee.position || '—'}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{attendee.organisation || '—'}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">{attendee.phone || attendee.email || '—'}</td>
                        <td className="py-3.5 px-4">
                          <Badge className={`${
                            attendee.registered
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-amber-100 text-amber-700 border-amber-200'
                          } text-[10px] font-bold`}>
                            {attendee.registered ? 'Registered' : 'Pending'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge className={`${
                            attendee.check_in_status === 'CHECKED_IN'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          } text-[10px] font-bold`}>
                            {attendee.check_in_status === 'CHECKED_IN' ? 'Checked In' : 'Expected'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(attendee)}
                              className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-900"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(attendee)}
                              className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-900"
                              title="Edit Attendee"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(attendee.id)}
                              className="h-8 w-8 p-0 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg rounded-3xl shadow-2xl border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-5">
              <CardTitle className="text-base font-bold text-slate-900">Add Expected Attendee</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <Label htmlFor="fullName" className="text-xs font-semibold text-slate-700 mb-1.5 block">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={addForm.full_name}
                    onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                    required
                    placeholder="e.g. Rev. Kwabena Mensah"
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="email" className="text-xs font-semibold text-slate-700 mb-1.5 block">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={addForm.email}
                      onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                      placeholder="attendee@example.com"
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-xs font-semibold text-slate-700 mb-1.5 block">Phone Number</Label>
                    <Input
                      id="phone"
                      value={addForm.phone}
                      onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                      placeholder="024XXXXXXX"
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="organisation" className="text-xs font-semibold text-slate-700 mb-1.5 block">Organisation / Church</Label>
                    <Input
                      id="organisation"
                      value={addForm.organisation}
                      onChange={(e) => setAddForm({ ...addForm, organisation: e.target.value })}
                      placeholder="e.g. COP Head Office"
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="position" className="text-xs font-semibold text-slate-700 mb-1.5 block">Role / Designation</Label>
                    <Input
                      id="position"
                      value={addForm.position}
                      onChange={(e) => setAddForm({ ...addForm, position: e.target.value })}
                      placeholder="e.g. Area Head"
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                    className="h-9 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={adding}
                    className="bg-[#123B70] hover:bg-[#0C284E] text-white font-bold h-9 rounded-xl"
                  >
                    {adding ? 'Saving...' : 'Add Expected Attendee'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedAttendee && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg rounded-3xl shadow-2xl border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-5">
              <CardTitle className="text-base font-bold text-slate-900">Edit Expected Attendee</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <Label htmlFor="editFullName" className="text-xs font-semibold text-slate-700 mb-1.5 block">Full Name *</Label>
                  <Input
                    id="editFullName"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    required
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="editEmail" className="text-xs font-semibold text-slate-700 mb-1.5 block">Email</Label>
                    <Input
                      id="editEmail"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editPhone" className="text-xs font-semibold text-slate-700 mb-1.5 block">Phone Number</Label>
                    <Input
                      id="editPhone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="editOrganisation" className="text-xs font-semibold text-slate-700 mb-1.5 block">Organisation</Label>
                    <Input
                      id="editOrganisation"
                      value={editForm.organisation}
                      onChange={(e) => setEditForm({ ...editForm, organisation: e.target.value })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editPosition" className="text-xs font-semibold text-slate-700 mb-1.5 block">Role / Designation</Label>
                    <Input
                      id="editPosition"
                      value={editForm.position}
                      onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                    className="h-9 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={editing}
                    className="bg-[#123B70] hover:bg-[#0C284E] text-white font-bold h-9 rounded-xl"
                  >
                    {editing ? 'Saving...' : 'Update Attendee'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedAttendee && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md rounded-3xl shadow-2xl border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-5">
              <CardTitle className="text-base font-bold text-slate-900">Attendee Record</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Name</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedAttendee.full_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Email</p>
                  <p className="text-slate-700 mt-0.5 font-mono">{selectedAttendee.email || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Phone</p>
                  <p className="text-slate-700 mt-0.5 font-mono">{selectedAttendee.phone || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Organisation</p>
                  <p className="text-slate-700 mt-0.5">{selectedAttendee.organisation || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Role</p>
                  <p className="text-slate-700 mt-0.5">{selectedAttendee.position || '—'}</p>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <Button
                  onClick={() => setShowViewModal(false)}
                  className="bg-[#123B70] hover:bg-[#0C284E] text-white font-bold h-9 rounded-xl text-xs"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
