"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  CalendarDays,
  Repeat,
  Send,
  Settings,
  Globe,
  Users,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface ScheduleSettings {
  sendType: 'immediate' | 'scheduled' | 'recurring';
  scheduleDate?: string;
  scheduleTime?: string;
  timezone: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
    maxOccurrences?: number;
  };
  sendOptimization: boolean;
  respectTimezones: boolean;
  skipWeekends: boolean;
  skipHolidays: boolean;
}

interface EmailSchedulerProps {
  onScheduleUpdate: (settings: ScheduleSettings) => void;
  campaignName?: string;
  recipientCount?: number;
}

export function EmailScheduler({ onScheduleUpdate, campaignName, recipientCount }: EmailSchedulerProps) {
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>({
    sendType: 'immediate',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    sendOptimization: false,
    respectTimezones: false,
    skipWeekends: false,
    skipHolidays: false
  });

  const updateSettings = (updates: Partial<ScheduleSettings>) => {
    const newSettings = { ...scheduleSettings, ...updates };
    setScheduleSettings(newSettings);
    onScheduleUpdate(newSettings);
  };

  const updateRecurringSettings = (updates: Partial<ScheduleSettings['recurring']>) => {
    const currentRecurring = scheduleSettings.recurring || { frequency: 'weekly', interval: 1 };
    const newRecurring = { ...currentRecurring, ...updates };
    updateSettings({ recurring: newRecurring });
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Minimum 5 minutes from now
    return now.toISOString().slice(0, 16);
  };

  const getRecommendedSendTime = () => {
    // Suggest optimal send times based on research
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    if (day >= 1 && day <= 5) { // Monday to Friday
      return {
        time: '10:00',
        reason: 'Optimal weekday sending time (10 AM)'
      };
    } else {
      return {
        time: '14:00',
        reason: 'Good weekend sending time (2 PM)'
      };
    }
  };

  const estimateDeliveryTime = () => {
    if (!recipientCount) return null;

    const emailsPerMinute = 12; // Assuming 5-second intervals
    const totalMinutes = Math.ceil(recipientCount / emailsPerMinute);

    if (totalMinutes < 60) {
      return `~${totalMinutes} minutes`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `~${hours}h ${minutes}m`;
    }
  };

  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
    { value: 'UTC', label: 'UTC' }
  ];

  const recommendedTime = getRecommendedSendTime();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Email Scheduling</span>
          </CardTitle>
          <CardDescription>
            Configure when and how your campaign will be sent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Campaign Summary */}
          {campaignName && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{campaignName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {recipientCount} recipients • {estimateDeliveryTime()} delivery time
                  </p>
                </div>
                <Badge variant="outline">
                  {scheduleSettings.sendType === 'immediate' ? 'Send Now' :
                   scheduleSettings.sendType === 'scheduled' ? 'Scheduled' : 'Recurring'}
                </Badge>
              </div>
            </div>
          )}

          {/* Send Type Selection */}
          <div className="space-y-4">
            <Label>When to Send</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card
                className={`cursor-pointer border-2 ${scheduleSettings.sendType === 'immediate' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => updateSettings({ sendType: 'immediate' })}
              >
                <CardContent className="p-4 text-center">
                  <Send className="mx-auto h-8 w-8 mb-2" />
                  <h3 className="font-medium">Send Immediately</h3>
                  <p className="text-sm text-muted-foreground">Start sending right away</p>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer border-2 ${scheduleSettings.sendType === 'scheduled' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => updateSettings({ sendType: 'scheduled' })}
              >
                <CardContent className="p-4 text-center">
                  <Clock className="mx-auto h-8 w-8 mb-2" />
                  <h3 className="font-medium">Schedule for Later</h3>
                  <p className="text-sm text-muted-foreground">Pick a specific date and time</p>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer border-2 ${scheduleSettings.sendType === 'recurring' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => updateSettings({ sendType: 'recurring' })}
              >
                <CardContent className="p-4 text-center">
                  <Repeat className="mx-auto h-8 w-8 mb-2" />
                  <h3 className="font-medium">Recurring Campaign</h3>
                  <p className="text-sm text-muted-foreground">Send on a regular schedule</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Scheduled Send Settings */}
          {scheduleSettings.sendType === 'scheduled' && (
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium flex items-center space-x-2">
                <CalendarDays className="h-4 w-4" />
                <span>Schedule Details</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule-date">Date</Label>
                  <Input
                    id="schedule-date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={scheduleSettings.scheduleDate || ''}
                    onChange={(e) => updateSettings({ scheduleDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedule-time">Time</Label>
                  <div className="relative">
                    <Input
                      id="schedule-time"
                      type="time"
                      value={scheduleSettings.scheduleTime || ''}
                      onChange={(e) => updateSettings({ scheduleTime: e.target.value })}
                    />
                    {!scheduleSettings.scheduleTime && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs"
                        onClick={() => updateSettings({ scheduleTime: recommendedTime.time })}
                      >
                        Use {recommendedTime.time}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{recommendedTime.reason}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={scheduleSettings.timezone}
                  onValueChange={(value) => updateSettings({ timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map(tz => (
                      <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {scheduleSettings.scheduleDate && scheduleSettings.scheduleTime && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Campaign will start sending on{' '}
                    {new Date(`${scheduleSettings.scheduleDate}T${scheduleSettings.scheduleTime}`).toLocaleDateString()}{' '}
                    at {scheduleSettings.scheduleTime} ({scheduleSettings.timezone})
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Recurring Campaign Settings */}
          {scheduleSettings.sendType === 'recurring' && (
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium flex items-center space-x-2">
                <Repeat className="h-4 w-4" />
                <span>Recurring Schedule</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={scheduleSettings.recurring?.frequency || 'weekly'}
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                      updateRecurringSettings({ frequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interval">Every</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="interval"
                      type="number"
                      min="1"
                      max="30"
                      value={scheduleSettings.recurring?.interval || 1}
                      onChange={(e) => updateRecurringSettings({ interval: parseInt(e.target.value) || 1 })}
                      className="w-20"
                    />
                    <span className="flex items-center text-sm text-muted-foreground">
                      {scheduleSettings.recurring?.frequency || 'week'}(s)
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-send">First Send Date</Label>
                  <Input
                    id="first-send"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={scheduleSettings.scheduleDate || ''}
                    onChange={(e) => updateSettings({ scheduleDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="first-send-time">Send Time</Label>
                  <Input
                    id="first-send-time"
                    type="time"
                    value={scheduleSettings.scheduleTime || ''}
                    onChange={(e) => updateSettings({ scheduleTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>End Conditions (choose one)</Label>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={scheduleSettings.recurring?.endDate || ''}
                        onChange={(e) => updateRecurringSettings({ endDate: e.target.value, maxOccurrences: undefined })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-sends">Max Sends</Label>
                      <Input
                        id="max-sends"
                        type="number"
                        min="1"
                        max="100"
                        placeholder="e.g., 10"
                        value={scheduleSettings.recurring?.maxOccurrences || ''}
                        onChange={(e) => updateRecurringSettings({
                          maxOccurrences: parseInt(e.target.value) || undefined,
                          endDate: undefined
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Recurring campaigns will use the same template and contacts for each send.
                  Make sure your content remains relevant over time.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Advanced Options */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-medium flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Advanced Options</span>
            </h4>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Send Time Optimization</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically optimize send times based on recipient engagement patterns
                  </p>
                </div>
                <Switch
                  checked={scheduleSettings.sendOptimization}
                  onCheckedChange={(checked) => updateSettings({ sendOptimization: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Respect Recipient Timezones</Label>
                  <p className="text-sm text-muted-foreground">
                    Send emails at the scheduled time in each recipient's local timezone
                  </p>
                </div>
                <Switch
                  checked={scheduleSettings.respectTimezones}
                  onCheckedChange={(checked) => updateSettings({ respectTimezones: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Skip Weekends</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically move weekend sends to the next business day
                  </p>
                </div>
                <Switch
                  checked={scheduleSettings.skipWeekends}
                  onCheckedChange={(checked) => updateSettings({ skipWeekends: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Skip Holidays</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically avoid sending on major holidays
                  </p>
                </div>
                <Switch
                  checked={scheduleSettings.skipHolidays}
                  onCheckedChange={(checked) => updateSettings({ skipHolidays: checked })}
                />
              </div>
            </div>
          </div>

          {/* Schedule Summary */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Schedule Summary</h4>
            <div className="text-sm space-y-1">
              {scheduleSettings.sendType === 'immediate' && (
                <p>✅ Campaign will start sending immediately after launch</p>
              )}

              {scheduleSettings.sendType === 'scheduled' && scheduleSettings.scheduleDate && scheduleSettings.scheduleTime && (
                <div>
                  <p>📅 Scheduled for: {new Date(`${scheduleSettings.scheduleDate}T${scheduleSettings.scheduleTime}`).toLocaleString()}</p>
                  <p>🌍 Timezone: {scheduleSettings.timezone}</p>
                </div>
              )}

              {scheduleSettings.sendType === 'recurring' && (
                <div>
                  <p>🔄 Recurring: Every {scheduleSettings.recurring?.interval || 1} {scheduleSettings.recurring?.frequency}(s)</p>
                  {scheduleSettings.scheduleDate && <p>📅 First send: {scheduleSettings.scheduleDate}</p>}
                  {scheduleSettings.recurring?.endDate && <p>⏹️ Ends: {scheduleSettings.recurring.endDate}</p>}
                  {scheduleSettings.recurring?.maxOccurrences && <p>⏹️ Max sends: {scheduleSettings.recurring.maxOccurrences}</p>}
                </div>
              )}

              {estimateDeliveryTime() && (
                <p>⏱️ Estimated delivery time: {estimateDeliveryTime()}</p>
              )}

              {scheduleSettings.sendOptimization && <p>🎯 Send time optimization enabled</p>}
              {scheduleSettings.respectTimezones && <p>🌍 Timezone optimization enabled</p>}
              {scheduleSettings.skipWeekends && <p>📅 Weekend skip enabled</p>}
              {scheduleSettings.skipHolidays && <p>🎉 Holiday skip enabled</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
