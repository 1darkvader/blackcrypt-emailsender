"use client";

import { useState, useEffect, useRef } from "react";
import {
  Globe,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Activity,
  Zap,
  Shield,
  Settings,
  BarChart3,
  AlertTriangle,
  Clock,
  Wifi,
  Upload,
  FileText,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface ProxyConfig {
  id: string;
  name: string;
  type: 'http' | 'https' | 'socks4' | 'socks5';
  host: string;
  port: number;
  username?: string;
  password?: string;
  country?: string;
  city?: string;
  isActive: boolean;
  health: {
    status: 'online' | 'offline' | 'checking';
    latency: number;
    lastCheck: string;
    uptime: number;
    totalRequests: number;
    failedRequests: number;
  };
}

interface RotationStrategy {
  type: 'round-robin' | 'random' | 'least-used' | 'fastest' | 'geographic';
  enabled: boolean;
  intervalSeconds: number;
  maxRequestsPerProxy: number;
  failoverEnabled: boolean;
  healthCheckInterval: number;
}

interface ProxyStats {
  totalProxies: number;
  activeProxies: number;
  averageLatency: number;
  successRate: number;
  totalRequests: number;
  requestsToday: number;
}

export function ProxyManager() {
  const [proxies, setProxies] = useState<ProxyConfig[]>([]);
  const [rotationStrategy, setRotationStrategy] = useState<RotationStrategy>({
    type: 'round-robin',
    enabled: true,
    intervalSeconds: 300,
    maxRequestsPerProxy: 100,
    failoverEnabled: true,
    healthCheckInterval: 60
  });
  const [proxyStats, setProxyStats] = useState<ProxyStats>({
    totalProxies: 0,
    activeProxies: 0,
    averageLatency: 0,
    successRate: 0,
    totalRequests: 0,
    requestsToday: 0
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProxy, setEditingProxy] = useState<ProxyConfig | null>(null);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [bulkProxyText, setBulkProxyText] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'http' as ProxyConfig['type'],
    host: '',
    port: 8080,
    username: '',
    password: '',
    country: '',
    city: ''
  });

  useEffect(() => {
    loadProxyData();
    // Set up periodic health checks
    const healthCheckInterval = setInterval(checkAllProxiesHealth, rotationStrategy.healthCheckInterval * 1000);
    return () => clearInterval(healthCheckInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotationStrategy.healthCheckInterval]);

  const loadProxyData = async () => {
    try {
      // Force clear any existing demo or saved data to start completely fresh
      localStorage.removeItem('proxy-configs');

      // Start with completely empty state - no demo data at all
      setProxies([]);
      setRotationStrategy({
        type: 'round-robin',
        enabled: true,
        intervalSeconds: 300,
        maxRequestsPerProxy: 100,
        failoverEnabled: true,
        healthCheckInterval: 60
      });

      updateProxyStats([]);
      console.log('✅ Proxy Manager: All demo data cleared, starting completely empty');
    } catch (error) {
      console.error('Failed to load proxy data:', error);
    }
  };

  const saveProxyData = (updatedProxies: ProxyConfig[]) => {
    setProxies(updatedProxies);
    const data = {
      proxies: updatedProxies,
      rotationStrategy
    };
    localStorage.setItem('proxy-configs', JSON.stringify(data));
    updateProxyStats(updatedProxies);
  };

  const updateProxyStats = (proxyList: ProxyConfig[]) => {
    const activeProxies = proxyList.filter(p => p.isActive && p.health.status === 'online');
    const totalRequests = proxyList.reduce((sum, p) => sum + p.health.totalRequests, 0);
    const totalFailed = proxyList.reduce((sum, p) => sum + p.health.failedRequests, 0);
    const averageLatency = activeProxies.length > 0
      ? activeProxies.reduce((sum, p) => sum + p.health.latency, 0) / activeProxies.length
      : 0;

    setProxyStats({
      totalProxies: proxyList.length,
      activeProxies: activeProxies.length,
      averageLatency: Math.round(averageLatency),
      successRate: totalRequests > 0 ? ((totalRequests - totalFailed) / totalRequests) * 100 : 0,
      totalRequests,
      requestsToday: Math.floor(totalRequests * 0.1) // Simulate today's requests
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setBulkProxyText(content);
      };
      reader.readAsText(file);
    }
  };

  const parseProxyList = (text: string): ProxyConfig[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const parsedProxies: ProxyConfig[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Support multiple formats:
      // 1. host:port
      // 2. host:port:username:password
      // 3. protocol://host:port
      // 4. protocol://username:password@host:port
      // 5. host:port@username:password

      const proxy: Partial<ProxyConfig> = {
        id: Date.now().toString() + index,
        name: `Proxy ${index + 1}`,
        isActive: true,
        health: {
          status: 'checking' as const,
          latency: 0,
          lastCheck: new Date().toISOString(),
          uptime: 0,
          totalRequests: 0,
          failedRequests: 0
        }
      };

      try {
        // Format: protocol://username:password@host:port
        if (trimmedLine.includes('://') && trimmedLine.includes('@')) {
          const [protocolPart, hostPart] = trimmedLine.split('://');
          const [authPart, addressPart] = hostPart.split('@');
          const [host, port] = addressPart.split(':');
          const [username, password] = authPart.split(':');

          proxy.type = protocolPart.toLowerCase() as ProxyConfig['type'];
          proxy.host = host;
          proxy.port = parseInt(port) || 8080;
          proxy.username = username;
          proxy.password = password;
        }
        // Format: protocol://host:port
        else if (trimmedLine.includes('://')) {
          const [protocolPart, addressPart] = trimmedLine.split('://');
          const [host, port] = addressPart.split(':');

          proxy.type = protocolPart.toLowerCase() as ProxyConfig['type'];
          proxy.host = host;
          proxy.port = parseInt(port) || 8080;
        }
        // Format: host:port:username:password
        else if (trimmedLine.split(':').length === 4) {
          const [host, port, username, password] = trimmedLine.split(':');
          proxy.type = 'http';
          proxy.host = host;
          proxy.port = parseInt(port) || 8080;
          proxy.username = username;
          proxy.password = password;
        }
        // Format: host:port@username:password
        else if (trimmedLine.includes('@')) {
          const [addressPart, authPart] = trimmedLine.split('@');
          const [host, port] = addressPart.split(':');
          const [username, password] = authPart.split(':');

          proxy.type = 'http';
          proxy.host = host;
          proxy.port = parseInt(port) || 8080;
          proxy.username = username;
          proxy.password = password;
        }
        // Format: host:port
        else {
          const [host, port] = trimmedLine.split(':');
          proxy.type = 'http';
          proxy.host = host;
          proxy.port = parseInt(port) || 8080;
        }

        if (proxy.host && proxy.port) {
          parsedProxies.push(proxy as ProxyConfig);
        }
      } catch (error) {
        console.error(`Failed to parse proxy line: ${trimmedLine}`, error);
      }
    });

    return parsedProxies;
  };

  const handleBulkUpload = async () => {
    if (!bulkProxyText.trim()) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const newProxies = parseProxyList(bulkProxyText);

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (newProxies.length > 0) {
        const updatedProxies = [...proxies, ...newProxies];
        saveProxyData(updatedProxies);

        // Test all new proxies
        newProxies.forEach(proxy => {
          setTimeout(() => testProxyHealth(proxy.id), Math.random() * 5000);
        });

        setIsBulkUploadOpen(false);
        setBulkProxyText("");
        setUploadProgress(0);
      }
    } catch (error) {
      console.error('Failed to process bulk upload:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const exportProxies = () => {
    const exportData = proxies.map(proxy => {
      if (proxy.username && proxy.password) {
        return `${proxy.type}://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
      }
      return `${proxy.type}://${proxy.host}:${proxy.port}`;
    }).join('\n');

    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'proxies.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddProxy = async () => {
    const newProxy: ProxyConfig = {
      id: Date.now().toString(),
      name: formData.name,
      type: formData.type,
      host: formData.host,
      port: formData.port,
      username: formData.username || undefined,
      password: formData.password || undefined,
      country: formData.country || undefined,
      city: formData.city || undefined,
      isActive: true,
      health: {
        status: 'checking',
        latency: 0,
        lastCheck: new Date().toISOString(),
        uptime: 0,
        totalRequests: 0,
        failedRequests: 0
      }
    };

    const updatedProxies = [...proxies, newProxy];
    saveProxyData(updatedProxies);
    setIsAddDialogOpen(false);
    resetForm();

    // Test the new proxy
    testProxyHealth(newProxy.id);
  };

  const handleEditProxy = async () => {
    if (!editingProxy) return;

    const updatedProxy: ProxyConfig = {
      ...editingProxy,
      name: formData.name,
      type: formData.type,
      host: formData.host,
      port: formData.port,
      username: formData.username || undefined,
      password: formData.password || undefined,
      country: formData.country || undefined,
      city: formData.city || undefined
    };

    const updatedProxies = proxies.map(p =>
      p.id === editingProxy.id ? updatedProxy : p
    );
    saveProxyData(updatedProxies);
    setIsEditDialogOpen(false);
    setEditingProxy(null);
    resetForm();

    // Re-test the updated proxy
    testProxyHealth(updatedProxy.id);
  };

  const handleDeleteProxy = (id: string) => {
    if (confirm('Are you sure you want to delete this proxy?')) {
      const updatedProxies = proxies.filter(p => p.id !== id);
      saveProxyData(updatedProxies);
    }
  };

  const toggleProxyActive = (id: string) => {
    const updatedProxies = proxies.map(p =>
      p.id === id ? { ...p, isActive: !p.isActive } : p
    );
    saveProxyData(updatedProxies);
  };

  const testProxyHealth = async (proxyId: string) => {
    const updatedProxies = proxies.map(p =>
      p.id === proxyId
        ? { ...p, health: { ...p.health, status: 'checking' as const } }
        : p
    );
    setProxies(updatedProxies);

    // Simulate proxy health check
    setTimeout(() => {
      const isHealthy = Math.random() > 0.2; // 80% success rate
      const latency = Math.floor(Math.random() * 200) + 20;

      const finalProxies = proxies.map(p =>
        p.id === proxyId
          ? {
              ...p,
              health: {
                ...p.health,
                status: isHealthy ? 'online' as const : 'offline' as const,
                latency: isHealthy ? latency : 0,
                lastCheck: new Date().toISOString(),
                uptime: isHealthy ? Math.random() * 40 + 60 : 0
              }
            }
          : p
      );
      saveProxyData(finalProxies);
    }, 2000);
  };

  const checkAllProxiesHealth = async () => {
    setIsTestingAll(true);

    for (const proxy of proxies) {
      if (proxy.isActive) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Stagger requests
        testProxyHealth(proxy.id);
      }
    }

    setTimeout(() => setIsTestingAll(false), 3000);
  };

  const openEditDialog = (proxy: ProxyConfig) => {
    setEditingProxy(proxy);
    setFormData({
      name: proxy.name,
      type: proxy.type,
      host: proxy.host,
      port: proxy.port,
      username: proxy.username || '',
      password: proxy.password || '',
      country: proxy.country || '',
      city: proxy.city || ''
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'http',
      host: '',
      port: 8080,
      username: '',
      password: '',
      country: '',
      city: ''
    });
  };

  const getStatusIcon = (status: ProxyConfig['health']['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 100) return 'text-green-600';
    if (latency < 300) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Proxy Rotation Manager</span>
              </CardTitle>
              <CardDescription>
                Manage proxy servers for distributed email sending and enhanced deliverability
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import Proxies
              </Button>
              <Button variant="outline" onClick={exportProxies} disabled={proxies.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export Proxies
              </Button>
              <Button variant="outline" onClick={checkAllProxiesHealth} disabled={isTestingAll}>
                {isTestingAll ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
                Test All
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Proxy
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold">{proxyStats.activeProxies}/{proxyStats.totalProxies}</div>
            <div className="text-sm text-muted-foreground">Active Proxies</div>
            <Wifi className="h-4 w-4 mx-auto mt-2 text-green-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className={`text-2xl font-bold ${getLatencyColor(proxyStats.averageLatency)}`}>
              {proxyStats.averageLatency}ms
            </div>
            <div className="text-sm text-muted-foreground">Avg Latency</div>
            <Clock className="h-4 w-4 mx-auto mt-2 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className={`text-2xl font-bold ${proxyStats.successRate > 95 ? 'text-green-600' : proxyStats.successRate > 90 ? 'text-yellow-600' : 'text-red-600'}`}>
              {proxyStats.successRate.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
            <BarChart3 className="h-4 w-4 mx-auto mt-2 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold">{proxyStats.requestsToday.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Requests Today</div>
            <Zap className="h-4 w-4 mx-auto mt-2 text-blue-500" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="proxies">
        <TabsList>
          <TabsTrigger value="proxies">Proxy List</TabsTrigger>
          <TabsTrigger value="rotation">Rotation Settings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="proxies" className="space-y-4">
          {proxies.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Globe className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No proxies configured</h3>
                <p className="text-gray-500 mb-6">Get started by importing proxy lists or adding individual proxies</p>
                <div className="flex justify-center space-x-3">
                  <Button onClick={() => setIsBulkUploadOpen(true)} size="lg">
                    <Upload className="mr-2 h-4 w-4" />
                    Import Proxy List
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(true)} size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Single Proxy
                  </Button>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>💡 Tip: Use "Import Proxy List" to upload multiple proxies at once from a text file</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Host:Port</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Latency</TableHead>
                      <TableHead>Uptime</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proxies.map((proxy) => (
                      <TableRow key={proxy.id}>
                        <TableCell className="font-medium">{proxy.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{proxy.type.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{proxy.host}:{proxy.port}</TableCell>
                        <TableCell>
                          {proxy.city && proxy.country ? `${proxy.city}, ${proxy.country}` : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(proxy.health.status)}
                            <span className="capitalize">{proxy.health.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {proxy.health.status === 'online' ? (
                            <span className={getLatencyColor(proxy.health.latency)}>
                              {proxy.health.latency}ms
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {proxy.health.uptime > 0 ? `${proxy.health.uptime.toFixed(1)}%` : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Switch
                              checked={proxy.isActive}
                              onCheckedChange={() => toggleProxyActive(proxy.id)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => testProxyHealth(proxy.id)}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(proxy)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProxy(proxy.id)}
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
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rotation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rotation Strategy</CardTitle>
              <CardDescription>Configure how proxies are rotated during email sending</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Proxy Rotation</Label>
                  <p className="text-sm text-muted-foreground">Automatically rotate between available proxies</p>
                </div>
                <Switch
                  checked={rotationStrategy.enabled}
                  onCheckedChange={(checked) => setRotationStrategy(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rotation Type</Label>
                  <Select
                    value={rotationStrategy.type}
                    onValueChange={(value: RotationStrategy['type']) =>
                      setRotationStrategy(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round-robin">Round Robin</SelectItem>
                      <SelectItem value="random">Random</SelectItem>
                      <SelectItem value="least-used">Least Used</SelectItem>
                      <SelectItem value="fastest">Fastest Response</SelectItem>
                      <SelectItem value="geographic">Geographic Distribution</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Rotation Interval (seconds)</Label>
                  <Input
                    type="number"
                    value={rotationStrategy.intervalSeconds}
                    onChange={(e) => setRotationStrategy(prev => ({
                      ...prev,
                      intervalSeconds: parseInt(e.target.value) || 300
                    }))}
                    min="60"
                    max="3600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Requests Per Proxy</Label>
                  <Input
                    type="number"
                    value={rotationStrategy.maxRequestsPerProxy}
                    onChange={(e) => setRotationStrategy(prev => ({
                      ...prev,
                      maxRequestsPerProxy: parseInt(e.target.value) || 100
                    }))}
                    min="10"
                    max="1000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Health Check Interval (seconds)</Label>
                  <Input
                    type="number"
                    value={rotationStrategy.healthCheckInterval}
                    onChange={(e) => setRotationStrategy(prev => ({
                      ...prev,
                      healthCheckInterval: parseInt(e.target.value) || 60
                    }))}
                    min="30"
                    max="600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Failover</Label>
                  <p className="text-sm text-muted-foreground">Automatically skip offline proxies</p>
                </div>
                <Switch
                  checked={rotationStrategy.failoverEnabled}
                  onCheckedChange={(checked) => setRotationStrategy(prev => ({ ...prev, failoverEnabled: checked }))}
                />
              </div>

              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Current strategy: {rotationStrategy.type.replace('-', ' ')} rotation every {rotationStrategy.intervalSeconds} seconds
                  with failover {rotationStrategy.failoverEnabled ? 'enabled' : 'disabled'}.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Proxy Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {proxies.slice(0, 5).map((proxy) => (
                    <div key={proxy.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{proxy.name}</span>
                        <span>{proxy.health.totalRequests} requests</span>
                      </div>
                      <Progress
                        value={proxy.health.totalRequests / Math.max(...proxies.map(p => p.health.totalRequests), 1) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from(new Set(proxies.map(p => p.country).filter(Boolean))).map((country) => {
                    const countryProxies = proxies.filter(p => p.country === country);
                    return (
                      <div key={country} className="flex justify-between items-center">
                        <span>{country}</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{countryProxies.length}</Badge>
                          <div className="flex space-x-1">
                            {countryProxies.map(proxy => (
                              <div key={proxy.id} className={`w-2 h-2 rounded-full ${
                                proxy.health.status === 'online' ? 'bg-green-500' :
                                proxy.health.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                              }`} />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Request Distribution</CardTitle>
              <CardDescription>Request volume across all proxies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Total requests: {proxyStats.totalRequests}</div>
                <Progress value={85} className="h-3" />
                <div className="text-sm text-muted-foreground">Today's usage: 85% of daily limit</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Upload Dialog */}
      <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import Proxy List</DialogTitle>
            <DialogDescription>
              Import multiple proxies from a text file or paste them directly. Supports various formats.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Upload from File</Label>
              <div className="flex space-x-2">
                <Input
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Browse
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proxy-list">Or Paste Proxy List</Label>
              <Textarea
                id="proxy-list"
                placeholder={`Enter proxies, one per line. Supported formats:
host:port
host:port:username:password
protocol://host:port
protocol://username:password@host:port
host:port@username:password

Example:
192.168.1.1:8080
http://192.168.1.2:3128
socks5://user:pass@192.168.1.3:1080`}
                value={bulkProxyText}
                onChange={(e) => setBulkProxyText(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            {bulkProxyText && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="p-3 bg-muted rounded text-sm">
                  <div className="font-medium">
                    {parseProxyList(bulkProxyText).length} proxies will be imported
                  </div>
                  <div className="text-muted-foreground mt-1">
                    {parseProxyList(bulkProxyText).slice(0, 3).map((proxy, i) => (
                      <div key={i}>{proxy.type}://{proxy.host}:{proxy.port}</div>
                    ))}
                    {parseProxyList(bulkProxyText).length > 3 && (
                      <div>... and {parseProxyList(bulkProxyText).length - 3} more</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isUploading && (
              <div className="space-y-2">
                <Label>Upload Progress</Label>
                <Progress value={uploadProgress} className="h-2" />
                <div className="text-sm text-muted-foreground">
                  Processing proxies... {uploadProgress}%
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkUpload}
              disabled={!bulkProxyText.trim() || isUploading}
            >
              {isUploading ? 'Uploading...' : `Import ${parseProxyList(bulkProxyText).length} Proxies`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Proxy Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Proxy</DialogTitle>
            <DialogDescription>Configure a new proxy server for email sending</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proxy-name">Proxy Name</Label>
                <Input
                  id="proxy-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., US East Proxy 1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proxy-type">Protocol</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: ProxyConfig['type']) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="http">HTTP</SelectItem>
                    <SelectItem value="https">HTTPS</SelectItem>
                    <SelectItem value="socks4">SOCKS4</SelectItem>
                    <SelectItem value="socks5">SOCKS5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proxy-host">Host/IP Address</Label>
                <Input
                  id="proxy-host"
                  value={formData.host}
                  onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                  placeholder="198.51.100.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proxy-port">Port</Label>
                <Input
                  id="proxy-port"
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) || 8080 }))}
                  placeholder="8080"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proxy-username">Username (Optional)</Label>
                <Input
                  id="proxy-username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proxy-password">Password (Optional)</Label>
                <Input
                  id="proxy-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Password"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proxy-country">Country (Optional)</Label>
                <Input
                  id="proxy-country"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="United States"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proxy-city">City (Optional)</Label>
                <Input
                  id="proxy-city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="New York"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddProxy}
              disabled={!formData.name || !formData.host || !formData.port}
            >
              Add Proxy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Proxy Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Proxy</DialogTitle>
            <DialogDescription>Update proxy server configuration</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Same form fields as Add dialog */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-proxy-name">Proxy Name</Label>
                <Input
                  id="edit-proxy-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., US East Proxy 1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-proxy-type">Protocol</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: ProxyConfig['type']) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="http">HTTP</SelectItem>
                    <SelectItem value="https">HTTPS</SelectItem>
                    <SelectItem value="socks4">SOCKS4</SelectItem>
                    <SelectItem value="socks5">SOCKS5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-proxy-host">Host/IP Address</Label>
                <Input
                  id="edit-proxy-host"
                  value={formData.host}
                  onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                  placeholder="198.51.100.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-proxy-port">Port</Label>
                <Input
                  id="edit-proxy-port"
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) || 8080 }))}
                  placeholder="8080"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-proxy-username">Username (Optional)</Label>
                <Input
                  id="edit-proxy-username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-proxy-password">Password (Optional)</Label>
                <Input
                  id="edit-proxy-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Leave empty to keep current"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-proxy-country">Country (Optional)</Label>
                <Input
                  id="edit-proxy-country"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="United States"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-proxy-city">City (Optional)</Label>
                <Input
                  id="edit-proxy-city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="New York"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditProxy}
              disabled={!formData.name || !formData.host || !formData.port}
            >
              Update Proxy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
