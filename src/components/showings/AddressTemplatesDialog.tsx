import { useState, useEffect } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Loader2, Trash2, Download, MapPin } from 'lucide-react';

interface TemplateAddress {
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  recipientName?: string;
  categoryTags?: string[];
}

interface AddressTemplate {
  id: string;
  list_name: string;
  addresses: TemplateAddress[];
  created_at: string;
}

interface AddressTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'save' | 'load';
  // Save mode props
  currentAddresses?: TemplateAddress[];
  sessionTitle?: string;
  // Load mode props
  onImport?: (addresses: TemplateAddress[]) => void;
}

const AddressTemplatesDialog = ({
  open,
  onOpenChange,
  mode,
  currentAddresses = [],
  sessionTitle = '',
  onImport,
}: AddressTemplatesDialogProps) => {
  const [templates, setTemplates] = useState<AddressTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [listName, setListName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<AddressTemplate | null>(null);

  useEffect(() => {
    if (open) {
      fetchTemplates();
      if (mode === 'save') {
        setListName(sessionTitle ? `${sessionTitle} Addresses` : '');
      }
    }
  }, [open, mode]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('address_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTemplates(
        (data || []).map((t: any) => ({
          ...t,
          addresses: Array.isArray(t.addresses) ? t.addresses : [],
        }))
      );
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load saved lists');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!listName.trim()) {
      toast.error('Please enter a list name');
      return;
    }
    if (currentAddresses.length === 0) {
      toast.error('No addresses to save');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in');
        return;
      }

      const { error } = await supabase.from('address_templates').insert({
        user_id: user.id,
        list_name: listName.trim(),
        addresses: currentAddresses,
      });

      if (error) throw error;

      toast.success(`Saved "${listName.trim()}" with ${currentAddresses.length} addresses`);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(error.message || 'Failed to save list');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('address_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
      }
      toast.success('List deleted');
    } catch (error) {
      toast.error('Failed to delete list');
    }
  };

  const handleImport = (template: AddressTemplate) => {
    if (onImport) {
      onImport(template.addresses);
      toast.success(`Importing ${template.addresses.length} addresses from "${template.list_name}"`);
      onOpenChange(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="font-display text-xl">
            {mode === 'save' ? 'Save as Template' : 'Saved Address Lists'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {mode === 'save'
              ? `Save ${currentAddresses.length} addresses as a reusable template`
              : 'Import addresses from a previously saved list'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        {mode === 'save' ? (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="list-name">List Name</Label>
              <Input
                id="list-name"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="e.g., Past Clients - North Valley"
                maxLength={100}
                autoFocus
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium">{currentAddresses.length} addresses</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {currentAddresses.slice(0, 5).map((addr, i) => (
                  <p key={i} className="text-xs text-muted-foreground truncate">
                    {addr.recipientName ? `${addr.recipientName} — ` : ''}{addr.address}
                  </p>
                ))}
                {currentAddresses.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    ...and {currentAddresses.length - 5} more
                  </p>
                )}
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Template
            </Button>
          </div>
        ) : (
          <div className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No saved lists yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Save addresses from a session to create reusable templates
                </p>
              </div>
            ) : selectedTemplate ? (
              // Template preview
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)}>
                    ← Back
                  </Button>
                  <Button size="sm" className="gap-1.5" onClick={() => handleImport(selectedTemplate)}>
                    <Download className="w-3.5 h-3.5" />
                    Import All
                  </Button>
                </div>
                <h3 className="font-semibold">{selectedTemplate.list_name}</h3>
                <div className="max-h-64 overflow-y-auto space-y-1.5">
                  {selectedTemplate.addresses.map((addr, i) => (
                    <div key={i} className="p-2 bg-muted/50 rounded-md text-sm">
                      {addr.recipientName && (
                        <p className="text-xs font-semibold text-primary">{addr.recipientName}</p>
                      )}
                      <p className="font-medium">{addr.address}</p>
                      {(addr.city || addr.state || addr.zipCode) && (
                        <p className="text-xs text-muted-foreground">
                          {[addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Template list
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{template.list_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {template.addresses.length} addresses
                        {' · '}
                        {new Date(template.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImport(template);
                        }}
                      >
                        <Download className="w-3 h-3" />
                        Import
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(template.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};

export default AddressTemplatesDialog;
