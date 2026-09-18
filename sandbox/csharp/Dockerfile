FROM mcr.microsoft.com/dotnet/sdk:10.0
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_NOLOGO=1 NuGetAudit=false
# Warm the NuGet cache so file-based `dotnet run app.cs` can restore offline.
RUN mkdir /warm && cd /warm && echo 'Console.WriteLine("warm");' > warm.cs && dotnet run warm.cs && rm -rf /warm
WORKDIR /src
