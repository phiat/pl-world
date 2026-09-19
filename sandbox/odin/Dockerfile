# Odin dev-2026-09 (the September 2026 monthly release), from the official x86_64 Linux tarball: a statically linked
# compiler with LLVM 20 built in, plus the base:, core: and vendor: library collections next to it.
# On Linux the compiler hands its object files to clang for linking (a documented release requirement), so the image
# adds Debian's clang. Odin has no telemetry; HOME and XDG_CACHE_HOME point into /tmp so any write lands in the tmpfs.
FROM debian:trixie-slim
ARG ODIN_VERSION=dev-2026-09
ARG ODIN_SHA256=167c3e1d7056419dad2e04bb3bd98715b7ff286d4c125f3c5a5ee337c6254283
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl clang \
 && curl -fsSL -o /tmp/odin.tar.gz \
      "https://github.com/odin-lang/Odin/releases/download/${ODIN_VERSION}/odin-linux-amd64-${ODIN_VERSION}.tar.gz" \
 && echo "${ODIN_SHA256}  /tmp/odin.tar.gz" | sha256sum -c - \
 && mkdir /opt/odin && tar xzf /tmp/odin.tar.gz -C /opt/odin --strip-components=1 --no-same-owner && rm /tmp/odin.tar.gz \
 && chmod -R a+rX /opt/odin \
 && apt-get purge -y curl && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*
ENV ODIN_ROOT=/opt/odin PATH=/opt/odin:$PATH HOME=/tmp XDG_CACHE_HOME=/tmp/.cache
# Smoke test: compile, link and run a program at build time, then leave /tmp empty.
RUN printf 'package main\nimport "core:fmt"\nmain :: proc() { fmt.println("odin ok") }\n' > /tmp/smoke.odin \
 && cd /tmp && odin build smoke.odin -file -out:/tmp/smoke && /tmp/smoke \
 && rm -rf /tmp/* /tmp/.cache
WORKDIR /src
