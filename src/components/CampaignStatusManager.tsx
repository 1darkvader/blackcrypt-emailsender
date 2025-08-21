"use client";

import { useState } from "react";
import {
  Play,
  Pause,
  Square,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  Activity,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Campaign {
  id: string;
  name: string;
  contacts: Array<{ email: string; name?: string }>;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'stopped';
  createdAt: string;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
  };
  settings: {
    sendingInterval: number;
    dailyLimit: number;
    startTime?: string;
  };
}

interface CampaignStatusManagerProps {
  campaigns: Campaign[];
  onStatusChange: (campaignId: string, newStatus: Campaign['status']) => void;
  onRefresh: () => void;
}

export function CampaignStatusManager({ campaigns, onStatusChange, onRefresh }: CampaignStatusManagerProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ action: string; campaign: Campaign } | null>(null);
  const [isLoading, setIsLoading] = useState<string>("");

  const handleStatusChange = async (campaignId: string, newStatus: Campaign['status']) => {
    setIsLoading(campaignId);
    try {
      // Update campaign status via API
      const response = await fetch('/api/campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: campaignId, status: newStatus })
      });

      if (response.ok) {
        onStatusChange(campaignId, newStatus);
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to update campaign status:', error);
    } finally {
      setIsLoading("");
      setConfirmAction(null);
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'draft': return 'text-gray-500';
      case 'scheduled': return 'text-blue-500';
      case 'sending': return 'text-green-500';
      case 'completed': return 'text-green-600';
      case 'paused': return 'text-yellow-500';
      case 'stopped': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: Campaign['status']) => {
    switch (status) {
      case 'sending': return 'default';
      case 'completed': return 'default';
      case 'paused': return 'secondary';
      case 'stopped': return 'destructive';
      default: return 'outline';
    }
  };

  const canStart = (campaign: Campaign) =>
    ['draft', 'scheduled', 'paused'].includes(campaign.status) && campaign.contacts.length > 0;

  const canPause = (campaign: Campaign) =>
    campaign.status === 'sending';

  const canStop = (campaign: Campaign) =>
    ['sending', 'paused', 'scheduled'].includes(campaign.status);

  const getProgress = (campaign: Campaign) => {
    if (campaign.contacts.length === 0) return 0;
    return (campaign.stats.sent / campaign.contacts.length) * 100;
  };

  const getEstimatedTime = (campaign: Campaign) => {
    const remaining = campaign.contacts.length - campaign.stats.sent;
    const minutes = Math.ceil((remaining * campaign.settings.sendingInterval) / 60);

    if (minutes < 60) return `~${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `~${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Active Campaigns Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Campaign Status Manager</span>
          </CardTitle>
          <CardDescription>
            Monitor and control your email campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {campaigns.filter(c => c.status === 'sending').length}
              </div>
              <div className="text-sm text-muted-foreground">Sending</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {campaigns.filter(c => c.status === 'paused').length}
              </div>
              <div className="text-sm text-muted-foreground">Paused</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {campaigns.filter(c => c.status === 'scheduled').length}
              </div>
              <div className="text-sm text-muted-foreground">Scheduled</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {campaigns.filter(c => c.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign List with Controls */}
      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div>
                    <h3 className="font-semibold text-lg">{campaign.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={getStatusBadgeVariant(campaign.status)} className="flex items-center space-x-1">
                        {campaign.status === 'sending' && <Activity className="h-3 w-3 animate-pulse" />}
                        {campaign.status === 'paused' && <Pause className="h-3 w-3" />}
                        {campaign.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                        {campaign.status === 'scheduled' && <Clock className="h-3 w-3" />}
                        <span className="capitalize">{campaign.status}</span>
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {campaign.contacts.length} contacts
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Quick Actions */}
                  {canStart(campaign) && (
                    <Button
                      size="sm"
                      onClick={() => setConfirmAction({ action: 'start', campaign })}
                      disabled={isLoading === campaign.id}
                      className="flex items-center space-x-1"
                    >
                      <Play className="h-4 w-4" />
                      <span>{campaign.status === 'paused' ? 'Resume' : 'Start'}</span>
                    </Button>
                  )}

                  {canPause(campaign) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmAction({ action: 'pause', campaign })}
                      disabled={isLoading === campaign.id}
                      className="flex items-center space-x-1"
                    >
                      <Pause className="h-4 w-4" />
                      <span>Pause</span>
                    </Button>
                  )}

                  {canStop(campaign) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmAction({ action: 'stop', campaign })}
                      disabled={isLoading === campaign.id}
                      className="flex items-center space-x-1"
                    >
                      <Square className="h-4 w-4" />
                      <span>Stop</span>
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setSelectedCampaign(campaign)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>Edit Campaign</DropdownMenuItem>
                      <DropdownMenuItem>View Analytics</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{campaign.stats.sent} / {campaign.contacts.length} sent</span>
                </div>
                <Progress value={getProgress(campaign)} className="h-2" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <div className="font-medium">{campaign.stats.sent}</div>
                  <div className="text-muted-foreground">Sent</div>
                </div>
                <div>
                  <div className="font-medium">{campaign.stats.opened}</div>
                  <div className="text-muted-foreground">Opened</div>
                </div>
                <div>
                  <div className="font-medium">{campaign.stats.clicked}</div>
                  <div className="text-muted-foreground">Clicked</div>
                </div>
                <div>
                  <div className="font-medium">{campaign.stats.failed}</div>
                  <div className="text-muted-foreground">Failed</div>
                </div>
                <div>
                  <div className="font-medium">
                    {campaign.status === 'sending' ? getEstimatedTime(campaign) : '-'}
                  </div>
                  <div className="text-muted-foreground">Est. Time</div>
                </div>
              </div>

              {/* Alerts for problematic campaigns */}
              {campaign.stats.failed > 10 && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    High failure rate detected. Check your SMTP configuration.
                  </AlertDescription>
                </Alert>
              )}

              {campaign.status === 'sending' && campaign.stats.sent === 0 && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Campaign is sending but no emails have been sent yet. Check email queue status.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ))}

        {campaigns.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Send className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-500">Create your first email campaign to get started</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.action === 'start' && 'Start Campaign'}
              {confirmAction?.action === 'pause' && 'Pause Campaign'}
              {confirmAction?.action === 'stop' && 'Stop Campaign'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.action === 'start' &&
                `Are you sure you want to ${confirmAction.campaign.status === 'paused' ? 'resume' : 'start'} "${confirmAction.campaign.name}"? Emails will begin sending to ${confirmAction.campaign.contacts.length} contacts.`
              }
              {confirmAction?.action === 'pause' &&
                `Are you sure you want to pause "${confirmAction.campaign.name}"? You can resume it later.`
              }
              {confirmAction?.action === 'stop' &&
                `Are you sure you want to stop "${confirmAction.campaign.name}"? This action cannot be undone and the campaign will need to be restarted from the beginning.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirmAction) {
                  const newStatus = confirmAction.action === 'start' ? 'sending' :
                                  confirmAction.action === 'pause' ? 'paused' : 'stopped';
                  handleStatusChange(confirmAction.campaign.id, newStatus);
                }
              }}
              disabled={isLoading === confirmAction?.campaign.id}
              variant={confirmAction?.action === 'stop' ? 'destructive' : 'default'}
            >
              {isLoading === confirmAction?.campaign.id ? 'Processing...' :
               confirmAction?.action === 'start' ? (confirmAction.campaign.status === 'paused' ? 'Resume' : 'Start') :
               confirmAction?.action === 'pause' ? 'Pause' : 'Stop'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Details Modal */}
      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCampaign?.name}</DialogTitle>
            <DialogDescription>Campaign details and settings</DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge variant={getStatusBadgeVariant(selectedCampaign.status)} className="mt-1">
                    {selectedCampaign.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Created</label>
                  <div className="text-sm mt-1">
                    {new Date(selectedCampaign.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Settings</label>
                <div className="mt-1 space-y-1 text-sm">
                  <div>Sending Interval: {selectedCampaign.settings.sendingInterval}s</div>
                  <div>Daily Limit: {selectedCampaign.settings.dailyLimit}</div>
                  {selectedCampaign.settings.startTime && (
                    <div>Start Time: {new Date(selectedCampaign.settings.startTime).toLocaleString()}</div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Performance</label>
                <div className="mt-1 grid grid-cols-2 gap-4 text-sm">
                  <div>Sent: {selectedCampaign.stats.sent}</div>
                  <div>Delivered: {selectedCampaign.stats.delivered}</div>
                  <div>Opened: {selectedCampaign.stats.opened}</div>
                  <div>Clicked: {selectedCampaign.stats.clicked}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
