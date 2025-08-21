"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import {
  Eye,
  MousePointer,
  Mail,
  Users,
  TrendingUp,
  Calendar,
  Activity,
  Target
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'stopped';
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
  };
  createdAt: string;
}

interface TrackingStats {
  totalRecipients: number;
  totalOpens: number;
  uniqueOpens: number;
  openRate: number;
  tracking: Array<{
    trackingId: string;
    contactEmail: string;
    openCount: number;
    firstOpened?: string;
    lastOpened?: string;
  }>;
}

interface ClickStats {
  totalClicks: number;
  uniqueClicks: number;
  clickedContacts: number;
  topLinks: Record<string, number>;
  clicks: Array<{
    linkId: string;
    contactEmail: string;
    originalUrl: string;
    clickCount: number;
    firstClicked?: string;
    lastClicked?: string;
  }>;
}

interface AnalyticsDashboardProps {
  campaigns: Campaign[];
}

export function AnalyticsDashboard({ campaigns }: AnalyticsDashboardProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [trackingStats, setTrackingStats] = useState<TrackingStats | null>(null);
  const [clickStats, setClickStats] = useState<ClickStats | null>(null);
  const [timeRange, setTimeRange] = useState<string>("7d");

  useEffect(() => {
    if (selectedCampaign) {
      fetchTrackingData(selectedCampaign);
    }
  }, [selectedCampaign]);

  const fetchTrackingData = async (campaignId: string) => {
    try {
      // Fetch open tracking data
      const trackingResponse = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId })
      });

      if (trackingResponse.ok) {
        const trackingData = await trackingResponse.json();
        setTrackingStats(trackingData);
      }

      // Fetch click tracking data
      const clickResponse = await fetch('/api/link-redirect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId })
      });

      if (clickResponse.ok) {
        const clickData = await clickResponse.json();
        setClickStats(clickData);
      }
    } catch (error) {
      console.error('Failed to fetch tracking data:', error);
    }
  };

  // Calculate overall metrics
  const overallMetrics = {
    totalCampaigns: campaigns.length,
    totalSent: campaigns.reduce((sum, c) => sum + c.stats.sent, 0),
    totalOpened: campaigns.reduce((sum, c) => sum + c.stats.opened, 0),
    totalClicked: campaigns.reduce((sum, c) => sum + c.stats.clicked, 0),
    avgOpenRate: campaigns.length > 0 ?
      campaigns.reduce((sum, c) => sum + (c.stats.sent > 0 ? (c.stats.opened / c.stats.sent) * 100 : 0), 0) / campaigns.length : 0,
    avgClickRate: campaigns.length > 0 ?
      campaigns.reduce((sum, c) => sum + (c.stats.sent > 0 ? (c.stats.clicked / c.stats.sent) * 100 : 0), 0) / campaigns.length : 0
  };

  // Prepare campaign performance data for charts
  const campaignPerformanceData = campaigns.map(campaign => ({
    name: campaign.name.substring(0, 15) + (campaign.name.length > 15 ? '...' : ''),
    sent: campaign.stats.sent,
    opened: campaign.stats.opened,
    clicked: campaign.stats.clicked,
    openRate: campaign.stats.sent > 0 ? (campaign.stats.opened / campaign.stats.sent) * 100 : 0,
    clickRate: campaign.stats.sent > 0 ? (campaign.stats.clicked / campaign.stats.sent) * 100 : 0
  }));

  // Engagement distribution data
  const engagementData = [
    { name: 'Opened', value: overallMetrics.totalOpened, color: '#22c55e' },
    { name: 'Clicked', value: overallMetrics.totalClicked, color: '#3b82f6' },
    { name: 'Not Opened', value: overallMetrics.totalSent - overallMetrics.totalOpened, color: '#6b7280' }
  ];

  const selectedCampaignData = campaigns.find(c => c.id === selectedCampaign);

  return (
    <div className="space-y-6">
      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallMetrics.totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across {overallMetrics.totalCampaigns} campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallMetrics.avgOpenRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {overallMetrics.totalOpened.toLocaleString()} total opens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallMetrics.avgClickRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {overallMetrics.totalClicked.toLocaleString()} total clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallMetrics.totalSent > 0 ?
                (((overallMetrics.totalOpened + overallMetrics.totalClicked) / overallMetrics.totalSent) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Overall engagement rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>Open and click rates by campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="openRate" fill="#22c55e" name="Open Rate %" />
                <Bar dataKey="clickRate" fill="#3b82f6" name="Click Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Distribution</CardTitle>
            <CardDescription>Breakdown of email engagement across all campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={engagementData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  >
                    {engagementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Details */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>Select a campaign to view detailed analytics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger>
                <SelectValue placeholder="Select a campaign" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCampaignData && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={selectedCampaignData.status === 'completed' ? 'default' : 'secondary'}>
                    {selectedCampaignData.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Sent:</span>
                    <span className="font-medium">{selectedCampaignData.stats.sent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Opened:</span>
                    <span className="font-medium">
                      {selectedCampaignData.stats.opened}
                      ({selectedCampaignData.stats.sent > 0 ?
                        ((selectedCampaignData.stats.opened / selectedCampaignData.stats.sent) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Clicked:</span>
                    <span className="font-medium">
                      {selectedCampaignData.stats.clicked}
                      ({selectedCampaignData.stats.sent > 0 ?
                        ((selectedCampaignData.stats.clicked / selectedCampaignData.stats.sent) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Failed:</span>
                    <span className="font-medium">{selectedCampaignData.stats.failed}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-xs text-muted-foreground">
                    Created: {new Date(selectedCampaignData.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tracking Data */}
      {trackingStats && (
        <Card>
          <CardHeader>
            <CardTitle>Open Tracking Details</CardTitle>
            <CardDescription>Individual contact engagement for selected campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{trackingStats.totalRecipients}</div>
                  <div className="text-sm text-muted-foreground">Recipients</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{trackingStats.uniqueOpens}</div>
                  <div className="text-sm text-muted-foreground">Unique Opens</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{trackingStats.totalOpens}</div>
                  <div className="text-sm text-muted-foreground">Total Opens</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{trackingStats.openRate.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Open Rate</div>
                </div>
              </div>

              {trackingStats.tracking.length > 0 && (
                <div className="max-h-64 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contact</TableHead>
                        <TableHead>Opens</TableHead>
                        <TableHead>First Opened</TableHead>
                        <TableHead>Last Opened</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trackingStats.tracking.slice(0, 10).map((track, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{track.contactEmail}</TableCell>
                          <TableCell>{track.openCount}</TableCell>
                          <TableCell>
                            {track.firstOpened ? new Date(track.firstOpened).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            {track.lastOpened ? new Date(track.lastOpened).toLocaleDateString() : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {trackingStats.tracking.length > 10 && (
                    <div className="text-center text-sm text-muted-foreground mt-2">
                      And {trackingStats.tracking.length - 10} more contacts...
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Click Tracking Data */}
      {clickStats && (
        <Card>
          <CardHeader>
            <CardTitle>Click Tracking Details</CardTitle>
            <CardDescription>Link click analytics for selected campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{clickStats.totalClicks}</div>
                  <div className="text-sm text-muted-foreground">Total Clicks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{clickStats.uniqueClicks}</div>
                  <div className="text-sm text-muted-foreground">Unique Clicks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{clickStats.clickedContacts}</div>
                  <div className="text-sm text-muted-foreground">Contacts Clicked</div>
                </div>
              </div>

              {Object.keys(clickStats.topLinks).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Top Clicked Links</h4>
                  <div className="space-y-2">
                    {Object.entries(clickStats.topLinks)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([url, clicks]) => (
                        <div key={url} className="flex justify-between items-center p-2 border rounded">
                          <span className="text-sm truncate max-w-xs">{url}</span>
                          <Badge variant="secondary">{clicks} clicks</Badge>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}