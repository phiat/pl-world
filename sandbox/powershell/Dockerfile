# PowerShell 7.6 (LTS) on Linux: Microsoft's self-contained release build, on Microsoft's .NET runtime-deps
# image (Ubuntu 24.04 plus ICU, OpenSSL and the other native libraries .NET needs).
#
# Why not a stock image: the PowerShell team stopped publishing mcr.microsoft.com/powershell in 2025 (7.5 was the
# last), and its official replacement, the .NET SDK image (mcr.microsoft.com/dotnet/sdk:10.0.401-noble carries
# pwsh 7.6.6), installs pwsh as a .NET global tool whose assemblies are IL-only, so the whole engine is
# JIT-compiled at every start. The release tarball is ReadyToRun-precompiled: each run starts ~150 ms sooner,
# from an image about a third the size.
#
# Also: telemetry and update checks are off; NO_COLOR keeps ANSI colour codes out of error messages; pwsh's XDG
# cache, config and data directories are moved off /root, because pwsh creates them at startup and aborts under a
# read-only root filesystem; and a warm-up run bakes the startup JIT profile (StartupProfileData-NonInteractive)
# into /opt/pwsh-cache, which every run replays. The cache is read-only, so runs (as root, but with every
# capability dropped) do not rewrite it on exit.
FROM mcr.microsoft.com/dotnet/runtime-deps:10.0.12-noble AS fetch
ARG PS_VERSION=7.6.6
ARG PS_SHA256=ddbc4a2d113bbd46d283cfedcbcd117a70caefd7673f41f2b4e0000badf103bc
ADD https://github.com/PowerShell/PowerShell/releases/download/v${PS_VERSION}/powershell-${PS_VERSION}-linux-x64.tar.gz /tmp/powershell.tar.gz
RUN echo "${PS_SHA256}  /tmp/powershell.tar.gz" | sha256sum -c - \
 && mkdir -p /opt/microsoft/powershell/7 \
 && tar -xzf /tmp/powershell.tar.gz -C /opt/microsoft/powershell/7 --no-same-owner \
 && chmod -R a+rX /opt/microsoft/powershell/7 \
 && chmod 755 /opt/microsoft/powershell/7/pwsh

# The tarball stays in the fetch stage; only the unpacked release is copied.
FROM mcr.microsoft.com/dotnet/runtime-deps:10.0.12-noble
COPY --from=fetch /opt/microsoft/powershell/7 /opt/microsoft/powershell/7
RUN ln -s /opt/microsoft/powershell/7/pwsh /usr/bin/pwsh
ENV POWERSHELL_TELEMETRY_OPTOUT=1 POWERSHELL_UPDATECHECK=Off NO_COLOR=1 \
    XDG_CACHE_HOME=/opt/pwsh-cache XDG_CONFIG_HOME=/tmp/.config XDG_DATA_HOME=/tmp/.local/share
COPY warmup.ps1 /opt/pwsh-warmup.ps1
RUN pwsh -NoLogo -NoProfile -NonInteractive -File /opt/pwsh-warmup.ps1 > /dev/null \
 && pwsh -NoLogo -NoProfile -NonInteractive -File /opt/pwsh-warmup.ps1 > /dev/null \
 && test -s /opt/pwsh-cache/powershell/StartupProfileData-NonInteractive \
 && chmod -R a+rX,a-w /opt/pwsh-cache /opt/pwsh-warmup.ps1 \
 && rm -rf /tmp/* /tmp/.config /tmp/.local
WORKDIR /src
