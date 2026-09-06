// TypeScript mirrors of the .NET API DTOs. Enum numeric values match the C# enum order.

export enum UserRole { Driver = 0, Owner = 1, Operator = 2, Admin = 3, Attendant = 4 }
export enum CostType { Free = 0, Paid = 1 }
export enum SpaceStatus { Guaranteed = 0, LikelyAvailable = 1, Full = 2 }
export enum VehicleType { Hatchback = 0, Sedan = 1, SUV = 2, MUV = 3, Luxury = 4, EV = 5, Commercial = 6, TwoWheeler = 7 }
export enum PaymentMethod { UPI = 0, Card = 1, Wallet = 2, Cash = 3, FASTag = 4 }
export enum PaymentStatus { Pending = 0, Held = 1, Captured = 2, Refunded = 3, PartialRefund = 4, Failed = 5 }

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  kycStatus: number;
  phoneVerified: boolean;
  reliabilityScore: number;
  preferredLanguage: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  user: UserDto;
}

export interface VehicleDto {
  id: string;
  registrationNumber: string;
  type: VehicleType;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  isVerified: boolean;
}

export interface UpsertVehicleRequest {
  registrationNumber: string;
  type: VehicleType;
  length?: number | null;
  width?: number | null;
  height?: number | null;
}

export interface SpaceSearchResult {
  spaceId: string;
  facilityId: string;
  facilityName: string;
  addressText: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  level?: string | null;
  slotLabel?: string | null;
  costType: CostType;
  hourlyPrice?: number | null;
  status: SpaceStatus;
  securityLevel: number;
  verificationStatus: number;
  amenities: number[];
  facilityAvailableSlots: number;
  facilityTotalSlots: number;
}

export interface FacilityCreateRequest {
  name: string;
  addressText: string;
  latitude: number;
  longitude: number;
  accessInstructions?: string | null;
  businessName?: string | null;
  level?: string | null;
  slotLabel?: string | null;
  maxVehicleType: VehicleType;
  totalSlots: number;
  availableSlots: number;
  costType: CostType;
  hourlyPrice?: number | null;
  securityLevel: number;
  covered: boolean;
  gated: boolean;
  cctv: boolean;
  evCharging: boolean;
  lift: boolean;
  handicappedAccess: boolean;
  guard: boolean;
  wellLit: boolean;
  twoWheeler: boolean;
  is24x7: boolean;
}

export interface FacilitySummaryDto {
  id: string;
  name: string;
  addressText: string;
  latitude: number;
  longitude: number;
  accessInstructions?: string | null;
  level?: string | null;
  slotLabel?: string | null;
  costType: CostType;
  hourlyPrice?: number | null;
  securityLevel: number;
  covered: boolean;
  gated: boolean;
  cctv: boolean;
  evCharging: boolean;
  lift: boolean;
  handicappedAccess: boolean;
  guard: boolean;
  wellLit: boolean;
  twoWheeler: boolean;
  is24x7: boolean;
  isApproved: boolean;
  availableSlots: number;
  totalSlots: number;
  maxVehicleType: VehicleType;
}

export interface FacilitySpaceDto {
  spaceId: string;
  level?: string | null;
  slotLabel?: string | null;
  maxVehicleType: VehicleType;
  costType: CostType;
  hourlyPrice?: number | null;
  status: SpaceStatus;
  amenities: number[];
  pricing: { unit: number; basePrice: number; suggestedPrice?: number | null }[];
}

export interface FacilityDetailDto {
  id: string;
  name: string;
  addressText: string;
  latitude: number;
  longitude: number;
  accessInstructions?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhoneNumber?: string | null;
  isApproved: boolean;
  availableSlots: number;
  totalSlots: number;
  spaces: FacilitySpaceDto[];
  photos: FacilityPhotoDto[];
}

export interface FacilityPhotoDto {
  id: string;
  facilityId: string;
  fileName: string;
  blobUrl: string;
  displayOrder: number;
}

export interface SpaceAvailabilityWindowDto {
  dayOfWeek?: number | null;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
}

export interface SpaceAvailabilityDto {
  spaceId: string;
  status: SpaceStatus;
  windows: SpaceAvailabilityWindowDto[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface BookingDto {
  id: string;
  spaceId: string;
  facilityName: string;
  slotLabel?: string | null;
  vehicleId: string;
  vehicleRegistration: string;
  startTime: string;
  endTime: string;
  status: number;
  isGuaranteed: boolean;
  amount: number;
  graceExpiresAt?: string | null;
  qrToken?: string | null;
  driverName?: string | null;
  driverEmail?: string | null;
  driverPhoneNumber?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhoneNumber?: string | null;
  paymentStatus?: PaymentStatus | null;
  paymentMethod?: PaymentMethod | null;
  paymentReference?: string | null;
}

// Dashboard Statistics
export interface RevenueByCustomerDto {
  customerName: string;
  customerEmail: string;
  bookingCount: number;
  totalRevenue: number;
  lastBookingDate: string;
}

export interface RevenueByFacilityDto {
  facilityId: string;
  facilityName: string;
  bookingCount: number;
  totalRevenue: number;
  averageRevenuePerBooking: number;
}

export interface OccupancyByHourDto {
  hour: number;
  totalSlots: number;
  occupiedSlots: number;
  occupancyPercentage: number;
}

export interface CustomerStickinessDto {
  customerName: string;
  customerEmail: string;
  totalBookings: number;
  uniqueFacilities: number;
  firstBookingDate: string;
  lastBookingDate: string;
  daysSinceLastBooking: number;
  stickinessScore: number;
}

export interface OwnerDashboardStatisticsDto {
  totalRevenue: number;
  totalBookings: number;
  averageRevenuePerBooking: number;
  topCustomers: RevenueByCustomerDto[];
  revenueByFacility: RevenueByFacilityDto[];
  occupancyByHour: OccupancyByHourDto[];
  customerStickiness: CustomerStickinessDto[];
}
