import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MapPin, Plus, Eye, Edit, XCircle, CheckCircle, Search, Filter, Clock, Users, DollarSign, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface TourItem {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  location: { id: string; name: string; city: string; district: string; province: string };
  duration: number;
  maxParticipants: number;
  minParticipants: number;
  pricePerPerson: number;
  currency: string;
  isAvailable: boolean;
  isVerified: boolean;
  images: string[];
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

const ToursManagement: React.FC = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<TourItem[]>([]);
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
  const [locations, setLocations] = useState<Location[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'CITY_TOUR',
    category: 'STANDARD',
    locationId: '',
    duration: '',
    maxParticipants: '',
    minParticipants: '',
    pricePerPerson: '',
    currency: 'RWF',
    itinerary: '',
    includes: '',
    excludes: '',
    meetingPoint: '',
    startTime: '',
    endTime: '',
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

      const response = await adminApi.getTours(token, params);
      if (response.data.success) {
        const data = response.data.data;
        const list = Array.isArray(data?.tours) ? data.tours : [];
        
        // Map to local shape
        const shaped: TourItem[] = list.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          type: t.type,
          category: t.category,
          location: t.location,
          duration: t.duration,
          maxParticipants: t.maxParticipants,
          minParticipants: t.minParticipants,
          pricePerPerson: t.pricePerPerson,
          currency: t.currency,
          isAvailable: t.isAvailable,
          isVerified: t.isVerified,
          images: t.images || [],
          rating: t.rating,
          totalReviews: t.totalReviews,
        }));
        
        setItems(shaped);
        
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.totalItems);
        }
      }
    } catch (error) {
      console.error('Error fetching tours:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tours',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTour = async (tourId: string, isVerified: boolean) => {
    if (!token) return;
    
    try {
      const response = await adminApi.verifyTour(token, tourId, isVerified);
      
      if (response.data.success) {
        // Update local state
        setItems(items.map(item => 
          item.id === tourId 
            ? { ...item, isVerified }
            : item
        ));
        
        toast({
          title: 'Success',
          description: `Tour ${isVerified ? 'verified' : 'unverified'} successfully`,
        });
      }
    } catch (error) {
      console.error('Error updating tour verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tour verification',
        variant: 'destructive'
      });
    }
  };

  const handleCreateTour = async () => {
    if (!token) return;
    
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        locationId: formData.locationId,
        duration: parseInt(formData.duration),
        maxParticipants: parseInt(formData.maxParticipants),
        minParticipants: parseInt(formData.minParticipants),
        pricePerPerson: parseFloat(formData.pricePerPerson),
        currency: formData.currency,
        itinerary: formData.itinerary.split(',').map(s => s.trim()).filter(Boolean),
        includes: formData.includes.split(',').map(s => s.trim()).filter(Boolean),
        excludes: formData.excludes.split(',').map(s => s.trim()).filter(Boolean),
        meetingPoint: formData.meetingPoint,
        startTime: formData.startTime,
        endTime: formData.endTime,
        images: formData.images.split(',').map(s => s.trim()).filter(Boolean),
      };

      const response = await adminApi.createTour(token, payload);
      
      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Tour created successfully',
        });
        setAddNewOpen(false);
        resetForm();
        fetchItems(); // Refresh the list
      } else {
        toast({
          title: 'Error',
          description: response.data.error || 'Failed to create tour',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to create tour',
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
      type: 'CITY_TOUR',
      category: 'STANDARD',
      locationId: '',
      duration: '',
      maxParticipants: '',
      minParticipants: '',
      pricePerPerson: '',
      currency: 'RWF',
      itinerary: '',
      includes: '',
      excludes: '',
      meetingPoint: '',
      startTime: '',
      endTime: '',
      images: ''
    });
  };

  const exportTours = async () => {
    if (!token) return;
    
    try {
      // Fetch all tours for export (without pagination)
      const response = await adminApi.getTours(token, { limit: 1000 });
      if (response.data.success) {
        const allTours = response.data.data.tours || [];
        
        const csvContent = [
          ['ID', 'Name', 'Type', 'Category', 'Location', 'Duration (hours)', 'Max Participants', 'Min Participants', 'Price/Person', 'Currency', 'Verified', 'Available'],
          ...allTours.map((tour: any) => [
            tour.id,
            tour.name,
            tour.type,
            tour.category,
            tour.location?.city || '',
            tour.duration,
            tour.maxParticipants,
            tour.minParticipants,
            tour.pricePerPerson,
            tour.currency,
            tour.isVerified ? 'Yes' : 'No',
            tour.isAvailable ? 'Yes' : 'No'
          ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tours-export-${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: 'Success',
          description: 'Tours exported successfully',
        });
      }
    } catch (error) {
      console.error('Error exporting tours:', error);
      toast({
        title: 'Error',
        description: 'Failed to export tours',
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
        <div className="text-gray-500">Loading tours...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tours Management</h2>
          <p className="text-gray-600">Search, review and verify tours</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportTours}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setAddNewOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Tour
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
                <SelectItem value="CITY_TOUR">City Tour</SelectItem>
                <SelectItem value="NATURE_TOUR">Nature Tour</SelectItem>
                <SelectItem value="CULTURAL_TOUR">Cultural Tour</SelectItem>
                <SelectItem value="ADVENTURE_TOUR">Adventure Tour</SelectItem>
                <SelectItem value="FOOD_TOUR">Food Tour</SelectItem>
                <SelectItem value="HISTORICAL_TOUR">Historical Tour</SelectItem>
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
          <CardTitle>All Tours ({totalItems} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-500">Loading tours...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tours found</h3>
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
                          <span className="font-semibold">{t.currency} {t.pricePerPerson?.toLocaleString?.() || t.pricePerPerson}</span>
                          <span className="ml-1 text-xs text-gray-500">/ person</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline"><Eye className="h-4 w-4" /></Button>
                          <Button size="sm" variant="outline"><Edit className="h-4 w-4" /></Button>
                          {!t.isVerified ? (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleVerifyTour(t.id, true)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleVerifyTour(t.id, false)}
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
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} tours
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

      {/* Add New Tour Modal */}
      <Dialog open={addNewOpen} onOpenChange={setAddNewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Tour</DialogTitle>
            <DialogDescription>Fill in the details to create a new tour.</DialogDescription>
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
                  placeholder="Tour name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the tour"
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
                    <SelectItem value="CITY_TOUR">City Tour</SelectItem>
                    <SelectItem value="NATURE_TOUR">Nature Tour</SelectItem>
                    <SelectItem value="CULTURAL_TOUR">Cultural Tour</SelectItem>
                    <SelectItem value="ADVENTURE_TOUR">Adventure Tour</SelectItem>
                    <SelectItem value="FOOD_TOUR">Food Tour</SelectItem>
                    <SelectItem value="HISTORICAL_TOUR">Historical Tour</SelectItem>
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

            {/* Duration and Participants */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="duration">Duration (hours) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="4"
                  required
                />
              </div>
              <div>
                <Label htmlFor="maxParticipants">Max Participants *</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  placeholder="10"
                  required
                />
              </div>
              <div>
                <Label htmlFor="minParticipants">Min Participants *</Label>
                <Input
                  id="minParticipants"
                  type="number"
                  value={formData.minParticipants}
                  onChange={(e) => setFormData({ ...formData, minParticipants: e.target.value })}
                  placeholder="1"
                  required
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pricePerPerson">Price per Person *</Label>
                <Input
                  id="pricePerPerson"
                  type="number"
                  value={formData.pricePerPerson}
                  onChange={(e) => setFormData({ ...formData, pricePerPerson: e.target.value })}
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

            {/* Tour Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="meetingPoint">Meeting Point</Label>
                <Input
                  id="meetingPoint"
                  value={formData.meetingPoint}
                  onChange={(e) => setFormData({ ...formData, meetingPoint: e.target.value })}
                  placeholder="Central location"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Itinerary and Inclusions */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="itinerary">Itinerary (comma-separated)</Label>
                <Input
                  id="itinerary"
                  value={formData.itinerary}
                  onChange={(e) => setFormData({ ...formData, itinerary: e.target.value })}
                  placeholder="Visit museum, Lunch, City walk"
                />
              </div>
              <div>
                <Label htmlFor="includes">What's Included (comma-separated)</Label>
                <Input
                  id="includes"
                  value={formData.includes}
                  onChange={(e) => setFormData({ ...formData, includes: e.target.value })}
                  placeholder="Guide, Transport, Lunch"
                />
              </div>
            </div>

            {/* Exclusions and Images */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="excludes">What's Not Included (comma-separated)</Label>
                <Input
                  id="excludes"
                  value={formData.excludes}
                  onChange={(e) => setFormData({ ...formData, excludes: e.target.value })}
                  placeholder="Personal expenses, Tips"
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
              <Button onClick={handleCreateTour} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Tour'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ToursManagement;


