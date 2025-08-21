"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  TestTube,
  CheckCircle,
  XCircle,
  Mail,
  Server,
  Lock,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SMTPConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  isDefault: boolean;
  status: 'active' | 'inactive' | 'testing';
  lastTested?: string;
  testMessage?: string;
}

export function SMTPConfiguration() {
  const [smtpConfigs, setSMTPConfigs] = useState<SMTPConfig[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SMTPConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: ''
  });

  useEffect(() => {
    fetchSMTPConfigs();
  }, []);

  const fetchSMTPConfigs = async () => {
    try {
      const response = await fetch('/api/smtp-settings');
      if (response.ok) {
        const configs = await response.json();
        setSMTPConfigs(configs);
      }
    } catch (error) {
      console.error('Failed to fetch SMTP configs:', error);
    }
  };

  const handleAddConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/smtp-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          host: formData.host,
          port: formData.port,
          secure: formData.secure,
          auth: {
            user: formData.user,
            pass: formData.pass
          }
        })
      });

      if (response.ok) {
        await fetchSMTPConfigs();
        setIsAddDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to add SMTP config:', error);
    }
    setIsLoading(false);
  };

  const handleEditConfig = async () => {
    if (!editingConfig) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/smtp-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingConfig.id,
          name: formData.name,
          host: formData.host,
          port: formData.port,
          secure: formData.secure,
          auth: {
            user: formData.user,
            pass: formData.pass
          }
        })
      });

      if (response.ok) {
        await fetchSMTPConfigs();
        setIsEditDialogOpen(false);
        setEditingConfig(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to update SMTP config:', error);
    }
    setIsLoading(false);
  };

  const handleDeleteConfig = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SMTP configuration?')) return;

    try {
      const response = await fetch(`/api/smtp-settings?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchSMTPConfigs();
      }
    } catch (error) {
      console.error('Failed to delete SMTP config:', error);
    }
  };

  const handleTestConnection = async (config: SMTPConfig) => {
    // Set status to testing immediately
    setSMTPConfigs(prev => prev.map(c =>
      c.id === config.id
        ? { ...c, status: 'testing' }
        : c
    ));

    try {
      console.log('Testing SMTP connection for config:', config.name);

      const response = await fetch('/api/smtp-settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: config.id })
      });

      const result = await response.json();
      console.log('SMTP test result:', result);

      setTestResults(prev => ({
        ...prev,
        [config.id]: result.success
      }));

      // Update the config status with detailed information
      setSMTPConfigs(prev => prev.map(c =>
        c.id === config.id
          ? {
              ...c,
              status: result.success ? 'active' : 'inactive',
              lastTested: new Date().toISOString(),
              testMessage: result.message || (result.success ? 'Connection successful' : 'Connection failed')
            }
          : c
      ));

      // Store the updated config
      if (result.success) {
        await fetch('/api/smtp-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: config.id,
            status: 'active',
            lastTested: new Date().toISOString()
          })
        });
      }

      // Show user-friendly message
      if (result.success) {
        console.log('✅ SMTP connection successful:', result.message);
      } else {
        console.error('❌ SMTP connection failed:', result.message);
        // You could add toast notifications here
      }

    } catch (error) {
      console.error('Failed to test SMTP connection:', error);

      setTestResults(prev => ({
        ...prev,
        [config.id]: false
      }));

      // Update status to inactive on error
      setSMTPConfigs(prev => prev.map(c =>
        c.id === config.id
          ? {
              ...c,
              status: 'inactive',
              lastTested: new Date().toISOString(),
              testMessage: 'Connection test failed'
            }
          : c
      ));
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch('/api/smtp-settings/default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        await fetchSMTPConfigs();
      }
    } catch (error) {
      console.error('Failed to set default SMTP config:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      host: '',
      port: 587,
      secure: false,
      user: '',
      pass: ''
    });
  };

  const openEditDialog = (config: SMTPConfig) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user,
      pass: config.auth.pass
    });
    setIsEditDialogOpen(true);
  };

  const getPresetConfigs = () => [
    { name: 'Gmail', host: 'smtp.gmail.com', port: 587, secure: false },
    { name: 'Outlook', host: 'smtp-mail.outlook.com', port: 587, secure: false },
    { name: 'Yahoo', host: 'smtp.mail.yahoo.com', port: 587, secure: false },
    { name: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, secure: false },
  ];

  const loadPreset = (preset: { name: string; host: string; port: number; secure: boolean }) => {
    setFormData(prev => ({
      ...prev,
      name: preset.name,
      host: preset.host,
      port: preset.port,
      secure: preset.secure
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>SMTP Configuration</CardTitle>
              <CardDescription>
                Manage your email server settings for sending campaigns
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add SMTP Config
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add SMTP Configuration</DialogTitle>
                  <DialogDescription>
                    Configure your email server settings for sending emails
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Preset Configurations */}
                  <div className="space-y-2">
                    <Label>Quick Setup (Popular Providers)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {getPresetConfigs().map((preset) => (
                        <Button
                          key={preset.name}
                          variant="outline"
                          size="sm"
                          onClick={() => loadPreset(preset)}
                        >
                          {preset.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="config-name">Configuration Name</Label>
                      <Input
                        id="config-name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Gmail Business"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtp-host">SMTP Host</Label>
                      <Input
                        id="smtp-host"
                        value={formData.host}
                        onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">Port</Label>
                      <Input
                        id="smtp-port"
                        type="number"
                        value={formData.port}
                        onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) || 587 }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Security</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.secure}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, secure: checked }))}
                        />
                        <span className="text-sm">{formData.secure ? 'SSL/TLS' : 'STARTTLS'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-user">Username/Email</Label>
                      <Input
                        id="smtp-user"
                        value={formData.user}
                        onChange={(e) => setFormData(prev => ({ ...prev, user: e.target.value }))}
                        placeholder="your-email@gmail.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtp-pass">Password/App Password</Label>
                      <Input
                        id="smtp-pass"
                        type="password"
                        value={formData.pass}
                        onChange={(e) => setFormData(prev => ({ ...prev, pass: e.target.value }))}
                        placeholder="Your app password"
                      />
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      For Gmail, use an App Password instead of your regular password.
                      Enable 2FA and generate an App Password in your Google Account settings.
                    </AlertDescription>
                  </Alert>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddConfig} disabled={isLoading}>
                    {isLoading ? 'Adding...' : 'Add Configuration'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {smtpConfigs.length === 0 ? (
            <div className="text-center py-8">
              <Server className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No SMTP configurations</h3>
              <p className="text-gray-500 mb-4">Add your first SMTP configuration to start sending emails</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Port</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {smtpConfigs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">{config.name}</TableCell>
                    <TableCell className="font-mono text-sm">{config.host}</TableCell>
                    <TableCell>{config.port}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={config.status === 'active' ? 'default' : 'secondary'}
                          className="flex items-center space-x-1"
                        >
                          {config.status === 'active' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : config.status === 'testing' ? (
                            <TestTube className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          <span>{config.status}</span>
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {config.isDefault ? (
                        <Badge variant="outline">Default</Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(config.id)}
                        >
                          Set Default
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTestConnection(config)}
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(config)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteConfig(config.id)}
                          disabled={config.isDefault}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit SMTP Configuration</DialogTitle>
            <DialogDescription>
              Update your email server settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-config-name">Configuration Name</Label>
                <Input
                  id="edit-config-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-smtp-host">SMTP Host</Label>
                <Input
                  id="edit-smtp-host"
                  value={formData.host}
                  onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-smtp-port">Port</Label>
                <Input
                  id="edit-smtp-port"
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) || 587 }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Security</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.secure}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, secure: checked }))}
                  />
                  <span className="text-sm">{formData.secure ? 'SSL/TLS' : 'STARTTLS'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-smtp-user">Username/Email</Label>
                <Input
                  id="edit-smtp-user"
                  value={formData.user}
                  onChange={(e) => setFormData(prev => ({ ...prev, user: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-smtp-pass">Password/App Password</Label>
                <Input
                  id="edit-smtp-pass"
                  type="password"
                  value={formData.pass}
                  onChange={(e) => setFormData(prev => ({ ...prev, pass: e.target.value }))}
                  placeholder="Leave empty to keep current password"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditConfig} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Configuration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
