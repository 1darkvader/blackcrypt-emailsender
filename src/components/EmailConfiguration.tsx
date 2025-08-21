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
  AlertCircle,
  ExternalLink,
  Zap,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EmailConfig {
  id: string;
  name: string;
  type: 'gmail-oauth' | 'resend' | 'smtp';
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
  config: {
    email?: string;
    apiKey?: string;
    domain?: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
  };
}

export function EmailConfiguration() {
  const [emailConfigs, setEmailConfigs] = useState<EmailConfig[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<EmailConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthMessage, setOauthMessage] = useState<string>("");

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'gmail-oauth' as EmailConfig['type'],
    apiKey: '',
    domain: '',
    host: '',
    port: 587,
    username: '',
    password: '',
    secure: false
  });

  useEffect(() => {
    fetchEmailConfigs();

    // Check for OAuth callback messages
    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess = urlParams.get('oauth-success');
    const oauthError = urlParams.get('oauth-error');
    const email = urlParams.get('email');

    if (oauthSuccess && email) {
      if (oauthSuccess === 'connected') {
        setOauthMessage(`✅ Gmail workspace connected successfully for ${decodeURIComponent(email)}`);
      } else if (oauthSuccess === 'updated') {
        setOauthMessage(`✅ Gmail workspace tokens updated for ${decodeURIComponent(email)}`);
      }
      setTimeout(() => setOauthMessage(""), 5000);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchEmailConfigs(); // Refresh configs
    }

    if (oauthError) {
      setOauthMessage(`❌ Gmail OAuth error: ${decodeURIComponent(oauthError)}`);
      setTimeout(() => setOauthMessage(""), 5000);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchEmailConfigs = async () => {
    try {
      const response = await fetch('/api/email-config');
      if (response.ok) {
        const configs = await response.json();
        setEmailConfigs(configs);
      }
    } catch (error) {
      console.error('Failed to fetch email configs:', error);
    }
  };

  const handleGmailOAuth = async () => {
    setOauthLoading(true);
    try {
      const response = await fetch('/api/gmail-oauth/auth');
      const result = await response.json();

      if (result.authUrl) {
        // Redirect to Google OAuth
        window.location.href = result.authUrl;
      } else {
        setOauthMessage("❌ Failed to initiate Gmail OAuth");
      }
    } catch (error) {
      console.error('OAuth initiation error:', error);
      setOauthMessage("❌ Failed to connect to Gmail");
    } finally {
      setOauthLoading(false);
    }
  };

  const handleAddConfig = async () => {
    if (formData.type === 'gmail-oauth') {
      handleGmailOAuth();
      return;
    }

    setIsLoading(true);
    try {
      const configData = {
        name: formData.name,
        type: formData.type,
        config: formData.type === 'resend'
          ? {
              apiKey: formData.apiKey,
              domain: formData.domain || undefined
            }
          : {
              host: formData.host,
              port: formData.port,
              username: formData.username,
              password: formData.password,
              secure: formData.secure
            }
      };

      const response = await fetch('/api/email-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      });

      const result = await response.json();

      if (response.ok) {
        await fetchEmailConfigs();
        setIsAddDialogOpen(false);
        resetForm();
        setOauthMessage(`✅ ${formData.type === 'resend' ? 'Resend' : 'SMTP'} configuration added successfully`);
      } else {
        setOauthMessage(`❌ ${result.error || 'Failed to add configuration'}`);
      }
    } catch (error) {
      console.error('Failed to add email config:', error);
      setOauthMessage("❌ Failed to add email configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditConfig = async () => {
    if (!editingConfig) return;

    setIsLoading(true);
    try {
      const configData = {
        id: editingConfig.id,
        name: formData.name,
        config: formData.type === 'resend'
          ? {
              apiKey: formData.apiKey,
              domain: formData.domain || undefined
            }
          : {
              host: formData.host,
              port: formData.port,
              username: formData.username,
              password: formData.password,
              secure: formData.secure
            }
      };

      const response = await fetch('/api/email-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      });

      const result = await response.json();

      if (response.ok) {
        await fetchEmailConfigs();
        setIsEditDialogOpen(false);
        setEditingConfig(null);
        resetForm();
        setOauthMessage("✅ Configuration updated successfully");
      } else {
        setOauthMessage(`❌ ${result.error || 'Failed to update configuration'}`);
      }
    } catch (error) {
      console.error('Failed to update email config:', error);
      setOauthMessage("❌ Failed to update email configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfig = async (id: string) => {
    if (!confirm('Are you sure you want to delete this email configuration?')) return;

    try {
      const response = await fetch(`/api/email-config?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchEmailConfigs();
        setOauthMessage("✅ Configuration deleted successfully");
      }
    } catch (error) {
      console.error('Failed to delete email config:', error);
      setOauthMessage("❌ Failed to delete configuration");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch('/api/email-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isDefault: true })
      });

      if (response.ok) {
        await fetchEmailConfigs();
        setOauthMessage("✅ Default configuration updated");
      }
    } catch (error) {
      console.error('Failed to set default config:', error);
      setOauthMessage("❌ Failed to set default configuration");
    }
  };

  const openEditDialog = (config: EmailConfig) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      type: config.type,
      apiKey: '',
      domain: config.config.domain || '',
      host: config.config.host || '',
      port: config.config.port || 587,
      username: config.config.username || '',
      password: '',
      secure: config.config.port === 465
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'gmail-oauth',
      apiKey: '',
      domain: '',
      host: '',
      port: 587,
      username: '',
      password: '',
      secure: false
    });
  };

  const getStatusIcon = (config: EmailConfig) => {
    if (config.isActive) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getTypeIcon = (type: EmailConfig['type']) => {
    switch (type) {
      case 'gmail-oauth':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'resend':
        return <Zap className="h-4 w-4 text-purple-500" />;
      case 'smtp':
        return <Server className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeName = (type: EmailConfig['type']) => {
    switch (type) {
      case 'gmail-oauth':
        return 'Gmail Workspace';
      case 'resend':
        return 'Resend API';
      case 'smtp':
        return 'SMTP';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Set up email providers for sending campaigns. Gmail Workspace OAuth recommended for best deliverability.
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Email Provider
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* OAuth Message */}
      {oauthMessage && (
        <Alert className={oauthMessage.includes('✅') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{oauthMessage}</AlertDescription>
        </Alert>
      )}

      {/* Configurations List */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Email/Domain</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emailConfigs.map((config) => (
                <TableRow key={config.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(config.type)}
                      <span>{getTypeName(config.type)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{config.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(config)}
                      <span className="capitalize">
                        {config.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {config.config.email || config.config.domain || config.config.host || '-'}
                  </TableCell>
                  <TableCell>
                    {config.isDefault ? (
                      <Badge>Default</Badge>
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
                      {config.type !== 'gmail-oauth' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(config)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteConfig(config.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {emailConfigs.length === 0 && (
            <div className="p-8 text-center">
              <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No email providers configured</h3>
              <p className="text-gray-500 mb-4">Add your first email provider to start sending campaigns</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Email Provider
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Provider Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Email Provider</DialogTitle>
            <DialogDescription>
              Choose and configure your email sending provider
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Provider Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: EmailConfig['type']) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gmail-oauth">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <span>Gmail Workspace (Recommended)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="resend">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-purple-500" />
                      <span>Resend API</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="smtp">
                    <div className="flex items-center space-x-2">
                      <Server className="h-4 w-4 text-gray-500" />
                      <span>Custom SMTP</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs value={formData.type} className="w-full">
              <TabsContent value="gmail-oauth" className="space-y-4">
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    Connect your Gmail Workspace account using secure OAuth. This provides the best deliverability and allows sending from your actual email address.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="gmail-name">Configuration Name</Label>
                  <Input
                    id="gmail-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., My Gmail Workspace"
                  />
                </div>
              </TabsContent>

              <TabsContent value="resend" className="space-y-4">
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    Resend provides reliable email delivery with built-in analytics. Get your API key from your Resend dashboard.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="resend-name">Configuration Name</Label>
                    <Input
                      id="resend-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Resend Production"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resend-domain">Domain (Optional)</Label>
                    <Input
                      id="resend-domain"
                      value={formData.domain}
                      onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                      placeholder="yourdomain.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resend-key">Resend API Key</Label>
                  <Input
                    id="resend-key"
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="re_..."
                  />
                </div>
              </TabsContent>

              <TabsContent value="smtp" className="space-y-4">
                <Alert>
                  <Server className="h-4 w-4" />
                  <AlertDescription>
                    Configure a custom SMTP server. Note: Gmail Workspace OAuth is recommended for better deliverability.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="smtp-name">Configuration Name</Label>
                  <Input
                    id="smtp-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Company SMTP"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">SMTP Host</Label>
                    <Input
                      id="smtp-host"
                      value={formData.host}
                      onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">Port</Label>
                    <Input
                      id="smtp-port"
                      type="number"
                      value={formData.port}
                      onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) || 587 }))}
                      placeholder="587"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-username">Username</Label>
                    <Input
                      id="smtp-username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="your-email@domain.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp-password">Password</Label>
                    <Input
                      id="smtp-password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Your password or app password"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="smtp-secure"
                    checked={formData.secure}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, secure: checked }))}
                  />
                  <Label htmlFor="smtp-secure">Use SSL/TLS (Port 465)</Label>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddConfig}
              disabled={isLoading || oauthLoading}
            >
              {isLoading || oauthLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : formData.type === 'gmail-oauth' ? (
                <ExternalLink className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {formData.type === 'gmail-oauth'
                ? 'Connect Gmail Workspace'
                : 'Add Configuration'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Provider Dialog (for non-OAuth providers) */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Email Provider</DialogTitle>
            <DialogDescription>
              Update your email provider configuration
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Configuration Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Configuration name"
              />
            </div>

            {editingConfig?.type === 'resend' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-domain">Domain (Optional)</Label>
                  <Input
                    id="edit-domain"
                    value={formData.domain}
                    onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="yourdomain.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-key">Resend API Key</Label>
                  <Input
                    id="edit-key"
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter new API key to update"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-host">SMTP Host</Label>
                    <Input
                      id="edit-host"
                      value={formData.host}
                      onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-port">Port</Label>
                    <Input
                      id="edit-port"
                      type="number"
                      value={formData.port}
                      onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) || 587 }))}
                      placeholder="587"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-username">Username</Label>
                    <Input
                      id="edit-username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="your-email@domain.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-password">Password</Label>
                    <Input
                      id="edit-password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Leave empty to keep current password"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditConfig} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="mr-2 h-4 w-4" />
              )}
              Update Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}