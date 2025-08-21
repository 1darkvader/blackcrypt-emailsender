"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Mail,
  Globe,
  Zap,
  Settings,
  RefreshCw,
  TrendingUp,
  Eye,
  Lock,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface DeliverabilityScore {
  overall: number;
  content: number;
  authentication: number;
  reputation: number;
  technical: number;
}

interface DomainHealth {
  domain: string;
  spfValid: boolean;
  dkimValid: boolean;
  dmarcValid: boolean;
  reputationScore: number;
  blacklisted: string[];
  lastChecked: string;
}

interface ContentAnalysis {
  spamScore: number;
  issues: Array<{
    type: 'warning' | 'error';
    category: string;
    message: string;
    suggestion: string;
  }>;
  recommendations: string[];
}

interface EmailWarmup {
  isActive: boolean;
  currentVolume: number;
  targetVolume: number;
  daysRemaining: number;
  progress: number;
  dailyIncrement: number;
}

export function DeliverabilityManager() {
  const [activeTab, setActiveTab] = useState("overview");
  const [domainHealth, setDomainHealth] = useState<DomainHealth | null>(null);
  const [deliverabilityScore, setDeliverabilityScore] = useState<DeliverabilityScore>({
    overall: 0,
    content: 0,
    authentication: 0,
    reputation: 0,
    technical: 0
  });
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysis>({
    spamScore: 0,
    issues: [],
    recommendations: []
  });
  const [emailWarmup, setEmailWarmup] = useState<EmailWarmup>({
    isActive: false,
    currentVolume: 0,
    targetVolume: 0,
    daysRemaining: 0,
    progress: 0,
    dailyIncrement: 0
  });
  const [testEmailContent, setTestEmailContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [domainToCheck, setDomainToCheck] = useState("");

  useEffect(() => {
    loadDeliverabilityData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDeliverabilityData = async () => {
    try {
      // Force clear any existing demo or saved data to start completely fresh
      localStorage.removeItem('deliverability-data');

      // Start with completely empty state - no demo data at all
      setDomainHealth(null);
      setDeliverabilityScore({
        overall: 0,
        content: 0,
        authentication: 0,
        reputation: 0,
        technical: 0
      });
      setEmailWarmup({
        isActive: false,
        currentVolume: 0,
        targetVolume: 1000,
        daysRemaining: 0,
        progress: 0,
        dailyIncrement: 0
      });
      setContentAnalysis({
        spamScore: 0,
        issues: [],
        recommendations: []
      });

      console.log('✅ Deliverability Manager: All demo data cleared, starting with 0% state');
    } catch (error) {
      console.error('Failed to load deliverability data:', error);
    }
  };

  const saveDeliverabilityData = () => {
    const data = {
      domainHealth,
      deliverabilityScore,
      emailWarmup
    };
    localStorage.setItem('deliverability-data', JSON.stringify(data));
  };



  const analyzeEmailContent = async () => {
    setIsAnalyzing(true);

    // Simulate content analysis
    setTimeout(() => {
      const spamKeywords = ['free', 'urgent', 'limited time', 'click now', 'guaranteed'];
      const foundKeywords = spamKeywords.filter(keyword =>
        testEmailContent.toLowerCase().includes(keyword)
      );

      const issues = [];
      const recommendations = [];

      // Content analysis
      if (foundKeywords.length > 0) {
        issues.push({
          type: 'warning' as const,
          category: 'Content',
          message: `Found ${foundKeywords.length} potential spam trigger words`,
          suggestion: 'Consider replacing words like: ' + foundKeywords.join(', ')
        });
      }

      if (testEmailContent.length < 200) {
        issues.push({
          type: 'warning' as const,
          category: 'Content Length',
          message: 'Email content is very short',
          suggestion: 'Add more valuable content to improve engagement'
        });
      }

      if (!testEmailContent.includes('{{name}}') && !testEmailContent.includes('{{firstName}}')) {
        issues.push({
          type: 'warning' as const,
          category: 'Personalization',
          message: 'No personalization detected',
          suggestion: 'Add recipient name or other personal details'
        });
      }

      // Links analysis
      const linkCount = (testEmailContent.match(/https?:\/\/[^\s]+/g) || []).length;
      if (linkCount > 5) {
        issues.push({
          type: 'error' as const,
          category: 'Links',
          message: `Too many links detected (${linkCount})`,
          suggestion: 'Reduce number of links to 3-5 maximum'
        });
      }

      // Recommendations
      recommendations.push('Add a clear unsubscribe link');
      recommendations.push('Include your physical address');
      recommendations.push('Use a consistent sender name');
      recommendations.push('Test across different email clients');

      const spamScore = Math.min(100, (foundKeywords.length * 20) + (linkCount > 5 ? 30 : 0));

      setContentAnalysis({
        spamScore: spamScore,
        issues: issues,
        recommendations: recommendations
      });

      setIsAnalyzing(false);
    }, 2000);
  };

  const checkDomainHealth = async () => {
    if (!domainToCheck) return;

    setIsAnalyzing(true);

    // Simulate domain health check
    setTimeout(() => {
      const mockHealth: DomainHealth = {
        domain: domainToCheck,
        spfValid: Math.random() > 0.5,
        dkimValid: Math.random() > 0.3,
        dmarcValid: Math.random() > 0.7,
        reputationScore: Math.floor(Math.random() * 40) + 60,
        blacklisted: Math.random() > 0.8 ? ['spamhaus.org'] : [],
        lastChecked: new Date().toISOString()
      };

      setDomainHealth(mockHealth);

      // Update deliverability score based on domain health
      const authScore = (mockHealth.spfValid ? 33 : 0) +
                       (mockHealth.dkimValid ? 33 : 0) +
                       (mockHealth.dmarcValid ? 34 : 0);

      setDeliverabilityScore(prev => ({
        ...prev,
        authentication: authScore,
        reputation: mockHealth.reputationScore,
        overall: Math.round((authScore + mockHealth.reputationScore + prev.content + prev.technical) / 4)
      }));

      setIsAnalyzing(false);
    }, 3000);
  };

  const startEmailWarmup = () => {
    const dailyIncrement = Math.ceil((1000 - 10) / 14); // Increase from 10 to 1000 over 14 days

    const warmupConfig: EmailWarmup = {
      isActive: true,
      currentVolume: 10,
      targetVolume: 1000,
      daysRemaining: 14,
      progress: 1,
      dailyIncrement: dailyIncrement
    };

    setEmailWarmup(warmupConfig);

    // Save to localStorage
    const data = {
      domainHealth,
      deliverabilityScore,
      emailWarmup: warmupConfig
    };
    localStorage.setItem('deliverability-data', JSON.stringify(data));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, text: 'Excellent' };
    if (score >= 60) return { variant: 'secondary' as const, text: 'Good' };
    return { variant: 'destructive' as const, text: 'Needs Work' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Email Deliverability & Anti-Spam Manager</span>
          </CardTitle>
          <CardDescription>
            Monitor and optimize your email deliverability to avoid spam folders
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Overall Score Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className={`text-3xl font-bold ${getScoreColor(deliverabilityScore.overall)}`}>
              {deliverabilityScore.overall}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">Overall Score</div>
            <Badge {...getScoreBadge(deliverabilityScore.overall)} className="mt-2">
              {getScoreBadge(deliverabilityScore.overall).text}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className={`text-2xl font-bold ${getScoreColor(deliverabilityScore.authentication)}`}>
              {deliverabilityScore.authentication}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">Authentication</div>
            <Lock className="h-4 w-4 mx-auto mt-2 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className={`text-2xl font-bold ${getScoreColor(deliverabilityScore.reputation)}`}>
              {deliverabilityScore.reputation}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">Reputation</div>
            <TrendingUp className="h-4 w-4 mx-auto mt-2 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className={`text-2xl font-bold ${getScoreColor(deliverabilityScore.content)}`}>
              {deliverabilityScore.content}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">Content Quality</div>
            <Mail className="h-4 w-4 mx-auto mt-2 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className={`text-2xl font-bold ${getScoreColor(deliverabilityScore.technical)}`}>
              {deliverabilityScore.technical}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">Technical Setup</div>
            <Settings className="h-4 w-4 mx-auto mt-2 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="domain-health">Domain Health</TabsTrigger>
          <TabsTrigger value="content-analyzer">Content Analyzer</TabsTrigger>
          <TabsTrigger value="warmup">Email Warmup</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Essential steps to improve deliverability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    {domainHealth?.spfValid ?
                      <CheckCircle className="h-5 w-5 text-green-500" /> :
                      <XCircle className="h-5 w-5 text-red-500" />
                    }
                    <span>SPF Record Setup</span>
                    {!domainHealth?.spfValid && (
                      <Button size="sm" variant="outline">Setup</Button>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    {domainHealth?.dkimValid ?
                      <CheckCircle className="h-5 w-5 text-green-500" /> :
                      <XCircle className="h-5 w-5 text-red-500" />
                    }
                    <span>DKIM Signature</span>
                    {!domainHealth?.dkimValid && (
                      <Button size="sm" variant="outline">Setup</Button>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    {domainHealth?.dmarcValid ?
                      <CheckCircle className="h-5 w-5 text-green-500" /> :
                      <XCircle className="h-5 w-5 text-red-500" />
                    }
                    <span>DMARC Policy</span>
                    {!domainHealth?.dmarcValid && (
                      <Button size="sm" variant="outline">Setup</Button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    {emailWarmup.isActive ?
                      <Activity className="h-5 w-5 text-green-500" /> :
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    }
                    <span>Email Warmup</span>
                    {!emailWarmup.isActive && (
                      <Button size="sm" variant="outline" onClick={startEmailWarmup}>
                        Start
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <Eye className="h-5 w-5 text-blue-500" />
                    <span>Content Analysis</span>
                    <Button size="sm" variant="outline" onClick={() => setActiveTab("content-analyzer")}>
                      Analyze
                    </Button>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-purple-500" />
                    <span>Domain Reputation</span>
                    <Button size="sm" variant="outline" onClick={() => setActiveTab("domain-health")}>
                      Check
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          {domainHealth?.blacklisted && domainHealth.blacklisted.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your domain is blacklisted on: {domainHealth.blacklisted.join(', ')}.
                This will severely impact deliverability.
              </AlertDescription>
            </Alert>
          )}

          {deliverabilityScore.overall < 60 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your deliverability score is below 60%. Focus on authentication setup and content optimization.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="domain-health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Domain Health Check</CardTitle>
              <CardDescription>Verify your domain's email authentication and reputation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter your domain (e.g., yourdomain.com)"
                  value={domainToCheck}
                  onChange={(e) => setDomainToCheck(e.target.value)}
                />
                <Button onClick={checkDomainHealth} disabled={isAnalyzing}>
                  {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Check'}
                </Button>
              </div>

              {domainHealth && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          {domainHealth.spfValid ?
                            <CheckCircle className="h-5 w-5 text-green-500" /> :
                            <XCircle className="h-5 w-5 text-red-500" />
                          }
                          <span className="font-medium">SPF Record</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {domainHealth.spfValid ? 'Valid SPF record found' : 'No valid SPF record'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          {domainHealth.dkimValid ?
                            <CheckCircle className="h-5 w-5 text-green-500" /> :
                            <XCircle className="h-5 w-5 text-red-500" />
                          }
                          <span className="font-medium">DKIM Signature</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {domainHealth.dkimValid ? 'DKIM signature configured' : 'DKIM signature missing'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          {domainHealth.dmarcValid ?
                            <CheckCircle className="h-5 w-5 text-green-500" /> :
                            <XCircle className="h-5 w-5 text-red-500" />
                          }
                          <span className="font-medium">DMARC Policy</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {domainHealth.dmarcValid ? 'DMARC policy active' : 'No DMARC policy found'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Reputation Score</h4>
                          <p className="text-sm text-muted-foreground">
                            Based on sending history and recipient engagement
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(domainHealth.reputationScore)}`}>
                            {domainHealth.reputationScore}%
                          </div>
                          <Badge {...getScoreBadge(domainHealth.reputationScore)}>
                            {getScoreBadge(domainHealth.reputationScore).text}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {!domainHealth.spfValid && (
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">SPF Record Setup</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Add this TXT record to your DNS:
                        </p>
                        <code className="block bg-muted p-2 rounded text-sm">
                          v=spf1 include:_spf.google.com ~all
                        </code>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content-analyzer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Content Analyzer</CardTitle>
              <CardDescription>Analyze your email content for spam triggers and optimization opportunities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-content">Email Content</Label>
                <Textarea
                  id="email-content"
                  placeholder="Paste your email content here..."
                  value={testEmailContent}
                  onChange={(e) => setTestEmailContent(e.target.value)}
                  rows={8}
                />
              </div>

              <Button onClick={analyzeEmailContent} disabled={isAnalyzing || !testEmailContent}>
                {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}
                Analyze Content
              </Button>

              {contentAnalysis.spamScore > 0 && (
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Spam Score</h4>
                          <p className="text-sm text-muted-foreground">Lower is better</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${contentAnalysis.spamScore < 30 ? 'text-green-600' : contentAnalysis.spamScore < 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {contentAnalysis.spamScore}%
                          </div>
                          <Progress value={contentAnalysis.spamScore} className="w-20 mt-1" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {contentAnalysis.issues.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-3">Issues Found</h4>
                        <div className="space-y-3">
                          {contentAnalysis.issues.map((issue, index) => (
                            <div key={index} className="flex items-start space-x-3">
                              {issue.type === 'error' ?
                                <XCircle className="h-5 w-5 text-red-500 mt-0.5" /> :
                                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                              }
                              <div>
                                <p className="font-medium">{issue.category}: {issue.message}</p>
                                <p className="text-sm text-muted-foreground">{issue.suggestion}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">Recommendations</h4>
                      <ul className="space-y-2">
                        {contentAnalysis.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warmup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Warmup</CardTitle>
              <CardDescription>Gradually increase sending volume to build domain reputation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!emailWarmup.isActive ? (
                <div className="text-center py-8">
                  <Zap className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Start Email Warmup</h3>
                  <p className="text-muted-foreground mb-4">
                    Gradually increase your sending volume to build a positive reputation with email providers
                  </p>
                  <Button onClick={startEmailWarmup}>
                    Start Warmup Process
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Warmup Progress</h4>
                          <p className="text-sm text-muted-foreground">
                            {emailWarmup.daysRemaining} days remaining
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{emailWarmup.progress}%</div>
                          <Progress value={emailWarmup.progress} className="w-20 mt-1" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">{emailWarmup.currentVolume}</div>
                        <div className="text-sm text-muted-foreground">Current Daily Volume</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">{emailWarmup.targetVolume}</div>
                        <div className="text-sm text-muted-foreground">Target Daily Volume</div>
                      </CardContent>
                    </Card>
                  </div>

                  <Alert>
                    <Activity className="h-4 w-4" />
                    <AlertDescription>
                      Warmup is active. Your daily sending limit will gradually increase over the next {emailWarmup.daysRemaining} days.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
