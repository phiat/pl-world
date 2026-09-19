# Visual Basic (.NET) on the .NET 10 SDK. `dotnet run file.vb` does not exist (file-based apps are C#-only),
# so the image carries a console project that is restored and built here; sandbox runs have no network.
# `vb-run` copies the project to /tmp, installs the user's file as Program.vb, builds it and runs it.
FROM mcr.microsoft.com/dotnet/sdk:10.0
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_NOLOGO=1 DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1 \
    DOTNET_GENERATE_ASPNET_CERTIFICATE=false DOTNET_CLI_WORKLOAD_UPDATE_NOTIFY_DISABLE=1 \
    MSBUILDTERMINALLOGGER=off NuGetAudit=false
COPY vb-run /usr/local/bin/vb-run
COPY template/ /tmp/plw-vb/
# Restore and build at /tmp/plw-vb, the path vb-run copies the project back to at run time (the sandbox
# mounts a fresh tmpfs on /tmp), so the absolute paths recorded in obj/ still match; then park it in /opt.
RUN chmod 755 /usr/local/bin/vb-run \
 && cd /tmp/plw-vb \
 && dotnet restore \
 && dotnet msbuild -nologo -v:minimal -nodeReuse:false -p:UseSharedCompilation=false \
 && dotnet bin/plw.dll \
 && mv /tmp/plw-vb /opt/plw-vb \
 && rm -rf /tmp/* /root/.dotnet /root/.local/share/NuGet /root/.nuget
WORKDIR /src
