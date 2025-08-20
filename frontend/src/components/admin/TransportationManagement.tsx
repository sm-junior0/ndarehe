import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Car, Plus, Eye, Edit, XCircle, CheckCircle, MapPin, Search, Filter, Users, DollarSign, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface TransportationItem {
  id: string;
  name: string;
  description: string;
  type: string;
  vehicleType: string;
  location: { id: string; name: string; city: string; district: string; province: string };
  capacity: number;
  pricePerTrip: number;
  pricePerHour?: number;
  currency: string;
  isAvailable: boolean;
  isVerified: boolean;
  images: string[];
}

interface Location {
  id: string;
  name: string;
  city: string;
  district: string;
  province: string;
}

const TransportationManagement: React.FC = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<TransportationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(12);
  const [addNewOpen, setAddNewOpen] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'AIRPORT_PICKUP',
    vehicleType: 'STANDARD',
    locationId: '',
    capacity: '',
    pricePerTrip: '',
    pricePerHour: '',
    currency: 'RWF',
    amenities: '',
    images: ''
  });

  useEffect(() => {
    fetchItems();
    fetchLocations();
  }, [currentPage, typeFilter, vehicleFilter, verifiedFilter]);

  const fetchLocations = async () => {
    if (!token) return;
    
    try {
      const response = await adminApi.getLocations(token);
      if (response.data.success) {
        setLocations(response.data.data.locations || []);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchItems = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: itemsPerPage
      };
      
      if (searchTerm) params.search = searchTerm;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (vehicleFilter !== 'all') params.vehicleType = vehicleFilter;
      if (verifiedFilter !== 'all') {
        params.isVerified = verifiedFilter === 'verified';
      }

      const response = await adminApi.getTransportation(token, params);
      if (response.data.success) {
        const data = response.data.data;
        const list = Array.isArray(data?.transportation) ? data.transportation : [];
        
        // Map to local shape
        const shaped: TransportationItem[] = list.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          type: t.type,
          vehicleType: t.vehicleType,
          location: t.location,
          capacity: t.capacity,
          pricePerTrip: t.pricePerTrip,
          pricePerHour: t.pricePerHour,
          currency: t.currency,
          isAvailable: t.isAvailable,
          isVerified: t.isVerified,
          images: t.images || [],
        }));
        
        setItems(shaped);
        
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.totalItems);
        }
      }
    } catch (error) {
      console.error('Error fetching transportation:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch transportation services',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTransportation = async (transportationId: string, isVerified: boolean) => {
    if (!token) return;
    
    try {
      const response = await adminApi.verifyTransportation(token, transportationId, isVerified);
      
      if (response.data.success) {
        // Update local state
        setItems(items.map(item => 
          item.id === transportationId 
            ? { ...item, isVerified }
            : item
        ));
        
        toast({
          title: 'Success',
          description: `Transportation ${isVerified ? 'verified' : 'unverified'} successfully`,
        });
      }
    } catch (error) {
      console.error('Error updating transportation verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to update transportation verification',
        variant: 'destructive'
      });
    }
  };

  const handleCreateTransportation = async () => {
    if (!token) return;
    
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        vehicleType: formData.vehicleType,
        locationId: formData.locationId,
        capacity: parseInt(formData.capacity),
        pricePerTrip: parseFloat(formData.pricePerTrip),
        pricePerHour: formData.pricePerHour ? parseFloat(formData.pricePerHour) : null,
        currency: formData.currency,
        amenities: formData.amenities.split(',').map(s => s.trim()).filter(Boolean),
        images: formData.images.split(',').map(s => s.trim()).filter(Boolean),
      };

      const response = await adminApi.createTransportation(token, payload);
      
      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Transportation service created successfully',
        });
        setAddNewOpen(false);
        resetForm();
        fetchItems(); // Refresh the list
      } else {
        toast({
          title: 'Error',
          description: response.data.error || 'Failed to create transportation service',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to create transportation service',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'AIRPORT_PICKUP',
      vehicleType: 'STANDARD',
      locationId: '',
      capacity: '',
      pricePerTrip: '',
      pricePerHour: '',
      currency: 'RWF',
      amenities: '',
      images: ''
    });
  };

  const exportTransportation = async () => {
    if (!token) return;
    
    try {
      // Fetch all transportation for export (without pagination)
      const response = await adminApi.getTransportation(token, { limit: 1000 });
      if (response.data.success) {
        const allTransportation = response.data.data.transportation || [];
        
        const csvContent = [
          ['ID', 'Name', 'Type', 'Vehicle Type', 'Location', 'Capacity', 'Price/Trip', 'Price/Hour', 'Currency', 'Verified', 'Available'],
          ...allTransportation.map((trans: any) => [
            trans.id,
            trans.name,
            trans.type,
            trans.vehicleType,
            trans.location?.city || '',
            trans.capacity,
            trans.pricePerTrip,
            trans.pricePerHour || '',
            trans.currency,
            trans.isVerified ? 'Yes' : 'No',
            trans.isAvailable ? 'Yes' : 'No'
          ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transportation-export-${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: 'Success',
          description: 'Transportation services exported successfully',
        });
      }
    } catch (error) {
      console.error('Error exporting transportation:', error);
      toast({
        title: 'Error',
        description: 'Failed to export transportation services',
        variant: 'destructive'
      });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = () => {
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchItems();
  };

  const filteredItems = useMemo(() => {
    return items.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.location?.city?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [items, searchTerm]);

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading transportation services...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transportation Management</h2>
          <p className="text-gray-600">Search, review and verify transportation services</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportTransportation}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setAddNewOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Transportation
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search by name or city" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10" 
              />
            </div>
            <Select value={typeFilter} onValueChange={(value) => { setTypeFilter(value); handleFilterChange(); }}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="AIRPORT_PICKUP">Airport Pickup</SelectItem>
                <SelectItem value="CITY_TRANSPORT">City Transport</SelectItem>
                <SelectItem value="TOUR_TRANSPORT">Tour Transport</SelectItem>
                <SelectItem value="PRIVATE_TRANSPORT">Private Transport</SelectItem>
              </SelectContent>
            </Select>
            <Select value={vehicleFilter} onValueChange={(value) => { setVehicleFilter(value); handleFilterChange(); }}>
              <SelectTrigger>
                <SelectValue placeholder="Vehicle Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                <SelectItem value="STANDARD">Standard</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
                <SelectItem value="VAN">Van</SelectItem>
                <SelectItem value="BUS">Bus</SelectItem>
                <SelectItem value="MOTORCYCLE">Motorcycle</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verifiedFilter} onValueChange={(value) => { setVerifiedFilter(value); handleFilterChange(); }}>
              <SelectTrigger>
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-end space-x-2">
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setVehicleFilter('all');
                  setVerifiedFilter('all');
                  setCurrentPage(1);
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      <Card>
        <CardHeader>
          <CardTitle>All Transportation Services ({totalItems} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-500">Loading transportation services...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transportation services found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((t) => (
                  <div key={t.id} className="border rounded-xl overflow-hidden bg-white shadow hover:shadow-lg transition">
                    <div className="aspect-video bg-muted">
                      <img src={t.images?.[0] || '/placeholder.svg'} alt={t.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-lg font-semibold">{t.name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin className="h-3.5 w-3.5 mr-1" /> {t.location?.city}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={t.isVerified ? 'default' : 'secondary'}>{t.isVerified ? 'Verified' : 'Unverified'}</Badge>
                          {t.isAvailable ? <Badge variant="outline">Available</Badge> : <Badge variant="destructive">Unavailable</Badge>}
                        </div>
                      </div>
                      <div className="text-sm line-clamp-2 text-gray-600">{t.description}</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                          <span className="font-semibold">{t.currency} {t.pricePerTrip?.toLocaleString?.() || t.pricePerTrip}</span>
                          <span className="ml-1 text-xs text-gray-500">/ trip</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline"><Eye className="h-4 w-4" /></Button>
                          <Button size="sm" variant="outline"><Edit className="h-4 w-4" /></Button>
                          {!t.isVerified ? (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleVerifyTransportation(t.id, true)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleVerifyTransportation(t.id, false)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} transportation services
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      disabled={currentPage <= 1} 
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-3 text-sm text-gray-500">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button 
                      variant="outline" 
                      disabled={currentPage >= totalPages} 
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add New Transportation Modal */}
      <Dialog open={addNewOpen} onOpenChange={setAddNewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Transportation Service</DialogTitle>
            <DialogDescription>Fill in the details to create a new transportation service.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Transportation service name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the transportation service"
                  required
                />
              </div>
            </div>

            {/* Type and Vehicle Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AIRPORT_PICKUP">Airport Pickup</SelectItem>
                    <SelectItem value="CITY_TRANSPORT">City Transport</SelectItem>
                    <SelectItem value="TOUR_TRANSPORT">Tour Transport</SelectItem>
                    <SelectItem value="PRIVATE_TRANSPORT">Private Transport</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vehicle Type *</Label>
                <Select value={formData.vehicleType} onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="VAN">Van</SelectItem>
                    <SelectItem value="BUS">Bus</SelectItem>
                    <SelectItem value="MOTORCYCLE">Motorcycle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <div>
              <Label>Location *</Label>
              <Select value={formData.locationId} onValueChange={(value) => setFormData({ ...formData, locationId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name} - {location.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Capacity and Pricing */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="capacity">Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="4"
                  required
                />
              </div>
              <div>
                <Label htmlFor="pricePerTrip">Price per Trip *</Label>
                <Input
                  id="pricePerTrip"
                  type="number"
                  value={formData.pricePerTrip}
                  onChange={(e) => setFormData({ ...formData, pricePerTrip: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="pricePerHour">Price per Hour (optional)</Label>
                <Input
                  id="pricePerHour"
                  type="number"
                  value={formData.pricePerHour}
                  onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Currency */}
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="RWF"
              />
            </div>

            {/* Amenities and Images */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                <Input
                  id="amenities"
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  placeholder="WiFi, AC, GPS"
                />
              </div>
              <div>
                <Label htmlFor="images">Image URLs (comma-separated)</Label>
                <Input
                  id="images"
                  value={formData.images}
                  onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => { setAddNewOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleCreateTransportation} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Transportation Service'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransportationManagement;


