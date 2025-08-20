import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export const ExportReportModal: React.FC<ExportModalProps> = ({ open, onOpenChange }) => {
  // Pull latest stats from DOM-safe custom event or ask backend live
  const buildCsv = async (): Promise<string> => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      const s = json?.data?.stats || {};
      const rows = [
        ['Metric','Value'],
        ['Total Users', s.totalUsers ?? 0],
        ['Total Bookings', s.totalBookings ?? 0],
        ['Total Revenue', s.totalRevenue ?? 0],
        ['Pending Bookings', s.pendingBookings ?? 0],
        ['Pending Trip Plans', s.pendingTripPlans ?? 0],
        ['Unverified Accommodations', s.unverifiedAccommodations ?? 0],
        ['Unverified Transportation', s.unverifiedTransportation ?? 0],
      ];
      return rows.map(r => r.join(',')).join('\n');
    } catch {
      return 'Metric,Value\nTotal Users,0\nTotal Bookings,0\nTotal Revenue,0\n';
    }
  };

  const handleExport = async () => {
    const csv = await buildCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-report-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Dashboard Report</DialogTitle>
          <DialogDescription>Download a quick CSV snapshot of current KPIs.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleExport}>Download CSV</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface AddNewModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

type CreateType = 'ACCOMMODATION' | 'TRANSPORTATION' | 'TOUR' | 'USER' | '';

export const AddNewModal: React.FC<AddNewModalProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const { token } = useAuth();
  const [step, setStep] = useState<'choose' | 'form'>('choose');
  const [createType, setCreateType] = useState<CreateType>('');
  const [submitting, setSubmitting] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);

  // Shared helpers
  const [common, setCommon] = useState({ name: '', description: '' });

  // Accommodation fields
  const [acc, setAcc] = useState({
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

  // Transportation fields
  const [trans, setTrans] = useState({
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

  // Tour fields
  const [tour, setTour] = useState({
    type: 'CITY_TOUR',
    category: 'STANDARD',
    locationId: '',
    duration: '',
    maxParticipants: '',
    minParticipants: '1',
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

  // User fields
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'USER'
  });

  // Fetch locations when modal opens
  React.useEffect(() => {
    if (open && token) {
      fetchLocations();
    }
  }, [open, token]);

  const fetchLocations = async () => {
    try {
      const response = await adminApi.getLocations(token!);
      if (response.data.success) {
        setLocations(response.data.data.locations || []);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const resetForm = () => {
    setCommon({ name: '', description: '' });
    setAcc({ type: 'HOTEL', category: 'STANDARD', locationId: '', address: '', pricePerNight: '', currency: 'RWF', maxGuests: '', bedrooms: '', bathrooms: '', amenities: '', images: '' });
    setTrans({ type: 'AIRPORT_PICKUP', vehicleType: 'STANDARD', locationId: '', capacity: '', pricePerTrip: '', pricePerHour: '', currency: 'RWF', amenities: '', images: '' });
    setTour({ type: 'CITY_TOUR', category: 'STANDARD', locationId: '', duration: '', maxParticipants: '', minParticipants: '1', pricePerPerson: '', currency: 'RWF', itinerary: '', includes: '', excludes: '', meetingPoint: '', startTime: '', endTime: '', images: '' });
    setUser({ firstName: '', lastName: '', email: '', role: 'USER' });
  };

  const closeAll = () => {
    setStep('choose');
    setCreateType('');
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    if (!token) {
      toast({ title: 'Error', description: 'Authentication token missing. Please log in.', variant: 'destructive' });
      setSubmitting(false);
      return;
    }
    try {
      let payload: any;
      let apiCall: Promise<any>;

      switch (createType) {
        case 'USER':
          payload = { ...user };
          apiCall = adminApi.createUser(token, payload);
          break;
        case 'ACCOMMODATION':
          payload = {
            ...common,
            ...acc,
            pricePerNight: parseFloat(acc.pricePerNight),
            maxGuests: parseInt(acc.maxGuests),
            bedrooms: parseInt(acc.bedrooms),
            bathrooms: parseInt(acc.bathrooms),
            amenities: acc.amenities.split(',').map(s => s.trim()).filter(Boolean),
            images: acc.images.split(',').map(s => s.trim()).filter(Boolean),
          };
          apiCall = adminApi.createAccommodation(token, payload);
          break;
        case 'TRANSPORTATION':
          payload = {
            ...common,
            ...trans,
            capacity: parseInt(trans.capacity),
            pricePerTrip: parseFloat(trans.pricePerTrip),
            pricePerHour: trans.pricePerHour ? parseFloat(trans.pricePerHour) : null,
            amenities: trans.amenities.split(',').map(s => s.trim()).filter(Boolean),
            images: trans.images.split(',').map(s => s.trim()).filter(Boolean),
          };
          apiCall = adminApi.createTransportation(token, payload);
          break;
        case 'TOUR':
          payload = {
            ...common,
            ...tour,
            duration: parseInt(tour.duration),
            maxParticipants: parseInt(tour.maxParticipants),
            minParticipants: parseInt(tour.minParticipants),
            pricePerPerson: parseFloat(tour.pricePerPerson),
            currency: tour.currency,
            itinerary: tour.itinerary.split(',').map(s => s.trim()).filter(Boolean),
            includes: tour.includes.split(',').map(s => s.trim()).filter(Boolean),
            excludes: tour.excludes.split(',').map(s => s.trim()).filter(Boolean),
            images: tour.images.split(',').map(s => s.trim()).filter(Boolean),
            meetingPoint: tour.meetingPoint,
            startTime: tour.startTime,
            endTime: tour.endTime,
          };
          apiCall = adminApi.createTour(token, payload);
          break;
        default:
          throw new Error('Invalid create type');
      }

      const res = await apiCall;
      if (res.data.success) {
        toast({ title: 'Success', description: `${createType} created successfully.` });
        closeAll();
      } else {
        toast({ title: 'Error', description: res.data.error || `Failed to create ${createType}.`, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || error.message || `Failed to create ${createType}.`, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const body = useMemo(() => {
    if (step === 'choose') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => { setCreateType('ACCOMMODATION'); setStep('form'); }}>Accommodation</Button>
          <Button onClick={() => { setCreateType('TRANSPORTATION'); setStep('form'); }}>Transportation</Button>
          <Button onClick={() => { setCreateType('TOUR'); setStep('form'); }}>Tour</Button>
          <Button onClick={() => { setCreateType('USER'); setStep('form'); }}>User</Button>
        </div>
      );
    }

    if (createType === 'USER') {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First Name</Label>
              <Input value={user.firstName} onChange={(e) => setUser({ ...user, firstName: e.target.value })} required />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input value={user.lastName} onChange={(e) => setUser({ ...user, lastName: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={user.email} onChange={(e) => setUser({ ...user, email: e.target.value })} required />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={user.role} onValueChange={(v) => setUser({ ...user, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="PROVIDER">Provider</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    // Shared fields for services
    const shared = (
      <div className="space-y-3">
        <div>
          <Label>Name</Label>
          <Input value={common.name} onChange={(e) => setCommon({ ...common, name: e.target.value })} required />
        </div>
        <div>
          <Label>Description</Label>
          <Input value={common.description} onChange={(e) => setCommon({ ...common, description: e.target.value })} required />
        </div>
      </div>
    );

    if (createType === 'ACCOMMODATION') {
      return (
        <div className="space-y-4">
          {shared}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={acc.type} onValueChange={(v) => setAcc({ ...acc, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['HOTEL','GUESTHOUSE','APARTMENT','VILLA','HOSTEL','CAMPING','HOMESTAY'].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={acc.category} onValueChange={(v) => setAcc({ ...acc, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['BUDGET','STANDARD','PREMIUM','LUXURY'].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Location</Label>
              <Select value={acc.locationId} onValueChange={(v) => setAcc({ ...acc, locationId: v })}>
                <SelectTrigger><SelectValue placeholder="Select a location" /></SelectTrigger>
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
              <Label>Address</Label>
              <Input value={acc.address} onChange={(e) => setAcc({ ...acc, address: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Price per Night</Label>
              <Input type="number" value={acc.pricePerNight} onChange={(e) => setAcc({ ...acc, pricePerNight: e.target.value })} required />
            </div>
            <div>
              <Label>Currency</Label>
              <Input value={acc.currency} onChange={(e) => setAcc({ ...acc, currency: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Max Guests</Label>
              <Input type="number" value={acc.maxGuests} onChange={(e) => setAcc({ ...acc, maxGuests: e.target.value })} />
            </div>
            <div>
              <Label>Bedrooms</Label>
              <Input type="number" value={acc.bedrooms} onChange={(e) => setAcc({ ...acc, bedrooms: e.target.value })} />
            </div>
            <div>
              <Label>Bathrooms</Label>
              <Input type="number" value={acc.bathrooms} onChange={(e) => setAcc({ ...acc, bathrooms: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amenities (comma-separated)</Label>
              <Input value={acc.amenities} onChange={(e) => setAcc({ ...acc, amenities: e.target.value })} />
            </div>
            <div>
              <Label>Image URLs (comma-separated)</Label>
              <Input value={acc.images} onChange={(e) => setAcc({ ...acc, images: e.target.value })} />
            </div>
          </div>
        </div>
      );
    }

    if (createType === 'TRANSPORTATION') {
      return (
        <div className="space-y-4">
          {shared}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={trans.type} onValueChange={(v) => setTrans({ ...trans, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['AIRPORT_PICKUP','CITY_TRANSPORT','TOUR_TRANSPORT','PRIVATE_TRANSPORT'].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vehicle Type</Label>
              <Select value={trans.vehicleType} onValueChange={(v) => setTrans({ ...trans, vehicleType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['STANDARD','VIP','VAN','BUS','MOTORCYCLE'].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Location</Label>
              <Select value={trans.locationId} onValueChange={(v) => setTrans({ ...trans, locationId: v })}>
                <SelectTrigger><SelectValue placeholder="Select a location" /></SelectTrigger>
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
              <Label>Capacity</Label>
              <Input type="number" value={trans.capacity} onChange={(e) => setTrans({ ...trans, capacity: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Price per Trip</Label>
              <Input type="number" value={trans.pricePerTrip} onChange={(e) => setTrans({ ...trans, pricePerTrip: e.target.value })} required />
            </div>
            <div>
              <Label>Price per Hour (optional)</Label>
              <Input type="number" value={trans.pricePerHour} onChange={(e) => setTrans({ ...trans, pricePerHour: e.target.value })} />
            </div>
            <div>
              <Label>Currency</Label>
              <Input value={trans.currency} onChange={(e) => setTrans({ ...trans, currency: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amenities (comma-separated)</Label>
              <Input value={trans.amenities} onChange={(e) => setTrans({ ...trans, amenities: e.target.value })} />
            </div>
            <div>
              <Label>Image URLs (comma-separated)</Label>
              <Input value={trans.images} onChange={(e) => setTrans({ ...trans, images: e.target.value })} />
            </div>
          </div>
        </div>
      );
    }

    if (createType === 'TOUR') {
      return (
        <div className="space-y-4">
          {shared}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={tour.type} onValueChange={(v) => setTour({ ...tour, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['CITY_TOUR','CULTURAL_TOUR','ADVENTURE_TOUR','FOOD_TOUR','NATURE_TOUR'].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={tour.category} onValueChange={(v) => setTour({ ...tour, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['BUDGET','STANDARD','PREMIUM','LUXURY'].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Location</Label>
              <Select value={tour.locationId} onValueChange={(v) => setTour({ ...tour, locationId: v })}>
                <SelectTrigger><SelectValue placeholder="Select a location" /></SelectTrigger>
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
              <Label>Duration (hours)</Label>
              <Input type="number" value={tour.duration} onChange={(e) => setTour({ ...tour, duration: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Max Participants</Label>
              <Input type="number" value={tour.maxParticipants} onChange={(e) => setTour({ ...tour, maxParticipants: e.target.value })} required />
            </div>
            <div>
              <Label>Min Participants</Label>
              <Input type="number" value={tour.minParticipants} onChange={(e) => setTour({ ...tour, minParticipants: e.target.value })} />
            </div>
            <div>
              <Label>Price per Person</Label>
              <Input type="number" value={tour.pricePerPerson} onChange={(e) => setTour({ ...tour, pricePerPerson: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Meeting Point</Label>
              <Input value={tour.meetingPoint} onChange={(e) => setTour({ ...tour, meetingPoint: e.target.value })} />
            </div>
            <div>
              <Label>Time Window (start - end)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Start" value={tour.startTime} onChange={(e) => setTour({ ...tour, startTime: e.target.value })} />
                <Input placeholder="End" value={tour.endTime} onChange={(e) => setTour({ ...tour, endTime: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Itinerary (comma-separated)</Label>
              <Input value={tour.itinerary} onChange={(e) => setTour({ ...tour, itinerary: e.target.value })} />
            </div>
            <div>
              <Label>Includes (comma-separated)</Label>
              <Input value={tour.includes} onChange={(e) => setTour({ ...tour, includes: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Excludes (comma-separated)</Label>
              <Input value={tour.excludes} onChange={(e) => setTour({ ...tour, excludes: e.target.value })} />
            </div>
            <div>
              <Label>Image URLs (comma-separated)</Label>
              <Input value={tour.images} onChange={(e) => setTour({ ...tour, images: e.target.value })} />
            </div>
          </div>
        </div>
      );
    }

    return null;
  }, [step, createType, common, acc, trans, tour, user, locations]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) closeAll(); else onOpenChange(v); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{step === 'choose' ? 'Quick Create' : `Create ${createType}`}</DialogTitle>
          <DialogDescription>{step === 'choose' ? 'Choose what you want to add.' : 'Fill in the details and submit.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {body}
          <div className="flex justify-between pt-2">
            <div className="space-x-2">
              {step === 'form' && (
                <Button variant="outline" onClick={() => { setStep('choose'); setCreateType(''); }}>Back</Button>
              )}
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={closeAll}>Cancel</Button>
              {step === 'form' && (
                <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Creating...' : 'Create'}</Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


