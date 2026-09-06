using Microsoft.EntityFrameworkCore;
using ParkIt.Application.Abstractions;
using ParkIt.Domain.Entities;
using ParkIt.Domain.Enums;

namespace ParkIt.Infrastructure.Persistence;

/// <summary>Seeds demo data including owners, drivers, facilities, spaces, and bookings for testing.</summary>
public static class DbSeeder
{
    public static async Task SeedAsync(ApplicationDbContext db, IPasswordHasher hasher, CancellationToken ct = default)
    {
        if (await db.Users.AnyAsync(ct)) return;

        // Create users
        var driver1 = new User { FullName = "Rajesh Kumar", Email = "driver1@parkit.app", PhoneNumber = "+919000000001", PasswordHash = hasher.Hash("Passw0rd!"), Role = UserRole.Driver, PhoneVerified = true, Wallet = new Wallet { Balance = 500 } };
        var driver2 = new User { FullName = "Priya Sharma", Email = "driver2@parkit.app", PhoneNumber = "+919000000002", PasswordHash = hasher.Hash("Passw0rd!"), Role = UserRole.Driver, PhoneVerified = true, Wallet = new Wallet { Balance = 750 } };
        var driver3 = new User { FullName = "Amit Patel", Email = "driver3@parkit.app", PhoneNumber = "+919000000003", PasswordHash = hasher.Hash("Passw0rd!"), Role = UserRole.Driver, PhoneVerified = true, Wallet = new Wallet { Balance = 300 } };
        var driver4 = new User { FullName = "Neha Singh", Email = "driver4@parkit.app", PhoneNumber = "+919000000004", PasswordHash = hasher.Hash("Passw0rd!"), Role = UserRole.Driver, PhoneVerified = true, Wallet = new Wallet { Balance = 1000 } };
        var driver5 = new User { FullName = "Vikram Desai", Email = "driver5@parkit.app", PhoneNumber = "+919000000005", PasswordHash = hasher.Hash("Passw0rd!"), Role = UserRole.Driver, PhoneVerified = true, Wallet = new Wallet { Balance = 450 } };

        var owner = new User { FullName = "Demo Owner", Email = "owner@parkit.app", PhoneNumber = "+919000000100", PasswordHash = hasher.Hash("Passw0rd!"), Role = UserRole.Owner, KycStatus = KycStatus.Verified, PhoneVerified = true, Wallet = new Wallet() };
        var admin = new User { FullName = "Demo Admin", Email = "admin@parkit.app", PhoneNumber = "+919000000999", PasswordHash = hasher.Hash("Passw0rd!"), Role = UserRole.Admin, PhoneVerified = true, Wallet = new Wallet() };
        
        db.Users.AddRange(driver1, driver2, driver3, driver4, driver5, owner, admin);

        // Create vehicles
        db.Vehicles.Add(new Vehicle { UserId = driver1.Id, RegistrationNumber = "TN38AB1234", Type = VehicleType.Sedan, IsVerified = true });
        db.Vehicles.Add(new Vehicle { UserId = driver2.Id, RegistrationNumber = "TN38CD5678", Type = VehicleType.SUV, IsVerified = true });
        db.Vehicles.Add(new Vehicle { UserId = driver3.Id, RegistrationNumber = "TN38EF9012", Type = VehicleType.Sedan, IsVerified = true });
        db.Vehicles.Add(new Vehicle { UserId = driver4.Id, RegistrationNumber = "TN38GH3456", Type = VehicleType.SUV, IsVerified = true });
        db.Vehicles.Add(new Vehicle { UserId = driver5.Id, RegistrationNumber = "TN38IJ7890", Type = VehicleType.EV, IsVerified = true });

        // Create parking provider
        var provider = new ParkingProvider { OwnerUserId = owner.Id, ProviderType = ProviderType.Individual, BusinessName = "Chennai Parking Solutions", KycStatus = KycStatus.Verified, RevenueModel = RevenueModel.Commission };
        db.ParkingProviders.Add(provider);
        
        await db.SaveChangesAsync(ct);

        // Create multiple facilities
        var facility1 = new ParkingFacility
        {
            ProviderId = provider.Id,
            Name = "Anna Nagar Tower Parking",
            AddressText = "2nd Ave, Anna Nagar, Chennai",
            Latitude = 13.0850, Longitude = 80.2101,
            EntranceLatitude = 13.0851, EntranceLongitude = 80.2102,
            AccessInstructions = "Enter from 2nd Ave gate; press buzzer B2 for the lift.",
            IsApproved = true, HealthScore = 92
        };

        var facility2 = new ParkingFacility
        {
            ProviderId = provider.Id,
            Name = "Velachery Plaza Parking",
            AddressText = "Main St, Velachery, Chennai",
            Latitude = 12.9716, Longitude = 80.2200,
            EntranceLatitude = 12.9717, EntranceLongitude = 80.2201,
            AccessInstructions = "Enter from main entrance on Main St.",
            IsApproved = true, HealthScore = 88
        };

        var facility3 = new ParkingFacility
        {
            ProviderId = provider.Id,
            Name = "IT Corridor Business Hub Parking",
            AddressText = "Whitefield Rd, Chennai",
            Latitude = 13.0827, Longitude = 80.2700,
            EntranceLatitude = 13.0828, EntranceLongitude = 80.2701,
            AccessInstructions = "Access from north gate.",
            IsApproved = true, HealthScore = 95
        };

        db.ParkingFacilities.AddRange(facility1, facility2, facility3);

        // Create parking spaces
        var spaces = new List<ParkingSpace>();

        // Facility 1 spaces
        for (int i = 1; i <= 5; i++)
        {
            var space = new ParkingSpace
            {
                FacilityId = facility1.Id,
                Level = i <= 2 ? "B1" : "B2",
                SlotLabel = $"P-{i:D2}",
                Ownership = Ownership.Private,
                CostType = CostType.Paid,
                AccessType = AccessType.Reserved,
                CoveredType = CoveredType.Covered,
                MaxVehicleType = i == 2 ? VehicleType.EV : VehicleType.SUV,
                SecurityLevel = 4,
                VerificationStatus = VerificationStatus.Verified,
                CurrentStatus = SpaceStatus.Guaranteed
            };
            space.PricingRules.Add(new PricingRule { Unit = PricingUnit.Hour, BasePrice = i == 2 ? 60 : 40 });
            space.PricingRules.Add(new PricingRule { Unit = PricingUnit.Month, BasePrice = i == 2 ? 4500 : 3500 });
            space.Amenities.Add(new SpaceAmenity { Amenity = AmenityType.CCTV });
            space.Amenities.Add(new SpaceAmenity { Amenity = AmenityType.Gated });
            if (i == 2)
                space.Amenities.Add(new SpaceAmenity { Amenity = AmenityType.EVCharging });
            space.AvailabilityWindows.Add(new SpaceAvailability { StartTime = new TimeOnly(0, 0), EndTime = new TimeOnly(23, 59), IsRecurring = true });
            spaces.Add(space);
        }

        // Facility 2 spaces
        for (int i = 1; i <= 4; i++)
        {
            var space = new ParkingSpace
            {
                FacilityId = facility2.Id,
                Level = "G",
                SlotLabel = $"V-{i:D2}",
                Ownership = Ownership.Private,
                CostType = CostType.Paid,
                AccessType = AccessType.Reserved,
                CoveredType = CoveredType.Uncovered,
                MaxVehicleType = VehicleType.Sedan,
                SecurityLevel = 3,
                VerificationStatus = VerificationStatus.Verified,
                CurrentStatus = SpaceStatus.LikelyAvailable
            };
            space.PricingRules.Add(new PricingRule { Unit = PricingUnit.Hour, BasePrice = 30 });
            space.PricingRules.Add(new PricingRule { Unit = PricingUnit.Month, BasePrice = 2500 });
            space.Amenities.Add(new SpaceAmenity { Amenity = AmenityType.CCTV });
            space.AvailabilityWindows.Add(new SpaceAvailability { StartTime = new TimeOnly(0, 0), EndTime = new TimeOnly(23, 59), IsRecurring = true });
            spaces.Add(space);
        }

        // Facility 3 spaces
        for (int i = 1; i <= 6; i++)
        {
            var space = new ParkingSpace
            {
                FacilityId = facility3.Id,
                Level = i <= 3 ? "L1" : "L2",
                SlotLabel = $"IT-{i:D2}",
                Ownership = Ownership.Private,
                CostType = CostType.Paid,
                AccessType = AccessType.Reserved,
                CoveredType = CoveredType.Covered,
                MaxVehicleType = VehicleType.SUV,
                SecurityLevel = 5,
                VerificationStatus = VerificationStatus.Verified,
                CurrentStatus = SpaceStatus.Guaranteed
            };
            space.PricingRules.Add(new PricingRule { Unit = PricingUnit.Hour, BasePrice = 50 });
            space.PricingRules.Add(new PricingRule { Unit = PricingUnit.Month, BasePrice = 4000 });
            space.Amenities.Add(new SpaceAmenity { Amenity = AmenityType.CCTV });
            space.Amenities.Add(new SpaceAmenity { Amenity = AmenityType.Gated });
            space.Amenities.Add(new SpaceAmenity { Amenity = AmenityType.Lift });
            space.AvailabilityWindows.Add(new SpaceAvailability { StartTime = new TimeOnly(0, 0), EndTime = new TimeOnly(23, 59), IsRecurring = true });
            spaces.Add(space);
        }

        db.ParkingSpaces.AddRange(spaces);
        await db.SaveChangesAsync(ct);

        // Create sample bookings with various dates and times to populate dashboard
        var bookings = new List<Booking>();
        var now = DateTime.UtcNow;
        var random = new Random();

        // Generate bookings across last 60 days
        for (int dayOffset = -60; dayOffset <= -1; dayOffset++)
        {
            var bookingDate = now.AddDays(dayOffset);

            // Multiple bookings per day at different hours and by different drivers
            for (int i = 0; i < 3; i++)
            {
                var space = spaces[random.Next(spaces.Count)];
                var driver = new[] { driver1, driver2, driver3, driver4, driver5 }[random.Next(5)];
                var vehicle = new[] { driver1, driver2, driver3, driver4, driver5 }
                    .Select(d => db.Vehicles.FirstOrDefault(v => v.UserId == d.Id))
                    .Where(v => v != null)
                    .OrderBy(_ => random.Next())
                    .First();
                var hour = random.Next(6, 22);
                var duration = random.Next(1, 6);

                var booking = new Booking
                {
                    SpaceId = space.Id,
                    DriverUserId = driver.Id,
                    VehicleId = vehicle!.Id,
                    StartTime = bookingDate.Date.AddHours(hour),
                    EndTime = bookingDate.Date.AddHours(hour + duration),
                    Amount = random.Next(300, 2000),
                    Status = BookingStatus.Completed,
                    IsGuaranteed = true
                };
                bookings.Add(booking);
            }
        }

        // Add some future bookings for today and tomorrow
        for (int i = 0; i < 5; i++)
        {
            var space = spaces[random.Next(spaces.Count)];
            var driver = new[] { driver1, driver2, driver3, driver4, driver5 }[random.Next(5)];
            var vehicle = new[] { driver1, driver2, driver3, driver4, driver5 }
                .Select(d => db.Vehicles.FirstOrDefault(v => v.UserId == d.Id))
                .Where(v => v != null)
                .OrderBy(_ => random.Next())
                .First();
            var hour = random.Next(6, 22);
            var duration = random.Next(1, 6);

            var booking = new Booking
            {
                SpaceId = space.Id,
                DriverUserId = driver.Id,
                VehicleId = vehicle!.Id,
                StartTime = now.Date.AddHours(hour),
                EndTime = now.Date.AddHours(hour + duration),
                Amount = random.Next(300, 2000),
                Status = BookingStatus.Confirmed,
                IsGuaranteed = true
            };
            bookings.Add(booking);
        }

        db.Bookings.AddRange(bookings);
        await db.SaveChangesAsync(ct);
    }
}
