"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Users,
  Send,
  BarChart3,
  Settings,
  Upload,
  PlusCircle,
  Play,
  Pause,
  Eye,
  ArrowLeft,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CampaignCreator } from "@/components/CampaignCreator";
import { CSVUpload } from "@/components/CSVUpload";
import { EmailTemplateEditor } from "@/components/EmailTemplateEditor";

import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { CampaignStatusManager } from "@/components/CampaignStatusManager";
import { TemplateLibrary } from "@/components/TemplateLibrary";
import { ContactSegmentation } from "@/components/ContactSegmentation";
import { DeliverabilityManager } from "@/components/DeliverabilityManager";
import { ProxyManager } from "@/components/ProxyManager";
import { EmailConfiguration } from "@/components/EmailConfiguration";

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
  sendingInterval: number;
  dailyLimit: number;
  startTime?: string;
  emailProvider: 'gmail' | 'smtp' | 'custom';
}

interface Campaign {
  id: string;
  name: string;
  contacts: Contact[];
  template: EmailTemplate;
  settings: CampaignSettings;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'stopped';
  createdAt: string;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
  };
}

interface ContactList {
  id: string;
  name: string;
  contacts: Contact[];
  count: number;
  uploaded: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showCampaignCreator, setShowCampaignCreator] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  // Force clear all demo data on startup
  useEffect(() => {
    const clearAllDemoData = () => {
      try {
        // Clear all localStorage demo data with comprehensive list
        const keysToRemove = [
          'proxy-configs',
          'deliverability-data',
          'email-template-library',
          'email-contact-segments',
          'smtp-configs',
          'email-campaigns',
          'contact-lists',
          'email-templates',
          'campaign-analytics',
          'email-settings',
          'user-preferences'
        ];

        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
          console.log(`✅ Cleared localStorage item: ${key}`);
        });

        // Also clear any keys that might contain demo data patterns
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.includes('demo') || key.includes('sample') || key.includes('test'))) {
            localStorage.removeItem(key);
            console.log(`✅ Cleared demo localStorage item: ${key}`);
          }
        }

        console.log('✅ All demo data cleared on startup - fresh start guaranteed');
      } catch (error) {
        console.error('Error clearing demo data:', error);
      }
    };

    clearAllDemoData();
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    }
  };

  const handleCampaignCreate = async (campaignData: Omit<Campaign, 'id' | 'createdAt' | 'stats'>) => {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData)
      });

      if (response.ok) {
        await fetchCampaigns();
        setShowCampaignCreator(false);
        setActiveTab("campaigns");
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const handleCampaignStatusChange = (campaignId: string, newStatus: Campaign['status']) => {
    setCampaigns(prev => prev.map(campaign =>
      campaign.id === campaignId
        ? { ...campaign, status: newStatus }
        : campaign
    ));
  };

  const handleContactsUpload = (contacts: Contact[]) => {
    const newContactList: ContactList = {
      id: Date.now().toString(),
      name: `Uploaded ${new Date().toLocaleDateString()}`,
      contacts: contacts,
      count: contacts.length,
      uploaded: new Date().toISOString()
    };
    setContactLists(prev => [...prev, newContactList]);
  };

  const handleTemplateUpdate = (template: EmailTemplate) => {
    setTemplates(prev => {
      const existing = prev.findIndex(t => t.id === template.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = template;
        return updated;
      } else {
        return [...prev, { ...template, id: Date.now().toString() }];
      }
    });
  };

  const handleTemplatePreview = (template: EmailTemplate) => {
    // Create preview window
    const previewWindow = window.open('', '_blank', 'width=600,height=800');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head><title>Email Preview - ${template.subject}</title></head>
          <body style="margin: 20px; font-family: Arial, sans-serif;">
            <h3>Subject: ${template.subject}</h3>
            <hr>
            ${template.htmlContent}
          </body>
        </html>
      `);
    }
  };

  if (showCampaignCreator) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setShowCampaignCreator(false)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <CampaignCreator onCampaignCreate={handleCampaignCreate} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Mail className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">EmailSender Pro</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("overview")}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </Button>
          <Button
            variant={activeTab === "campaigns" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("campaigns")}
          >
            <Send className="mr-2 h-4 w-4" />
            Campaigns
          </Button>
          <Button
            variant={activeTab === "analytics" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("analytics")}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button
            variant={activeTab === "contacts" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("contacts")}
          >
            <Users className="mr-2 h-4 w-4" />
            Contacts
          </Button>
          <Button
            variant={activeTab === "templates" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("templates")}
          >
            <Mail className="mr-2 h-4 w-4" />
            Templates
          </Button>
          <Button
            variant={activeTab === "security" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("security")}
          >
            <Shield className="mr-2 h-4 w-4" />
            Security & Delivery
          </Button>
          <Button
            variant={activeTab === "settings" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900 capitalize">{activeTab}</h2>
            <div className="flex space-x-2">
              <Button onClick={() => setShowCampaignCreator(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Campaign
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === "overview" && <OverviewTab campaigns={campaigns} />}
          {activeTab === "campaigns" && <CampaignsTab campaigns={campaigns} onStatusChange={handleCampaignStatusChange} onRefresh={fetchCampaigns} />}
          {activeTab === "analytics" && <AnalyticsTab campaigns={campaigns} />}
          {activeTab === "contacts" && <ContactsTab contactLists={contactLists} onContactsUpload={handleContactsUpload} />}
          {activeTab === "templates" && <TemplatesTab templates={templates} onTemplateUpdate={handleTemplateUpdate} onTemplatePreview={handleTemplatePreview} />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ campaigns }: { campaigns: Campaign[] }) {
  const totalCampaigns = campaigns.length;
  const totalSent = campaigns.reduce((sum, c) => sum + c.stats.sent, 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + c.stats.opened, 0);
  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0";
  const totalContacts = campaigns.reduce((sum, c) => sum + c.contacts.length, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">Active campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total emails delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openRate}%</div>
            <p className="text-xs text-muted-foreground">Average open rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
          <CardDescription>Your latest email campaigns and their performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.slice(0, 5).map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-medium">{campaign.name}</h4>
                  <div className="flex items-center space-x-2">
                    <Badge variant={campaign.status === "completed" ? "default" : campaign.status === "sending" ? "secondary" : "outline"}>
                      {campaign.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {campaign.stats.sent} sent • {campaign.stats.opened} opens • {campaign.stats.sent > 0 ? ((campaign.stats.opened / campaign.stats.sent) * 100).toFixed(1) : 0}% rate
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CampaignsTab({
  campaigns,
  onStatusChange,
  onRefresh
}: {
  campaigns: Campaign[];
  onStatusChange: (campaignId: string, newStatus: Campaign['status']) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Email Campaigns</h3>
          <p className="text-sm text-muted-foreground">Manage and monitor your email campaigns</p>
        </div>
      </div>

      <CampaignStatusManager
        campaigns={campaigns}
        onStatusChange={onStatusChange}
        onRefresh={onRefresh}
      />
    </div>
  );
}

function ContactsTab({ contactLists, onContactsUpload }: { contactLists: ContactList[]; onContactsUpload: (contacts: Contact[]) => void }) {
  const [activeTab, setActiveTab] = useState<'upload' | 'segments'>('upload');

  // Collect all contacts from all lists
  const allContacts = contactLists.flatMap(list => list.contacts);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSegmentSelect = (segment: any) => {
    // This could be used to create a campaign with the selected segment
    console.log('Selected segment:', segment);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Contact Management</h3>
          <p className="text-sm text-muted-foreground">Upload contacts and create targeted segments</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <Button
            variant="ghost"
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload className="mr-2 h-4 w-4" />
            Contact Lists
          </Button>
          <Button
            variant="ghost"
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'segments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('segments')}
          >
            <Users className="mr-2 h-4 w-4" />
            Segments ({allContacts.length} contacts)
          </Button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          <CSVUpload onContactsUploaded={onContactsUpload} />

          {contactLists.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Contact Lists</CardTitle>
                <CardDescription>Previously uploaded contact lists</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contactLists.map((list) => (
                    <div key={list.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{list.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {list.count} contacts • Uploaded {new Date(list.uploaded).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">View</Button>
                        <Button variant="ghost" size="sm">Export</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'segments' && (
        <ContactSegmentation
          allContacts={allContacts}
          onSegmentSelect={handleSegmentSelect}
        />
      )}
    </div>
  );
}

function TemplatesTab({ templates, onTemplateUpdate, onTemplatePreview }: {
  templates: EmailTemplate[];
  onTemplateUpdate: (template: EmailTemplate) => void;
  onTemplatePreview: (template: EmailTemplate) => void;
}) {
  const handleTemplateSelect = (template: EmailTemplate & { name: string }) => {
    // Update the templates state with the selected template
    onTemplateUpdate(template);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Template Library</h3>
        <p className="text-sm text-muted-foreground">
          Create, organize, and reuse your email templates
        </p>
      </div>

      <TemplateLibrary onTemplateSelect={handleTemplateSelect} />
    </div>
  );
}

function AnalyticsTab({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Analytics Dashboard</h3>
        <p className="text-sm text-muted-foreground">Email campaign performance and tracking analytics</p>
      </div>

      <AnalyticsDashboard campaigns={campaigns} />
    </div>
  );
}

function SecurityTab() {
  const [activeSecurityTab, setActiveSecurityTab] = useState("deliverability");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Security & Delivery</h3>
        <p className="text-sm text-muted-foreground">Advanced email deliverability and proxy management</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <Button
            variant="ghost"
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSecurityTab === 'deliverability'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveSecurityTab('deliverability')}
          >
            <Shield className="mr-2 h-4 w-4" />
            Email Deliverability
          </Button>
          <Button
            variant="ghost"
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSecurityTab === 'proxy'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveSecurityTab('proxy')}
          >
            <Shield className="mr-2 h-4 w-4" />
            Proxy Management
          </Button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeSecurityTab === 'deliverability' && <DeliverabilityManager />}
      {activeSecurityTab === 'proxy' && <ProxyManager />}
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Settings</h3>
        <p className="text-sm text-muted-foreground">Configure your email settings and providers</p>
      </div>

      <EmailConfiguration />

      <Card>
        <CardHeader>
          <CardTitle>Default Sending Settings</CardTitle>
          <CardDescription>Configure default settings for new campaigns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Sending Interval (seconds)</label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded-md"
                defaultValue="5"
                placeholder="5"
              />
              <p className="text-xs text-muted-foreground">
                Time delay between each email to avoid spam filters
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Default Daily Send Limit</label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded-md"
                defaultValue="500"
                placeholder="500"
              />
              <p className="text-xs text-muted-foreground">
                Maximum emails to send per day
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
