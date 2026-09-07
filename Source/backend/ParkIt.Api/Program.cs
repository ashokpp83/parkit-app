using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ParkIt.Api.Infrastructure;
using ParkIt.Application;
using ParkIt.Application.Abstractions;
using ParkIt.Infrastructure;
using ParkIt.Infrastructure.Auth;
using ParkIt.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Keep local development origins while allowing a single cloud-hosted PWA origin.
const string CorsPolicy = "spa";
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];
var configuredFrontendOrigin = builder.Configuration["FrontendOrigin"];
if (!string.IsNullOrWhiteSpace(configuredFrontendOrigin))
{
    allowedOrigins = [.. allowedOrigins, configuredFrontendOrigin];
}

builder.Services.AddCors(o => o.AddPolicy(CorsPolicy, p => p
    .WithOrigins([.. new[]
    {
        "http://localhost:4200",
        "http://localhost:4201",
        "http://localhost:4300",
        "http://localhost:8100",
        "https://localhost"
    }.Concat(allowedOrigins).Distinct()])
    .AllowAnyHeader()
    .AllowAnyMethod()));

// JWT auth using the same settings the token service signs with.
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtSettings>() ?? new JwtSettings();
if (!builder.Environment.IsDevelopment() &&
    (jwt.Key.StartsWith("dev-only-", StringComparison.OrdinalIgnoreCase) || jwt.Key.Length < 32))
{
    throw new InvalidOperationException("A strong Jwt:Key must be configured outside development.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key))
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ParkIt API", Version = "v1" });
    var scheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
    };
    c.AddSecurityDefinition("Bearer", scheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { [scheme] = Array.Empty<string>() });
});

var app = builder.Build();

// Apply migrations and seed demo data at startup.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await db.Database.EnsureCreatedAsync();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    await DbSeeder.SeedAsync(db, hasher);
}

app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(CorsPolicy);
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "ParkIt.Api" }));
app.MapControllers();

app.Run();
