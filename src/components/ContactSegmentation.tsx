"use client";

import { useState, useEffect } from "react";
import {
  Filter,
  Plus,
  Edit,
  Trash2,
  Users,
  Target,
  Search,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

interface Contact {
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  tags?: string[];
  source?: string;
  dateAdded?: string;
  lastEngaged?: string;
  [key: string]: string | string[] | undefined;
}

interface SegmentRule {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'not_equals' | 'not_contains' | 'starts_with' | 'ends_with' | 'exists' | 'not_exists';
  value: string;
}

interface Segment {
  id: string;
  name: string;
  description: string;
  rules: SegmentRule[];
  operator: 'and' | 'or';
  contactCount: number;
  contacts: Contact[];
  createdAt: string;
  updatedAt: string;
}

interface ContactSegmentationProps {
  allContacts: Contact[];
  onSegmentSelect: (segment: Segment) => void;
}

export function ContactSegmentation({ allContacts, onSegmentSelect }: ContactSegmentationProps) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);

  // Form state for creating/editing segments
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    operator: 'and' as 'and' | 'or',
    rules: [] as SegmentRule[]
  });

  useEffect(() => {
    fetchSegments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Recalculate contact counts when contacts or segments change
    updateSegmentCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allContacts, segments.length]);

  const fetchSegments = async () => {
    try {
      // In a real app, this would fetch from an API
      const stored = localStorage.getItem('email-contact-segments');
      if (stored) {
        setSegments(JSON.parse(stored));
      } else {
        // Initialize with some default segments
        const defaultSegments = getDefaultSegments();
        setSegments(defaultSegments);
        localStorage.setItem('email-contact-segments', JSON.stringify(defaultSegments));
      }
    } catch (error) {
      console.error('Failed to fetch segments:', error);
    }
  };

  const getDefaultSegments = (): Segment[] => [
    // Start with empty segments - no demo data
  ];

  const saveSegments = (updatedSegments: Segment[]) => {
    setSegments(updatedSegments);
    localStorage.setItem('email-contact-segments', JSON.stringify(updatedSegments));
  };

  const updateSegmentCounts = () => {
    const updatedSegments = segments.map(segment => {
      const matchingContacts = filterContactsBySegment(allContacts, segment);
      return {
        ...segment,
        contactCount: matchingContacts.length,
        contacts: matchingContacts
      };
    });

    if (updatedSegments.length > 0) {
      setSegments(updatedSegments);
    }
  };

  const filterContactsBySegment = (contacts: Contact[], segment: Segment): Contact[] => {
    return contacts.filter(contact => {
      if (segment.operator === 'and') {
        return segment.rules.every(rule => matchesRule(contact, rule));
      } else {
        return segment.rules.some(rule => matchesRule(contact, rule));
      }
    });
  };

  const matchesRule = (contact: Contact, rule: SegmentRule): boolean => {
    const fieldValue = contact[rule.field];
    const ruleValue = rule.value.toLowerCase();

    if (!fieldValue && rule.operator === 'exists') return false;
    if (!fieldValue && rule.operator === 'not_exists') return true;
    if (!fieldValue) return false;

    const contactValue = Array.isArray(fieldValue)
      ? fieldValue.join(' ').toLowerCase()
      : fieldValue.toString().toLowerCase();

    switch (rule.operator) {
      case 'equals':
        return contactValue === ruleValue;
      case 'not_equals':
        return contactValue !== ruleValue;
      case 'contains':
        return contactValue.includes(ruleValue);
      case 'not_contains':
        return !contactValue.includes(ruleValue);
      case 'starts_with':
        return contactValue.startsWith(ruleValue);
      case 'ends_with':
        return contactValue.endsWith(ruleValue);
      case 'exists':
        return true;
      case 'not_exists':
        return false;
      default:
        return false;
    }
  };

  const addRule = () => {
    const newRule: SegmentRule = {
      id: Date.now().toString(),
      field: 'email',
      operator: 'contains',
      value: ''
    };
    setFormData(prev => ({
      ...prev,
      rules: [...prev.rules, newRule]
    }));
  };

  const updateRule = (ruleId: string, updates: Partial<SegmentRule>) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    }));
  };

  const removeRule = (ruleId: string) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter(rule => rule.id !== ruleId)
    }));
  };

  const handleCreateSegment = () => {
    const matchingContacts = filterContactsBySegment(allContacts, {
      ...formData,
      id: '',
      contactCount: 0,
      contacts: [],
      createdAt: '',
      updatedAt: ''
    });

    const newSegment: Segment = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      rules: formData.rules,
      operator: formData.operator,
      contactCount: matchingContacts.length,
      contacts: matchingContacts,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedSegments = [...segments, newSegment];
    saveSegments(updatedSegments);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEditSegment = () => {
    if (!editingSegment) return;

    const matchingContacts = filterContactsBySegment(allContacts, {
      ...formData,
      id: editingSegment.id,
      contactCount: 0,
      contacts: [],
      createdAt: editingSegment.createdAt,
      updatedAt: ''
    });

    const updatedSegment: Segment = {
      ...editingSegment,
      name: formData.name,
      description: formData.description,
      rules: formData.rules,
      operator: formData.operator,
      contactCount: matchingContacts.length,
      contacts: matchingContacts,
      updatedAt: new Date().toISOString()
    };

    const updatedSegments = segments.map(s =>
      s.id === editingSegment.id ? updatedSegment : s
    );
    saveSegments(updatedSegments);
    setIsEditDialogOpen(false);
    setEditingSegment(null);
    resetForm();
  };

  const handleDeleteSegment = (id: string) => {
    if (confirm('Are you sure you want to delete this segment?')) {
      const updatedSegments = segments.filter(s => s.id !== id);
      saveSegments(updatedSegments);
    }
  };

  const openEditDialog = (segment: Segment) => {
    setEditingSegment(segment);
    setFormData({
      name: segment.name,
      description: segment.description,
      operator: segment.operator,
      rules: [...segment.rules]
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      operator: 'and',
      rules: []
    });
  };

  const filteredSegments = segments.filter(segment =>
    segment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    segment.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableFields = ['email', 'name', 'firstName', 'lastName', 'company', 'source', 'tags'];
  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does Not Contain' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' },
    { value: 'exists', label: 'Has Value' },
    { value: 'not_exists', label: 'Is Empty' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Contact Segmentation</CardTitle>
              <CardDescription>
                Create targeted segments based on contact properties
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Segment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search segments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSegments.map((segment) => (
          <Card key={segment.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">{segment.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{segment.description}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onSegmentSelect(segment)}>
                      Use in Campaign
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedSegment(segment)}>
                      View Contacts
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditDialog(segment)}>
                      Edit Segment
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteSegment(segment.id)}
                      className="text-red-600"
                    >
                      Delete Segment
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Contacts</span>
                  <Badge variant="secondary">{segment.contactCount}</Badge>
                </div>

                <div className="text-xs text-muted-foreground">
                  <div>Rules: {segment.rules.length}</div>
                  <div>Operator: {segment.operator.toUpperCase()}</div>
                  <div>Updated: {new Date(segment.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="flex space-x-2 mt-4">
                <Button
                  size="sm"
                  onClick={() => onSegmentSelect(segment)}
                  className="flex-1"
                >
                  <Target className="mr-1 h-3 w-3" />
                  Use
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedSegment(segment)}>
                  <Users className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredSegments.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <Filter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No segments found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Create your first contact segment to get started'
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Segment
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Segment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Segment</DialogTitle>
            <DialogDescription>
              Define rules to automatically group contacts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="segment-name">Segment Name</Label>
                <Input
                  id="segment-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., High-Value Customers"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="segment-operator">Rule Operator</Label>
                <Select
                  value={formData.operator}
                  onValueChange={(value: 'and' | 'or') => setFormData(prev => ({ ...prev, operator: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="and">AND (all rules must match)</SelectItem>
                    <SelectItem value="or">OR (any rule must match)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="segment-description">Description</Label>
              <Input
                id="segment-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this segment"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Segment Rules</Label>
                <Button type="button" variant="outline" size="sm" onClick={addRule}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Rule
                </Button>
              </div>

              {formData.rules.map((rule) => (
                <div key={rule.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3">
                    <Select
                      value={rule.field}
                      onValueChange={(value) => updateRule(rule.id, { field: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields.map(field => (
                          <SelectItem key={field} value={field}>{field}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-3">
                    <Select
                      value={rule.operator}
                      onValueChange={(value: SegmentRule['operator']) => updateRule(rule.id, { operator: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map(op => (
                          <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-5">
                    {!['exists', 'not_exists'].includes(rule.operator) && (
                      <Input
                        value={rule.value}
                        onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                        placeholder="Value"
                      />
                    )}
                  </div>

                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRule(rule.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {formData.rules.length === 0 && (
                <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded">
                  <p className="text-sm text-muted-foreground">No rules defined yet</p>
                  <Button type="button" variant="ghost" size="sm" onClick={addRule} className="mt-2">
                    <Plus className="mr-1 h-3 w-3" />
                    Add First Rule
                  </Button>
                </div>
              )}
            </div>

            {formData.rules.length > 0 && (
              <div className="p-3 bg-muted rounded">
                <div className="text-sm">
                  <strong>Preview:</strong> This segment will include contacts where{' '}
                  <strong>{formData.operator === 'and' ? 'ALL' : 'ANY'}</strong> of the rules match.
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Estimated contacts: {filterContactsBySegment(allContacts, {
                    ...formData,
                    id: '',
                    contactCount: 0,
                    contacts: [],
                    createdAt: '',
                    updatedAt: ''
                  }).length}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSegment}
              disabled={!formData.name.trim() || formData.rules.length === 0}
            >
              Create Segment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Segment Dialog - Similar to Create */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Segment</DialogTitle>
            <DialogDescription>
              Update segment rules and properties
            </DialogDescription>
          </DialogHeader>

          {/* Same content as create dialog */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-segment-name">Segment Name</Label>
                <Input
                  id="edit-segment-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., High-Value Customers"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-segment-operator">Rule Operator</Label>
                <Select
                  value={formData.operator}
                  onValueChange={(value: 'and' | 'or') => setFormData(prev => ({ ...prev, operator: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="and">AND (all rules must match)</SelectItem>
                    <SelectItem value="or">OR (any rule must match)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-segment-description">Description</Label>
              <Input
                id="edit-segment-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this segment"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Segment Rules</Label>
                <Button type="button" variant="outline" size="sm" onClick={addRule}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Rule
                </Button>
              </div>

              {formData.rules.map((rule) => (
                <div key={rule.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3">
                    <Select
                      value={rule.field}
                      onValueChange={(value) => updateRule(rule.id, { field: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields.map(field => (
                          <SelectItem key={field} value={field}>{field}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-3">
                    <Select
                      value={rule.operator}
                      onValueChange={(value: SegmentRule['operator']) => updateRule(rule.id, { operator: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map(op => (
                          <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-5">
                    {!['exists', 'not_exists'].includes(rule.operator) && (
                      <Input
                        value={rule.value}
                        onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                        placeholder="Value"
                      />
                    )}
                  </div>

                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRule(rule.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSegment}
              disabled={!formData.name.trim() || formData.rules.length === 0}
            >
              Update Segment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Segment Contacts View Dialog */}
      <Dialog open={!!selectedSegment} onOpenChange={() => setSelectedSegment(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedSegment?.name} Contacts</DialogTitle>
            <DialogDescription>
              {selectedSegment?.contactCount} contacts in this segment
            </DialogDescription>
          </DialogHeader>

          {selectedSegment && (
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSegment.contacts.slice(0, 100).map((contact, index) => (
                    <TableRow key={index}>
                      <TableCell>{contact.email}</TableCell>
                      <TableCell>{contact.name || '-'}</TableCell>
                      <TableCell>{contact.company || '-'}</TableCell>
                      <TableCell>{contact.source || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {selectedSegment.contacts.length > 100 && (
                <div className="text-center text-sm text-muted-foreground mt-2">
                  Showing first 100 contacts. Total: {selectedSegment.contacts.length}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
