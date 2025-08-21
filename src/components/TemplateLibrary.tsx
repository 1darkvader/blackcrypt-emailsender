"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Search,
  Filter,
  Star,
  StarIcon,
  Mail,
  Folder,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmailTemplateEditor } from "@/components/EmailTemplateEditor";

interface TemplateLibraryItem {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  isStarred: boolean;
  template: {
    subject: string;
    htmlContent: string;
    textContent: string;
    variables: string[];
  };
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

interface TemplateLibraryProps {
  onTemplateSelect: (template: TemplateLibraryItem['template'] & { name: string }) => void;
}

export function TemplateLibrary({ onTemplateSelect }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<TemplateLibraryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateLibraryItem | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for creating/editing templates
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    tags: '',
    isStarred: false,
    template: {
      subject: '',
      htmlContent: '',
      textContent: '',
      variables: [] as string[]
    }
  });

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTemplates = async () => {
    try {
      // In a real app, this would fetch from an API
      // For now, we'll use localStorage
      const stored = localStorage.getItem('email-template-library');
      if (stored) {
        setTemplates(JSON.parse(stored));
      } else {
        // Initialize with some default templates
        const defaultTemplates = getDefaultTemplates();
        setTemplates(defaultTemplates);
        localStorage.setItem('email-template-library', JSON.stringify(defaultTemplates));
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const saveTemplates = (updatedTemplates: TemplateLibraryItem[]) => {
    setTemplates(updatedTemplates);
    localStorage.setItem('email-template-library', JSON.stringify(updatedTemplates));
  };

  const getDefaultTemplates = (): TemplateLibraryItem[] => [
    {
      id: '1',
      name: 'Welcome Email',
      description: 'A warm welcome email for new subscribers',
      category: 'Welcome',
      tags: ['welcome', 'onboarding', 'greeting'],
      isStarred: true,
      template: {
        subject: 'Welcome to {{company}}, {{name}}!',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to {{company}}!</h1>
        </div>
        <div class="content">
            <h2>Hi {{name}},</h2>
            <p>We're thrilled to have you join our community! Thank you for subscribing to our newsletter.</p>
            <p>Here's what you can expect from us:</p>
            <ul>
                <li>Weekly updates on industry trends</li>
                <li>Exclusive tips and insights</li>
                <li>Special offers just for subscribers</li>
            </ul>
            <a href="#" class="button">Get Started</a>
        </div>
        <div class="footer">
            <p>Thanks for joining us!</p>
            <p><a href="#">Unsubscribe</a> | <a href="#">Update Preferences</a></p>
        </div>
    </div>
</body>
</html>`,
        textContent: 'Welcome to {{company}}, {{name}}! We\'re thrilled to have you join our community.',
        variables: ['{{name}}', '{{company}}']
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 5
    },
    {
      id: '2',
      name: 'Product Launch',
      description: 'Announce new product launches to your audience',
      category: 'Marketing',
      tags: ['product', 'launch', 'announcement'],
      isStarred: false,
      template: {
        subject: 'Introducing Our Latest Product: {{productName}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Product Launch</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 40px 20px; border-radius: 8px; }
        .content { padding: 30px 20px; }
        .cta { text-align: center; margin: 30px 0; }
        .button { display: inline-block; padding: 15px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="hero">
            <h1>{{productName}} is Here!</h1>
            <p>The product you've been waiting for</p>
        </div>
        <div class="content">
            <h2>Hi {{name}},</h2>
            <p>We're excited to announce the launch of {{productName}} - our latest innovation designed to help you achieve more.</p>
            <div class="cta">
                <a href="#" class="button">Learn More</a>
            </div>
        </div>
    </div>
</body>
</html>`,
        textContent: 'Introducing {{productName}}! We\'re excited to announce our latest product.',
        variables: ['{{name}}', '{{productName}}']
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 3
    }
  ];

  const categories = [...new Set(templates.map(t => t.category))];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleCreateTemplate = () => {
    const newTemplate: TemplateLibraryItem = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      category: formData.category,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      isStarred: formData.isStarred,
      template: formData.template,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    };

    const updatedTemplates = [...templates, newTemplate];
    saveTemplates(updatedTemplates);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditTemplate = () => {
    if (!editingTemplate) return;

    const updatedTemplate: TemplateLibraryItem = {
      ...editingTemplate,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      isStarred: formData.isStarred,
      template: formData.template,
      updatedAt: new Date().toISOString()
    };

    const updatedTemplates = templates.map(t =>
      t.id === editingTemplate.id ? updatedTemplate : t
    );
    saveTemplates(updatedTemplates);
    setIsEditDialogOpen(false);
    setEditingTemplate(null);
    resetForm();
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      const updatedTemplates = templates.filter(t => t.id !== id);
      saveTemplates(updatedTemplates);
    }
  };

  const handleStarTemplate = (id: string) => {
    const updatedTemplates = templates.map(t =>
      t.id === id ? { ...t, isStarred: !t.isStarred } : t
    );
    saveTemplates(updatedTemplates);
  };

  const handleDuplicateTemplate = (template: TemplateLibraryItem) => {
    const duplicatedTemplate: TemplateLibraryItem = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    };

    const updatedTemplates = [...templates, duplicatedTemplate];
    saveTemplates(updatedTemplates);
  };

  const handleSelectTemplate = (template: TemplateLibraryItem) => {
    // Increment usage count
    const updatedTemplates = templates.map(t =>
      t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
    );
    saveTemplates(updatedTemplates);

    // Call the onTemplateSelect callback
    onTemplateSelect({
      name: template.name,
      ...template.template
    });
  };

  const openEditDialog = (template: TemplateLibraryItem) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      category: template.category,
      tags: template.tags.join(', '),
      isStarred: template.isStarred,
      template: template.template
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      tags: '',
      isStarred: false,
      template: {
        subject: '',
        htmlContent: '',
        textContent: '',
        variables: []
      }
    });
  };

  const handleTemplateUpdate = (updatedTemplate: { subject: string; htmlContent: string; textContent: string; variables: string[] }) => {
    setFormData(prev => ({
      ...prev,
      template: {
        subject: updatedTemplate.subject,
        htmlContent: updatedTemplate.htmlContent,
        textContent: updatedTemplate.textContent,
        variables: updatedTemplate.variables
      }
    }));
  };

  const handleTemplatePreview = (template: { subject: string; htmlContent: string; textContent: string; variables: string[] }) => {
    // Open preview in new window
    const previewWindow = window.open('', '_blank', 'width=600,height=800');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head><title>Template Preview</title></head>
          <body style="margin: 20px; font-family: Arial, sans-serif;">
            <h3>Subject: ${template.subject}</h3>
            <hr>
            ${template.htmlContent}
          </body>
        </html>
      `);
    }
  };

  if (showEditor) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setShowEditor(false)}
          className="mb-4"
        >
          <Folder className="mr-2 h-4 w-4" />
          Back to Template Library
        </Button>
        <EmailTemplateEditor
          template={{
            name: formData.name,
            ...formData.template
          }}
          onSave={handleTemplateUpdate}
          onPreview={handleTemplatePreview}
        />
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setShowEditor(false)}>
            Cancel
          </Button>
          <Button onClick={isEditDialogOpen ? handleEditTemplate : handleCreateTemplate}>
            {isEditDialogOpen ? 'Update Template' : 'Save Template'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Template Library</CardTitle>
              <CardDescription>
                Save, organize, and reuse your email templates
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>{filteredTemplates.length} templates</span>
            <span>•</span>
            <span>{templates.filter(t => t.isStarred).length} starred</span>
          </div>
        </CardContent>
      </Card>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold">{template.name}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStarTemplate(template.id)}
                    className="p-1 h-auto"
                  >
                    <Star className={`h-4 w-4 ${template.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                  </Button>
                </div>
                <Badge variant="outline">{template.category}</Badge>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{template.description}</p>

              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {template.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{template.tags.length - 3}
                  </Badge>
                )}
              </div>

              <div className="text-xs text-muted-foreground mb-4">
                <div>Used {template.usageCount} times</div>
                <div>Updated {new Date(template.updatedAt).toLocaleDateString()}</div>
              </div>

              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleSelectTemplate(template)}
                  className="flex-1"
                >
                  <Mail className="mr-1 h-3 w-3" />
                  Use
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleTemplatePreview(template.template)}>
                  <Eye className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEditDialog(template)}>
                  <Edit className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDuplicateTemplate(template)}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTemplates.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first email template to get started'
                }
              </p>
              {!searchQuery && selectedCategory === 'all' && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Template
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Enter template details, then design your email content
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Welcome Email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this template"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-category">Category</Label>
              <Input
                id="template-category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Welcome, Marketing, Newsletter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-tags">Tags (comma-separated)</Label>
              <Input
                id="template-tags"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="welcome, onboarding, greeting"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsAddDialogOpen(false);
                setShowEditor(true);
              }}
              disabled={!formData.name.trim()}
            >
              Design Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog - Similar to Create but with existing data */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update template details and design
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-template-name">Template Name</Label>
              <Input
                id="edit-template-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Welcome Email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-template-description">Description</Label>
              <Textarea
                id="edit-template-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this template"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-template-category">Category</Label>
              <Input
                id="edit-template-category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Welcome, Marketing, Newsletter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-template-tags">Tags (comma-separated)</Label>
              <Input
                id="edit-template-tags"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="welcome, onboarding, greeting"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsEditDialogOpen(false);
                setShowEditor(true);
              }}
              disabled={!formData.name.trim()}
            >
              Edit Design
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
