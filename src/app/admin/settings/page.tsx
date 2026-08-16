'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const [eventSettings, setEventSettings] = useState({
    name: '',
    date: '',
    venue: '',
    description: '',
    status: 'ACTIVE',
    registrationOpen: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchEventSettings();
  }, []);

  const fetchEventSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/event');
      const data = await response.json();
      if (response.ok) {
        setEventSettings(data);
      }
    } catch (error) {
      console.error('Error fetching event settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/settings/event', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventSettings),
      });

      if (response.ok) {
        setMessage('Settings saved successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to save settings');
      }
    } catch (error) {
      setMessage('An error occurred while saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="max-w-2xl">
        <h2 className="text-lg font-bold text-foreground mb-6">Event Settings</h2>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#123B70]"></div>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  {message && (
                    <div className={`mb-4 px-3 py-2 rounded-lg flex items-start gap-2 text-xs ${
                      message.includes('success') 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-destructive/10 border border-destructive/20 text-destructive'
                    }`}>
                      {message.includes('success') ? (
                        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      )}
                      <span>{message}</span>
                    </div>
                  )}

                  <form onSubmit={handleSave} className="space-y-4">
                    <div>
                      <Label htmlFor="eventName" className="flex items-center gap-2 mb-1.5 text-xs">
                        Event Name
                      </Label>
                      <Input
                        id="eventName"
                        type="text"
                        value={eventSettings.name}
                        onChange={(e) => setEventSettings({ ...eventSettings, name: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="eventDate" className="flex items-center gap-2 mb-1.5 text-xs">
                        Event Date
                      </Label>
                      <Input
                        id="eventDate"
                        type="date"
                        value={eventSettings.date}
                        onChange={(e) => setEventSettings({ ...eventSettings, date: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="eventVenue" className="flex items-center gap-2 mb-1.5 text-xs">
                        Venue
                      </Label>
                      <Input
                        id="eventVenue"
                        type="text"
                        value={eventSettings.venue}
                        onChange={(e) => setEventSettings({ ...eventSettings, venue: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="eventDescription" className="flex items-center gap-2 mb-1.5 text-xs">
                        Description
                      </Label>
                      <textarea
                        id="eventDescription"
                        value={eventSettings.description}
                        onChange={(e) => setEventSettings({ ...eventSettings, description: e.target.value })}
                        className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 resize-none h-24"
                        rows={3}
                        placeholder="Enter event description and details..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="eventStatus" className="flex items-center gap-2 mb-1.5 text-xs">
                        Status
                      </Label>
                      <select
                        id="eventStatus"
                        value={eventSettings.status}
                        onChange={(e) => setEventSettings({ ...eventSettings, status: e.target.value })}
                        className="w-full h-9 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#123B70]/20"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="registrationOpen"
                        type="checkbox"
                        checked={eventSettings.registrationOpen}
                        onChange={(e) => setEventSettings({ ...eventSettings, registrationOpen: e.target.checked })}
                        className="h-4 w-4 text-[#123B70] focus:ring-[#123B70] border-border rounded"
                      />
                      <Label htmlFor="registrationOpen" className="text-sm text-foreground cursor-pointer">
                        Registration Open
                      </Label>
                    </div>

                    <div className="pt-4">
                      <Button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-[#123B70] hover:bg-[#0d2d52] h-10 text-sm"
                      >
                        {saving ? 'Saving...' : 'Save Settings'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
        </div>
    </div>
  );
}
