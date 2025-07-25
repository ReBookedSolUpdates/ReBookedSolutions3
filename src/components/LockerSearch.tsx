import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MapPin, 
  Search, 
  Filter, 
  Navigation, 
  Clock, 
  Phone, 
  Package,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { lockerService, LockerLocation, LockerSearchFilters } from '@/services/lockerService';
import { toast } from 'sonner';

interface LockerSearchProps {
  onLockerSelect?: (locker: LockerLocation) => void;
  showSelectionMode?: boolean;
  selectedLockerId?: string;
}

const LockerSearch: React.FC<LockerSearchProps> = ({
  onLockerSelect,
  showSelectionMode = false,
  selectedLockerId
}) => {
  const [lockers, setLockers] = useState<LockerLocation[]>([]);
  const [filteredLockers, setFilteredLockers] = useState<LockerLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [nearbyLockers, setNearbyLockers] = useState<Array<LockerLocation & {distance: number}>>([]);
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState<string | null>(null);

  // Get unique cities and provinces
  const { cities, provinces } = useMemo(() => {
    const cities = [...new Set(lockers.map(l => l.city))].sort();
    const provinces = [...new Set(lockers.map(l => l.province))].sort();
    return { cities, provinces };
  }, [lockers]);

  // Load lockers on component mount
  useEffect(() => {
    loadLockers();
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          console.log('📍 User location obtained:', position.coords);
        },
        (error) => {
          console.warn('⚠️ Could not get user location:', error.message);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    }
  }, []);

  // Filter lockers when search criteria change
  useEffect(() => {
    filterLockers();
  }, [lockers, searchQuery, selectedCity, selectedProvince]);

  // Get nearby lockers when user location changes
  useEffect(() => {
    if (userLocation && lockers.length > 0) {
      getNearbyLockers();
    }
  }, [userLocation, lockers, radiusKm]);

  const loadLockers = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading lockers...');
      
      const lockersData = await lockerService.getLockers(forceRefresh);
      setLockers(lockersData);
      
      if (lockersData.length === 0) {
        setError('No lockers found. Please try again later.');
      } else {
        toast.success(`Found ${lockersData.length} lockers in South Africa`);
      }
    } catch (err) {
      console.error('❌ Error loading lockers:', err);
      setError('Failed to load lockers. Please check your connection and try again.');
      toast.error('Failed to load lockers');
    } finally {
      setLoading(false);
    }
  };

  const filterLockers = async () => {
    const filters: LockerSearchFilters = {};

    if (searchQuery.trim()) filters.search_query = searchQuery;
    if (selectedCity && selectedCity !== 'all') filters.city = selectedCity;
    if (selectedProvince && selectedProvince !== 'all') filters.province = selectedProvince;

    try {
      const filtered = await lockerService.searchLockers(filters);
      setFilteredLockers(filtered);
    } catch (err) {
      console.error('❌ Error filtering lockers:', err);
      setFilteredLockers(lockers);
    }
  };

  const getNearbyLockers = async () => {
    if (!userLocation) return;

    try {
      const nearby = await lockerService.getNearbyLockers(
        userLocation.lat, 
        userLocation.lng, 
        radiusKm
      );
      setNearbyLockers(nearby);
    } catch (err) {
      console.error('❌ Error getting nearby lockers:', err);
    }
  };

  const handleLockerSelect = (locker: LockerLocation) => {
    if (onLockerSelect) {
      onLockerSelect(locker);
      toast.success(`Selected locker: ${locker.name}`);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCity('');
    setSelectedProvince('');
    setActiveTab('all');
  };

  const LockerCard = ({ 
    locker, 
    distance 
  }: { 
    locker: LockerLocation; 
    distance?: number; 
  }) => (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        selectedLockerId === locker.id ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => handleLockerSelect(locker)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              {locker.name}
              {selectedLockerId === locker.id && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{locker.address}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">{locker.city}</Badge>
              <Badge variant="outline">{locker.province}</Badge>
              {distance !== undefined && (
                <Badge variant="default">{distance.toFixed(1)}km away</Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm">
          {locker.opening_hours && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{locker.opening_hours}</span>
            </div>
          )}
          {locker.contact_number && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{locker.contact_number}</span>
            </div>
          )}
          {locker.available_slots !== undefined && locker.locker_capacity && (
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span>
                {locker.available_slots}/{locker.locker_capacity} slots available
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-2 ml-2">
                <div 
                  className={`h-2 rounded-full ${
                    (locker.available_slots / locker.locker_capacity) > 0.5 
                      ? 'bg-green-500' 
                      : (locker.available_slots / locker.locker_capacity) > 0.2 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                  }`}
                  style={{ 
                    width: `${(locker.available_slots / locker.locker_capacity) * 100}%` 
                  }}
                />
              </div>
            </div>
          )}
        </div>
        {showSelectionMode && (
          <Button 
            className="w-full mt-3" 
            variant={selectedLockerId === locker.id ? "default" : "outline"}
          >
            {selectedLockerId === locker.id ? 'Selected' : 'Select This Locker'}
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading lockers in South Africa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadLockers(true)}
            className="ml-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Find Lockers Near You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search by name, address, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger>
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedProvince} onValueChange={setSelectedProvince}>
              <SelectTrigger>
                <SelectValue placeholder="Select Province" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Provinces</SelectItem>
                {provinces.map(province => (
                  <SelectItem key={province} value={province}>{province}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
              <Button variant="outline" size="sm" onClick={() => loadLockers(true)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Found {filteredLockers.length} lockers
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">
            All Lockers ({filteredLockers.length})
          </TabsTrigger>
          <TabsTrigger value="nearby" disabled={!userLocation}>
            <Navigation className="w-4 h-4 mr-2" />
            Nearby ({nearbyLockers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredLockers.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No lockers found matching your search criteria. Try adjusting your filters.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLockers.map(locker => (
                <LockerCard key={locker.id} locker={locker} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="nearby" className="space-y-4">
          {!userLocation ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Enable location access to see nearby lockers.
              </AlertDescription>
            </Alert>
          ) : nearbyLockers.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No lockers found within {radiusKm}km of your location.
                <div className="mt-2">
                  <Select value={radiusKm.toString()} onValueChange={(v) => setRadiusKm(Number(v))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5km</SelectItem>
                      <SelectItem value="10">10km</SelectItem>
                      <SelectItem value="25">25km</SelectItem>
                      <SelectItem value="50">50km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Showing lockers within {radiusKm}km
                </p>
                <Select value={radiusKm.toString()} onValueChange={(v) => setRadiusKm(Number(v))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5km</SelectItem>
                    <SelectItem value="10">10km</SelectItem>
                    <SelectItem value="25">25km</SelectItem>
                    <SelectItem value="50">50km</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nearbyLockers.map(locker => (
                  <LockerCard 
                    key={locker.id} 
                    locker={locker} 
                    distance={locker.distance} 
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LockerSearch;
