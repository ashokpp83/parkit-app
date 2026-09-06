FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["ParkIt.Api/ParkIt.Api.csproj", "ParkIt.Api/"]
COPY ["ParkIt.Application/ParkIt.Application.csproj", "ParkIt.Application/"]
COPY ["ParkIt.Domain/ParkIt.Domain.csproj", "ParkIt.Domain/"]
COPY ["ParkIt.Infrastructure/ParkIt.Infrastructure.csproj", "ParkIt.Infrastructure/"]
RUN dotnet restore "ParkIt.Api/ParkIt.Api.csproj"

COPY . .
WORKDIR "/src/ParkIt.Api"
RUN dotnet publish "ParkIt.Api.csproj" -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ParkIt.Api.dll"]
