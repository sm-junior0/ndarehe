import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Save, RefreshCw, Settings, Globe, CreditCard, Bell, Database } from "lucide-react";

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const SettingsPanel: React.FC = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    backendUrl: '',
    frontendUrl: '',
    emailFrom: '',
    language: 'en',
    timezone: 'Africa/Kigali',
    maintenanceMode: false,
    smsProviderEnabled: false,
    emailProviderEnabled: true,
    stripePublicKey: '',
    stripeSecretKey: '',
    twilioSid: '',
    twilioAuth: '',
    twilioFrom: '',
    siteName: '',
    siteDescription: '',
    contactEmail: '',
    contactPhone: ''
  });

  useEffect(() => {
    if (token) {
      fetchSettings();
    }
  }, [token]);

  const fetchSettings = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await adminApi.getSettings(token);
      if (response.data.success) {
        const fetchedSettings = response.data.data.settings;
        setSettings(fetchedSettings);
        
        // Map settings to form data
        const mappedData: any = {};
        fetchedSettings.forEach((setting: SystemSetting) => {
          mappedData[setting.key] = setting.value;
        });
        
        setFormData(prev => ({
          ...prev,
          ...mappedData
        }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch system settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!token) return;
    
    setSaving(true);
    try {
      // Prepare settings array for bulk update
      const settingsToUpdate = [
        { key: 'backend_url', value: formData.backendUrl, description: 'Backend API URL' },
        { key: 'frontend_url', value: formData.frontendUrl, description: 'Frontend URL' },
        { key: 'email_from', value: formData.emailFrom, description: 'Default sender email' },
        { key: 'language', value: formData.language, description: 'Default language' },
        { key: 'timezone', value: formData.timezone, description: 'Default timezone' },
        { key: 'maintenance_mode', value: formData.maintenanceMode.toString(), description: 'Maintenance mode status' },
        { key: 'sms_provider_enabled', value: formData.smsProviderEnabled.toString(), description: 'SMS provider status' },
        { key: 'email_provider_enabled', value: formData.emailProviderEnabled.toString(), description: 'Email provider status' },
        { key: 'stripe_public_key', value: formData.stripePublicKey, description: 'Stripe public key' },
        { key: 'stripe_secret_key', value: formData.stripeSecretKey, description: 'Stripe secret key' },
        { key: 'twilio_sid', value: formData.twilioSid, description: 'Twilio SID' },
        { key: 'twilio_auth_token', value: formData.twilioAuth, description: 'Twilio auth token' },
        { key: 'twilio_from', value: formData.twilioFrom, description: 'Twilio sender number' },
        { key: 'site_name', value: formData.siteName, description: 'Website name' },
        { key: 'site_description', value: formData.siteDescription, description: 'Website description' },
        { key: 'contact_email', value: formData.contactEmail, description: 'Contact email' },
        { key: 'contact_phone', value: formData.contactPhone, description: 'Contact phone' }
      ];

      const response = await adminApi.bulkUpdateSettings(token, settingsToUpdate);
      
      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Settings saved successfully',
        });
        // Refresh settings to get updated data
        await fetchSettings();
      } else {
        toast({
          title: 'Error',
          description: response.data.error || 'Failed to save settings',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <p className="text-gray-600">Manage platform configuration and integrations</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchSettings} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Backend URL</Label>
              <Input 
                placeholder="https://api.ndarehe.com" 
                value={formData.backendUrl} 
                onChange={(e) => handleInputChange('backendUrl', e.target.value)} 
              />
            </div>
            <div>
              <Label>Frontend URL</Label>
              <Input 
                placeholder="https://ndarehe.com" 
                value={formData.frontendUrl} 
                onChange={(e) => handleInputChange('frontendUrl', e.target.value)} 
              />
            </div>
          </div>
          <div>
            <Label>Email From</Label>
            <Input 
              placeholder="NDAREHE <noreply@ndarehe.com>" 
              value={formData.emailFrom} 
              onChange={(e) => handleInputChange('emailFrom', e.target.value)} 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Language</Label>
              <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="rw">Kinyarwanda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Timezone</Label>
              <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Kigali">Africa/Kigali (GMT+2)</SelectItem>
                  <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                  <SelectItem value="Africa/Nairobi">Africa/Nairobi (GMT+3)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between border rounded p-3">
            <div>
              <div className="font-medium">Maintenance Mode</div>
              <div className="text-xs text-gray-500">Temporarily disable public access</div>
            </div>
            <Switch 
              checked={formData.maintenanceMode} 
              onCheckedChange={(checked) => handleInputChange('maintenanceMode', checked)} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Site Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Site Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Site Name</Label>
              <Input 
                placeholder="NDAREHE.COM" 
                value={formData.siteName} 
                onChange={(e) => handleInputChange('siteName', e.target.value)} 
              />
            </div>
            <div>
              <Label>Site Description</Label>
              <Input 
                placeholder="Accommodation and Local Experience Booking Platform" 
                value={formData.siteDescription} 
                onChange={(e) => handleInputChange('siteDescription', e.target.value)} 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Contact Email</Label>
              <Input 
                placeholder="contact@ndarehe.com" 
                value={formData.contactEmail} 
                onChange={(e) => handleInputChange('contactEmail', e.target.value)} 
              />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input 
                placeholder="+250 788 123 456" 
                value={formData.contactPhone} 
                onChange={(e) => handleInputChange('contactPhone', e.target.value)} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Payment Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Stripe Public Key</Label>
              <Input 
                placeholder="pk_live_..." 
                value={formData.stripePublicKey} 
                onChange={(e) => handleInputChange('stripePublicKey', e.target.value)} 
              />
            </div>
            <div>
              <Label>Stripe Secret Key</Label>
              <Input 
                placeholder="sk_live_..." 
                value={formData.stripeSecretKey} 
                onChange={(e) => handleInputChange('stripeSecretKey', e.target.value)} 
              />
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <p><strong>Note:</strong> These keys are used for payment processing. Ensure they are valid and secure.</p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notification Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between border rounded p-3">
            <div>
              <div className="font-medium">Email Provider</div>
              <div className="text-xs text-gray-500">Enable transactional emails</div>
            </div>
            <Switch 
              checked={formData.emailProviderEnabled} 
              onCheckedChange={(checked) => handleInputChange('emailProviderEnabled', checked)} 
            />
          </div>
          <div className="flex items-center justify-between border rounded p-3">
            <div>
              <div className="font-medium">SMS Provider</div>
              <div className="text-xs text-gray-500">Enable SMS notifications</div>
            </div>
            <Switch 
              checked={formData.smsProviderEnabled} 
              onCheckedChange={(checked) => handleInputChange('smsProviderEnabled', checked)} 
            />
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Twilio SID</Label>
              <Input 
                placeholder="AC..." 
                value={formData.twilioSid} 
                onChange={(e) => handleInputChange('twilioSid', e.target.value)} 
              />
            </div>
            <div>
              <Label>Twilio Auth Token</Label>
              <Input 
                placeholder="..." 
                value={formData.twilioAuth} 
                onChange={(e) => handleInputChange('twilioAuth', e.target.value)} 
              />
            </div>
            <div>
              <Label>Twilio From Number</Label>
              <Input 
                placeholder="+250..." 
                value={formData.twilioFrom} 
                onChange={(e) => handleInputChange('twilioFrom', e.target.value)} 
              />
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <p><strong>Note:</strong> Twilio credentials are required for SMS functionality. Leave empty if SMS is not needed.</p>
          </div>
        </CardContent>
      </Card>

      {/* Current Settings Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Current System Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {settings.map((setting) => (
              <div key={setting.id} className="border rounded p-3">
                <div className="text-sm font-medium text-gray-900">{setting.key}</div>
                <div className="text-sm text-gray-600 mt-1">{setting.value}</div>
                {setting.description && (
                  <div className="text-xs text-gray-500 mt-1">{setting.description}</div>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  Updated: {new Date(setting.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPanel;



