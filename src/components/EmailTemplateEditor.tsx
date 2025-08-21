"use client";

import { useState } from "react";
import { Eye, Save, Type, Image, Link, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmailTemplate {
  id?: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
}

interface EmailTemplateEditorProps {
  template?: EmailTemplate;
  onSave: (template: EmailTemplate) => void;
  onPreview: (template: EmailTemplate) => void;
}

export function EmailTemplateEditor({ template, onSave, onPreview }: EmailTemplateEditorProps) {
  const [name, setName] = useState(template?.name || "");
  const [subject, setSubject] = useState(template?.subject || "");
  const [htmlContent, setHtmlContent] = useState(template?.htmlContent || "");
  const [textContent, setTextContent] = useState(template?.textContent || "");
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const availableVariables = [
    "{{name}}",
    "{{email}}",
    "{{company}}",
    "{{firstName}}",
    "{{lastName}}"
  ];

  const detectVariables = (content: string): string[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const matches = content.match(variableRegex) || [];
    return [...new Set(matches)];
  };

  const insertVariable = (variable: string) => {
    setHtmlContent(prev => prev + variable);
    setTextContent(prev => prev + variable);
  };

  const handleSave = () => {
    const emailTemplate: EmailTemplate = {
      id: template?.id,
      name,
      subject,
      htmlContent,
      textContent,
      variables: detectVariables(htmlContent + subject)
    };
    onSave(emailTemplate);
  };

  const handlePreview = () => {
    const emailTemplate: EmailTemplate = {
      id: template?.id,
      name,
      subject,
      htmlContent,
      textContent,
      variables: detectVariables(htmlContent + subject)
    };
    onPreview(emailTemplate);
  };

  const generateTextFromHtml = () => {
    // Simple HTML to text conversion
    const text = htmlContent
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
    setTextContent(text);
  };

  const defaultTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Hello {{name}}!</h1>
        </div>
        <div class="content">
            <p>This is your email content. You can customize this template with HTML and use variables like {{name}} and {{email}}.</p>

            <p>Add your message here...</p>

            <p style="text-align: center;">
                <a href="#" class="button">Call to Action</a>
            </p>
        </div>
        <div class="footer">
            <p>You're receiving this email because you subscribed to our newsletter.</p>
            <p><a href="#">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>`.trim();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Template Editor</CardTitle>
          <CardDescription>
            Create and customize your email template with variables and HTML
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Newsletter Template"
            />
          </div>

          {/* Subject Line */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Welcome to our newsletter, {{name}}!"
            />
          </div>

          {/* Variables */}
          <div className="space-y-2">
            <Label>Available Variables</Label>
            <div className="flex flex-wrap gap-2">
              {availableVariables.map((variable) => (
                <Badge
                  key={variable}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => insertVariable(variable)}
                >
                  {variable}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Click on a variable to insert it into your template
            </p>
          </div>

          <Separator />

          {/* Template Actions */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                variant={!isPreviewMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsPreviewMode(false)}
              >
                <Type className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant={isPreviewMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsPreviewMode(true)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={generateTextFromHtml}>
                Generate Text Version
              </Button>
              <Button variant="outline" onClick={() => setHtmlContent(defaultTemplate)}>
                Load Default Template
              </Button>
            </div>
          </div>

          {!isPreviewMode ? (
            /* Editor Mode */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="html-content">HTML Content</Label>
                <Textarea
                  id="html-content"
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder="Enter your HTML email content here..."
                  className="min-h-64 font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="text-content">Plain Text Version (Fallback)</Label>
                <Textarea
                  id="text-content"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Plain text version of your email..."
                  className="min-h-32"
                />
              </div>
            </div>
          ) : (
            /* Preview Mode */
            <div className="space-y-4">
              <Alert>
                <User className="h-4 w-4" />
                <AlertDescription>
                  Preview with sample data: Variables like {`{{name}}`} will be replaced with "John Doe"
                </AlertDescription>
              </Alert>

              <div className="border rounded-lg p-4 bg-white">
                <div className="border-b pb-2 mb-4">
                  <div className="text-sm text-muted-foreground">Subject:</div>
                  <div className="font-medium">
                    {subject.replace(/\{\{name\}\}/g, "John Doe").replace(/\{\{email\}\}/g, "john@example.com")}
                  </div>
                </div>
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: htmlContent
                      .replace(/\{\{name\}\}/g, "John Doe")
                      .replace(/\{\{email\}\}/g, "john@example.com")
                      .replace(/\{\{company\}\}/g, "Acme Corp")
                      .replace(/\{\{firstName\}\}/g, "John")
                      .replace(/\{\{lastName\}\}/g, "Doe")
                  }}
                />
              </div>
            </div>
          )}

          {/* Variables Used */}
          {htmlContent && (
            <div className="space-y-2">
              <Label>Variables Used in Template</Label>
              <div className="flex flex-wrap gap-2">
                {detectVariables(htmlContent + subject).map((variable) => (
                  <Badge key={variable} variant="secondary">
                    {variable}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="mr-2 h-4 w-4" />
              Preview Email
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
