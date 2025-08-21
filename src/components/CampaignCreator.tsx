"use client";
import { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Users,
  Mail,
  Settings,
  Send,
  Calendar,
  Clock,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CSVUpload } from "./CSVUpload";
import { EmailTemplateEditor } from "./EmailTemplateEditor";
import { EmailScheduler } from "./EmailScheduler";

interface Contact {
  email: string;
  name?: string;
  [key: string]: string | undefined;
}

interface EmailTemplate {
  id?: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
}

interface CampaignSettings {
  sendingInterval: number; // seconds
  dailyLimit: number;
  startTime?: string;
  emailProvider: 'gmail' | 'smtp' | 'custom';
}

interface CampaignCreationData {
  name: string;
  contacts: Contact[];
  template: EmailTemplate;
  settings: CampaignSettings;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';
}

interface Campaign extends CampaignCreationData {
  id: string;
  createdAt: string;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
  };
}

interface CampaignCreatorProps {
  onCampaignCreate: (campaign: CampaignCreationData) => void;
}

export function CampaignCreator({ onCampaignCreate }: CampaignCreatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [campaignName, setCampaignName] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [settings, setSettings] = useState<CampaignSettings>({
    sendingInterval: 5,
    dailyLimit: 500,
    emailProvider: 'gmail'
  });
  const [scheduleSettings, setScheduleSettings] = useState({
    sendType: 'immediate',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    sendOptimization: false,
    respectTimezones: false,
    skipWeekends: false,
    skipHolidays: false
  });

  const steps = [
    { title: "Campaign Details", icon: Mail },
    { title: "Upload Contacts", icon: Users },
    { title: "Create Template", icon: Mail },
    { title: "Settings", icon: Settings },
    { title: "Schedule", icon: Calendar },
    { title: "Review & Send", icon: Send }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleContactsUpload = (uploadedContacts: Contact[]) => {
    setContacts(uploadedContacts);
  };

  const handleTemplateUpdate = (updatedTemplate: EmailTemplate) => {
    setTemplate(updatedTemplate);
  };

  const handleTemplatePreview = (previewTemplate: EmailTemplate) => {
    // Open preview in new window or modal
    console.log("Preview template:", previewTemplate);
  };

  const createCampaign = () => {
    if (!template) return;
    
    const campaign: CampaignCreationData = {
      name: campaignName,
      contacts,
      template,
      settings,
      status: 'draft'
    };
    
    onCampaignCreate(campaign);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return campaignName.trim().length > 0;
      case 1: return contacts.length > 0;
      case 2: return template !== null;
      case 3: return true; // Settings are optional
      case 4: return true; // Schedule is optional
      case 5: return true; // Review step
      default: return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Create New Campaign</h2>
              <Badge variant="outline">
                Step {currentStep + 1} of {steps.length}
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="flex flex-col items-center space-y-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      index === currentStep
                        ? 'bg-blue-600 text-white'
                        : index < currentStep
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {index < currentStep ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className="text-xs text-center max-w-20">{step.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="min-h-96">
        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>Give your email campaign a name and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Campaign Name *</Label>
                <Input
                  id="campaign-name"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g., Summer Sale Newsletter 2024"
                />
              </div>
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Choose a descriptive name that will help you identify this campaign later.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {currentStep === 1 && (
          <div>
            <CSVUpload onContactsUploaded={handleContactsUpload} />
            {contacts.length > 0 && (
              <Alert className="mt-4">
                <Users className="h-4 w-4" />
                <AlertDescription>
                  Ready to proceed with {contacts.length} contacts
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <EmailTemplateEditor
            template={template || undefined}
            onSave={handleTemplateUpdate}
            onPreview={handleTemplatePreview}
          />
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Campaign Settings</CardTitle>
              <CardDescription>Configure how your emails will be sent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sending-interval">Sending Interval (seconds)</Label>
                  <Input
                    id="sending-interval"
                    type="number"
                    value={settings.sendingInterval}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      sendingInterval: parseInt(e.target.value) || 5
                    }))}
                    min="1"
                    max="300"
                  />
                  <p className="text-xs text-muted-foreground">
                    Time delay between each email (recommended: 5-10 seconds)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daily-limit">Daily Send Limit</Label>
                  <Input
                    id="daily-limit"
                    type="number"
                    value={settings.dailyLimit}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      dailyLimit: parseInt(e.target.value) || 500
                    }))}
                    min="1"
                    max="10000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum emails to send per day
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-provider">Email Provider</Label>
                <Select
                  value={settings.emailProvider}
                  onValueChange={(value: 'gmail' | 'smtp' | 'custom') =>
                    setSettings(prev => ({ ...prev, emailProvider: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gmail">Gmail / Google Workspace</SelectItem>
                    <SelectItem value="smtp">Custom SMTP</SelectItem>
                    <SelectItem value="custom">Custom Provider</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time (Optional)</Label>
                <Input
                  id="start-time"
                  type="datetime-local"
                  value={settings.startTime || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    startTime: e.target.value
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to start immediately
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <EmailScheduler
            onScheduleUpdate={setScheduleSettings}
            campaignName={campaignName}
            recipientCount={contacts.length}
          />
        )}

        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Launch Campaign</CardTitle>
              <CardDescription>Review your campaign details before sending</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Campaign Name</h4>
                    <p className="text-muted-foreground">{campaignName}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Recipients</h4>
                    <p className="text-muted-foreground">{contacts.length} contacts</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Email Subject</h4>
                    <p className="text-muted-foreground">{template?.subject || 'No subject'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Sending Settings</h4>
                    <p className="text-muted-foreground">
                      {settings.sendingInterval}s interval, {settings.dailyLimit} daily limit
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Email Provider</h4>
                    <p className="text-muted-foreground capitalize">{settings.emailProvider}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Estimated Send Time</h4>
                    <p className="text-muted-foreground">
                      ~{Math.ceil((contacts.length * settings.sendingInterval) / 60)} minutes
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <Send className="h-4 w-4" />
                <AlertDescription>
                  Double-check your campaign details. Once started, you can pause but not edit the campaign.
                </AlertDescription>
              </Alert>

              <div className="flex justify-center">
                <Button size="lg" onClick={createCampaign} className="px-8">
                  <Send className="mr-2 h-5 w-5" />
                  Launch Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <div /> // Spacer for last step
        )}
      </div>
    </div>
  );
}