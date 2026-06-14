# syntax=docker/dockerfile:1.7

# -----------------------------------------------------------------------------
# Stage 1 — Build the React SPA (Vite production output → /web/dist).
# -----------------------------------------------------------------------------
FROM node:24-alpine AS web-build
WORKDIR /web
COPY src/SapAssistant.Web/package.json src/SapAssistant.Web/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY src/SapAssistant.Web/ ./
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2 — Restore + publish the .NET API to /publish.
# -----------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS api-build
WORKDIR /src

COPY Directory.Build.props ./
COPY SapAssistant.sln ./
COPY src/SapAssistant.ServiceDefaults/SapAssistant.ServiceDefaults.csproj src/SapAssistant.ServiceDefaults/
COPY src/SapAssistant.Api/SapAssistant.Api.csproj src/SapAssistant.Api/

# AppHost + Web + Tests aren't needed for the runtime image — restore only what we ship.
RUN dotnet restore src/SapAssistant.Api/SapAssistant.Api.csproj

COPY src/SapAssistant.ServiceDefaults/ src/SapAssistant.ServiceDefaults/
COPY src/SapAssistant.Api/             src/SapAssistant.Api/

RUN dotnet publish src/SapAssistant.Api/SapAssistant.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /publish \
    /p:UseAppHost=false

# -----------------------------------------------------------------------------
# Stage 3 — Minimal ASP.NET runtime image.
# -----------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# OpenSSL + ca-certificates already in the base image; nothing extra needed.

COPY --from=api-build /publish ./
COPY --from=web-build /web/dist ./wwwroot

ENV ASPNETCORE_URLS=http://+:8080 \
    DOTNET_RUNNING_IN_CONTAINER=true \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

EXPOSE 8080

# Run as the built-in non-root user shipped in the .NET image.
USER app

ENTRYPOINT ["dotnet", "SapAssistant.Api.dll"]
