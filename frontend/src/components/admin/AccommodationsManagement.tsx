import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Hotel, Plus, Eye, Edit, CheckCircle, XCircle, MapPin, Search, Filter, DollarSign, Download, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Accommodation {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  location: { id: string; name: string; city: string; district: string; province: string };
  pricePerNight: number;
  currency: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  isAvailable: boolean;
  isVerified: boolean;
  rating?: number;
  totalReviews?: number;
}

interface Location {
  id: string;
  name: string;
  city: string;
  district: string;
  province: string;
}

const AccommodationsManagement: React.FC = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(12);
  const [addNewOpen, setAddNewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Accommodation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Accommodation | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<Accommodation | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'HOTEL',
    category: 'STANDARD',
    locationId: '',
    address: '',
    pricePerNight: '',
    currency: 'RWF',
    maxGuests: '',
    bedrooms: '',
    bathrooms: '',
    amenities: '',
    images: ''
  });

  useEffect(() => {
    fetchItems();
    fetchLocations();
  }, [currentPage, typeFilter, categoryFilter, verifiedFilter]);

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
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (verifiedFilter !== 'all') {
        params.isVerified = verifiedFilter === 'verified';
      }

      const response = await adminApi.getAccommodations(token, params);
      if (response.data.success) {
        const data = response.data.data;
        const list = Array.isArray(data?.accommodations) ? data.accommodations : [];
        
        // Map to local shape
        const shaped: Accommodation[] = list.map((a: any) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          type: a.type,
          category: a.category,
          location: a.location,
          pricePerNight: a.pricePerNight,
          currency: a.currency,
          maxGuests: a.maxGuests,
          bedrooms: a.bedrooms,
          bathrooms: a.bathrooms,
          amenities: a.amenities || [],
          images: a.images || [],
          isAvailable: a.isAvailable,
          isVerified: a.isVerified,
          rating: a.rating,
          totalReviews: a.totalReviews,
        }));
        
        setItems(shaped);
        
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.totalItems);
        }
      }
    } catch (error) {
      console.error('Error fetching accommodations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch accommodations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAccommodation = async (accommodationId: string, isVerified: boolean) => {
    if (!token) return;
    
    try {
      const response = await adminApi.verifyAccommodation(token, accommodationId, isVerified);
      
      if (response.data.success) {
        // Update local state
        setItems(items.map(item => 
          item.id === accommodationId 
            ? { ...item, isVerified }
            : item
        ));
        
        toast({
          title: 'Success',
          description: `Accommodation ${isVerified ? 'verified' : 'unverified'} successfully`,
        });
      }
    } catch (error) {
      console.error('Error updating accommodation verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to update accommodation verification',
        variant: 'destructive'
      });
    }
  };

  const handleCreateAccommodation = async () => {
    if (!token) return;
    
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        locationId: formData.locationId,
        address: formData.address,
        pricePerNight: parseFloat(formData.pricePerNight),
        currency: formData.currency,
        maxGuests: parseInt(formData.maxGuests),
        bedrooms: formData.bedrooms === '' ? 0 : parseInt(formData.bedrooms),
        bathrooms: formData.bathrooms === '' ? 0 : parseInt(formData.bathrooms),
        amenities: formData.amenities.split(',').map(s => s.trim()).filter(Boolean),
        images: formData.images.split(',').map(s => s.trim()).filter(Boolean),
      };

      const response = await adminApi.createAccommodation(token, payload);
      
      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Accommodation created successfully',
        });
        setAddNewOpen(false);
        resetForm();
        fetchItems(); // Refresh the list
      } else {
        toast({
          title: 'Error',
          description: response.data.error || 'Failed to create accommodation',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to create accommodation',
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
      type: 'HOTEL',
      category: 'STANDARD',
      locationId: '',
      address: '',
      pricePerNight: '',
      currency: 'RWF',
      maxGuests: '',
      bedrooms: '',
      bathrooms: '',
      amenities: '',
      images: ''
    });
  };

  const openEdit = (acc: Accommodation) => {
    setEditTarget(acc);
    setFormData({
      name: acc.name || '',
      description: acc.description || '',
      type: acc.type || 'HOTEL',
      category: acc.category || 'STANDARD',
      locationId: acc.location?.id || '',
      address: acc.location?.name || '',
      pricePerNight: String(acc.pricePerNight ?? ''),
      currency: acc.currency || 'RWF',
      maxGuests: String(acc.maxGuests ?? ''),
      bedrooms: String(acc.bedrooms ?? ''),
      bathrooms: String(acc.bathrooms ?? ''),
      amenities: (acc.amenities || []).join(', '),
      images: (acc.images || []).join(', '),
    });
    setEditOpen(true);
  };

  const handleUpdateAccommodation = async () => {
    if (!token || !editTarget) return;
    setUpdating(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        locationId: formData.locationId,
        address: formData.address,
        pricePerNight: parseFloat(formData.pricePerNight),
        currency: formData.currency,
        maxGuests: parseInt(formData.maxGuests),
        bedrooms: formData.bedrooms === '' ? 0 : parseInt(formData.bedrooms),
        bathrooms: formData.bathrooms === '' ? 0 : parseInt(formData.bathrooms),
        amenities: formData.amenities.split(',').map(s => s.trim()).filter(Boolean),
        images: formData.images.split(',').map(s => s.trim()).filter(Boolean),
      };
      const res = await adminApi.updateAccommodation(token, editTarget.id, payload);
      if (res.data?.success !== false) {
        toast({ title: 'Updated', description: 'Accommodation updated successfully' });
        setEditOpen(false);
        setEditTarget(null);
        fetchItems();
      } else {
        toast({ title: 'Update failed', description: res.data?.error || 'Failed to update', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Update failed', description: e?.response?.data?.error || e.message || 'Failed to update', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const confirmDelete = (acc: Accommodation) => {
    setDeleteTarget(acc);
  };

  const openView = (acc: Accommodation) => {
    setViewTarget(acc);
    setViewOpen(true);
  };

  const handleDeleteAccommodation = async () => {
    if (!token || !deleteTarget) return;
    setDeleting(true);
    try {
      const res = await adminApi.deleteAccommodation(token, deleteTarget.id);
      if (res.data?.success !== false) {
        setItems(prev => prev.filter(i => i.id !== deleteTarget.id));
        toast({ title: 'Deleted', description: 'Accommodation deleted successfully' });
        setDeleteTarget(null);
      } else {
        toast({ title: 'Delete failed', description: res.data?.error || 'Failed to delete', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.response?.data?.error || e.message || 'Failed to delete', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const exportAccommodations = async () => {
    if (!token) return;
    
    try {
      // Fetch all accommodations for export (without pagination)
      const response = await adminApi.getAccommodations(token, { limit: 1000 });
      if (response.data.success) {
        const allAccommodations = response.data.data.accommodations || [];
        
        const csvContent = [
          ['ID', 'Name', 'Type', 'Category', 'Location', 'Price/Night', 'Currency', 'Max Guests', 'Bedrooms', 'Bathrooms', 'Verified', 'Available'],
          ...allAccommodations.map((acc: any) => [
            acc.id,
            acc.name,
            acc.type,
            acc.category,
            acc.location?.city || '',
            acc.pricePerNight,
            acc.currency,
            acc.maxGuests,
            acc.bedrooms,
            acc.bathrooms,
            acc.isVerified ? 'Yes' : 'No',
            acc.isAvailable ? 'Yes' : 'No'
          ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accommodations-export-${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: 'Success',
          description: 'Accommodations exported successfully',
        });
      }
    } catch (error) {
      console.error('Error exporting accommodations:', error);
      toast({
        title: 'Error',
        description: 'Failed to export accommodations',
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
    return items.filter((a) => {
      const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.location?.city?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [items, searchTerm]);

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading accommodations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Accommodations Management</h2>
          <p className="text-gray-600">Search, review and verify accommodations</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportAccommodations}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setAddNewOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Accommodation
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
                <SelectItem value="HOTEL">Hotel</SelectItem>
                <SelectItem value="GUESTHOUSE">Guesthouse</SelectItem>
                <SelectItem value="APARTMENT">Apartment</SelectItem>
                <SelectItem value="VILLA">Villa</SelectItem>
                <SelectItem value="HOSTEL">Hostel</SelectItem>
                <SelectItem value="CAMPING">Camping</SelectItem>
                <SelectItem value="HOMESTAY">Homestay</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(value) => { setCategoryFilter(value); handleFilterChange(); }}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="BUDGET">Budget</SelectItem>
                <SelectItem value="STANDARD">Standard</SelectItem>
                <SelectItem value="PREMIUM">Premium</SelectItem>
                <SelectItem value="LUXURY">Luxury</SelectItem>
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
                  setCategoryFilter('all');
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
          <CardTitle>All Accommodations ({totalItems} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-500">Loading accommodations...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Hotel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No accommodations found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((a) => (
                  <div key={a.id} className="border rounded-xl overflow-hidden bg-white shadow hover:shadow-lg transition">
                    <div className="aspect-video bg-muted">
                      <img src={a.images?.[0] || '/placeholder.svg'} alt={a.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-lg font-semibold">{a.name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin className="h-3.5 w-3.5 mr-1" /> {a.location?.city}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={a.isVerified ? 'default' : 'secondary'}>{a.isVerified ? 'Verified' : 'Unverified'}</Badge>
                          {a.isAvailable ? <Badge variant="outline">Available</Badge> : <Badge variant="destructive">Unavailable</Badge>}
                        </div>
                      </div>
                      <div className="text-sm line-clamp-2 text-gray-600">{a.description}</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                          <span className="font-semibold">{a.currency} {a.pricePerNight?.toLocaleString?.() || a.pricePerNight}</span>
                          <span className="ml-1 text-xs text-gray-500">/ night</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openView(a)}><Eye className="h-4 w-4" /></Button>
                          <Button size="sm" variant="outline" onClick={() => openEdit(a)}><Edit className="h-4 w-4" /></Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => confirmDelete(a)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {!a.isVerified ? (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleVerifyAccommodation(a.id, true)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleVerifyAccommodation(a.id, false)}
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
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} accommodations
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

      {/* Add New Accommodation Modal */}
      <Dialog open={addNewOpen} onOpenChange={setAddNewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Accommodation</DialogTitle>
            <DialogDescription>Fill in the details to create a new accommodation.</DialogDescription>
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
                  placeholder="Accommodation name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the accommodation"
                  required
                />
              </div>
            </div>

            {/* Type and Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOTEL">Hotel</SelectItem>
                    <SelectItem value="GUESTHOUSE">Guesthouse</SelectItem>
                    <SelectItem value="APARTMENT">Apartment</SelectItem>
                    <SelectItem value="VILLA">Villa</SelectItem>
                    <SelectItem value="HOSTEL">Hostel</SelectItem>
                    <SelectItem value="CAMPING">Camping</SelectItem>
                    <SelectItem value="HOMESTAY">Homestay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUDGET">Budget</SelectItem>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                    <SelectItem value="LUXURY">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location and Address */}
            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address"
                  required
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pricePerNight">Price per Night *</Label>
                <Input
                  id="pricePerNight"
                  type="number"
                  value={formData.pricePerNight}
                  onChange={(e) => setFormData({ ...formData, pricePerNight: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  placeholder="RWF"
                />
              </div>
            </div>

            {/* Capacity */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="maxGuests">Max Guests</Label>
                <Input
                  id="maxGuests"
                  type="number"
                  value={formData.maxGuests}
                  onChange={(e) => setFormData({ ...formData, maxGuests: e.target.value })}
                  placeholder="2"
                />
              </div>
              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min={0}
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min={0}
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>

            {/* Amenities and Images */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                <Input
                  id="amenities"
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  placeholder="WiFi, Pool, Gym"
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
              <Button onClick={handleCreateAccommodation} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Accommodation'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* View Accommodation Modal */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewTarget?.name || 'Accommodation Details'}</DialogTitle>
            <DialogDescription>Read-only overview of this accommodation.</DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-4">
              {viewTarget.images?.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {viewTarget.images.slice(0, 6).map((src, idx) => (
                    <img key={idx} src={src} alt={`img-${idx}`} className="w-full h-32 object-cover rounded" />
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <div className="mt-1 text-sm">{viewTarget.type}</div>
                </div>
                <div>
                  <Label>Category</Label>
                  <div className="mt-1 text-sm">{viewTarget.category}</div>
                </div>
                <div>
                  <Label>Location</Label>
                  <div className="mt-1 text-sm">{viewTarget.location?.name} • {viewTarget.location?.city}</div>
                </div>
                <div>
                  <Label>Price / Night</Label>
                  <div className="mt-1 text-sm">{viewTarget.currency} {viewTarget.pricePerNight?.toLocaleString?.() || viewTarget.pricePerNight}</div>
                </div>
                <div>
                  <Label>Capacity</Label>
                  <div className="mt-1 text-sm">Guests: {viewTarget.maxGuests} • Bedrooms: {viewTarget.bedrooms} • Bathrooms: {viewTarget.bathrooms}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1 text-sm">{viewTarget.isVerified ? 'Verified' : 'Unverified'} • {viewTarget.isAvailable ? 'Available' : 'Unavailable'}</div>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <div className="mt-1 text-sm text-gray-700">{viewTarget.description}</div>
              </div>
              {viewTarget.amenities?.length > 0 && (
                <div>
                  <Label>Amenities</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {viewTarget.amenities.map((am, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{am}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Edit Accommodation Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Accommodation</DialogTitle>
            <DialogDescription>Update the details and save your changes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="e_name">Name *</Label>
                <Input id="e_name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="e_description">Description *</Label>
                <Input id="e_description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOTEL">Hotel</SelectItem>
                    <SelectItem value="GUESTHOUSE">Guesthouse</SelectItem>
                    <SelectItem value="APARTMENT">Apartment</SelectItem>
                    <SelectItem value="VILLA">Villa</SelectItem>
                    <SelectItem value="HOSTEL">Hostel</SelectItem>
                    <SelectItem value="CAMPING">Camping</SelectItem>
                    <SelectItem value="HOMESTAY">Homestay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUDGET">Budget</SelectItem>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                    <SelectItem value="LUXURY">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <Label htmlFor="e_address">Address *</Label>
                <Input id="e_address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="e_pricePerNight">Price per Night *</Label>
                <Input id="e_pricePerNight" type="number" value={formData.pricePerNight} onChange={(e) => setFormData({ ...formData, pricePerNight: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="e_currency">Currency</Label>
                <Input id="e_currency" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="e_maxGuests">Max Guests</Label>
                <Input id="e_maxGuests" type="number" value={formData.maxGuests} onChange={(e) => setFormData({ ...formData, maxGuests: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="e_bedrooms">Bedrooms</Label>
                <Input id="e_bedrooms" type="number" value={formData.bedrooms} onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="e_bathrooms">Bathrooms</Label>
                <Input id="e_bathrooms" type="number" value={formData.bathrooms} onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="e_amenities">Amenities (comma-separated)</Label>
                <Input id="e_amenities" value={formData.amenities} onChange={(e) => setFormData({ ...formData, amenities: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="e_images">Image URLs (comma-separated)</Label>
                <Input id="e_images" value={formData.images} onChange={(e) => setFormData({ ...formData, images: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => { setEditOpen(false); setEditTarget(null); }}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAccommodation} disabled={updating}>
                {updating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Accommodation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAccommodation} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccommodationsManagement;
