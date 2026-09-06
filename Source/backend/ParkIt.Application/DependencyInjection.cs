using Microsoft.Extensions.DependencyInjection;
using ParkIt.Application.Services;

namespace ParkIt.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<AuthService>();
        services.AddScoped<VehicleService>();
        services.AddScoped<ParkingService>();
        services.AddScoped<BookingService>();
        return services;
    }
}
