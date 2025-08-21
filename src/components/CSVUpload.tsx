"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, Check, X, Users } from "lucide-react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Contact {
  email: string;
  name?: string;
  [key: string]: string | undefined;
}

interface CSVUploadProps {
  onContactsUploaded: (contacts: Contact[]) => void;
}

export function CSVUpload({ onContactsUploaded }: CSVUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const processCSV = useCallback((file: File) => {
    setIsProcessing(true);
    setErrors([]);
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(), // Clean headers
      complete: (results) => {
        console.log('CSV parsing complete. Raw data:', results.data);

        const validContacts: Contact[] = [];
        const newErrors: string[] = [];

        if (!results.data || results.data.length === 0) {
          setErrors(['CSV file appears to be empty or invalid']);
          setIsProcessing(false);
          return;
        }

        (results.data as Record<string, string>[]).forEach((row, index) => {
          // More flexible email detection
          const emailKey = Object.keys(row).find(key => {
            const lowKey = key.toLowerCase().trim();
            return lowKey === 'email' ||
                   lowKey === 'email address' ||
                   lowKey === 'e-mail' ||
                   lowKey.includes('email') ||
                   lowKey === 'mail';
          });

          // If no email column found, try to find any field that looks like an email
          let email = '';
          if (emailKey && row[emailKey]) {
            email = row[emailKey].trim();
          } else {
            // Look for email-like values in any column
            const possibleEmail = Object.values(row).find(value =>
              value && typeof value === 'string' && validateEmail(value.trim())
            );
            if (possibleEmail) {
              email = possibleEmail.trim();
            }
          }

          if (!email) {
            newErrors.push(`Row ${index + 1}: No valid email address found. Columns: ${Object.keys(row).join(', ')}`);
            return;
          }

          if (!validateEmail(email)) {
            newErrors.push(`Row ${index + 1}: Invalid email format - "${email}"`);
            return;
          }

          // Check for name columns with more flexibility
          const nameKeys = Object.keys(row).filter(key => {
            const lowKey = key.toLowerCase().trim();
            return lowKey.includes('name') ||
                   lowKey.includes('first') ||
                   lowKey.includes('last') ||
                   lowKey === 'fname' ||
                   lowKey === 'lname';
          });

          let name = '';
          if (nameKeys.length > 0) {
            // Combine all name fields
            name = nameKeys
              .map(key => row[key]?.trim())
              .filter(Boolean)
              .join(' ');
          }

          // Create contact object with all available fields
          const contact: Contact = {
            email: email,
            name: name || undefined,
            ...(Object.fromEntries(
              Object.entries(row)
                .filter(([_, value]) => value && value.toString().trim())
                .map(([key, value]) => [key.trim(), value.toString().trim()])
            ) as Record<string, string>)
          };

          // Check for duplicate emails
          if (validContacts.some(c => c.email === email)) {
            newErrors.push(`Row ${index + 1}: Duplicate email address - "${email}"`);
            return;
          }

          validContacts.push(contact);
        });

        console.log('Processed contacts:', validContacts.length);
        console.log('Errors found:', newErrors.length);

        setContacts(validContacts);
        setErrors(newErrors);
        setIsProcessing(false);

        if (validContacts.length > 0) {
          onContactsUploaded(validContacts);
        } else if (newErrors.length > 0) {
          console.error('No valid contacts found:', newErrors);
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        setErrors([`Failed to parse CSV file: ${error.message}. Please ensure your file is a valid CSV format.`]);
        setIsProcessing(false);
      }
    });
  }, [onContactsUploaded]);

  const downloadSampleCSV = () => {
    const sampleData = `email,name,company,source
john.doe@example.com,John Doe,Acme Corp,Website
jane.smith@example.com,Jane Smith,Tech Inc,LinkedIn
bob.wilson@example.com,Bob Wilson,StartupXYZ,Conference`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-contacts.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));

    if (csvFile) {
      processCSV(csvFile);
    } else {
      setErrors(['Please upload a CSV file']);
    }
  }, [processCSV]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processCSV(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Contacts</CardTitle>
          <CardDescription>
            Upload a CSV file with your email contacts. Required column: email (case insensitive). Optional: name, company, source
          </CardDescription>
          <div className="flex space-x-2 mt-3">
            <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
              <FileText className="mr-1 h-3 w-3" />
              Download Sample CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className={`mx-auto h-12 w-12 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
            <h4 className="mt-4 text-lg font-medium">
              {isProcessing ? 'Processing CSV...' : 'Upload your CSV file'}
            </h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Drag and drop your file here, or click to browse
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
              id="csv-upload"
              disabled={isProcessing}
            />
            <Button
              className="mt-4"
              onClick={() => document.getElementById('csv-upload')?.click()}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Choose File'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <X className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Found {errors.length} error(s):</div>
              {errors.slice(0, 5).map((error, i) => (
                <div key={i} className="text-sm">{error}</div>
              ))}
              {errors.length > 5 && (
                <div className="text-sm">... and {errors.length - 5} more errors</div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Success */}
      {contacts.length > 0 && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>
            Successfully imported {contacts.length} contacts from {fileName}
          </AlertDescription>
        </Alert>
      )}

      {/* Preview */}
      {contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Contact Preview</span>
              <Badge variant="secondary">{contacts.length} contacts</Badge>
            </CardTitle>
            <CardDescription>
              Preview of your uploaded contacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border max-h-64 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.slice(0, 10).map((contact, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm">{contact.email}</TableCell>
                      <TableCell>{contact.name || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {contacts.length > 10 && (
                <div className="p-3 text-center text-sm text-muted-foreground border-t">
                  And {contacts.length - 10} more contacts...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
