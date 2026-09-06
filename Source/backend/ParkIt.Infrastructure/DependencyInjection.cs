using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ParkIt.Application.Abstractions;
using ParkIt.Infrastructure.Auth;
using ParkIt.Infrastructure.Persistence;

namespace ParkIt.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        var connectionString = config.GetConnectionString("Default");
        services.AddDbContext<ApplicationDbContext>(options =>
        {
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                options.UseInMemoryDatabase("ParkItDb");
                return;
            }

            options.UseNpgsql(connectionString);
        });
        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());

        services.Configure<JwtSettings>(config.GetSection("Jwt"));
        services.AddSingleton<ITokenService, TokenService>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        return services;
    }
}
