# OBNC 0.17.2 by Karl Landström: an Oberon-07 (Revision 2016) to C compiler.
# The build tool `obnc` translates each module to C and compiles/links it with the host gcc,
# so gcc and the Boehm GC stay in the image. SDL is left out, so the graphical Input and
# XYplane modules are skipped; Out, In, Files, Math, Strings and the ext* modules are installed.
FROM debian:trixie-slim
ARG OBNC_VERSION=0.17.2
ARG OBNC_SHA256=f672663e295df6daba53ac59a0280011732b0e7f95078d7944aa8c328b5f47ec
RUN apt-get update && apt-get install -y --no-install-recommends gcc libc6-dev libgc-dev curl ca-certificates \
 && cd /tmp && curl -fsSL -o obnc.tar.gz "https://miasap.se/obnc/downloads/obnc_${OBNC_VERSION}.tar.gz" \
 && echo "${OBNC_SHA256}  obnc.tar.gz" | sha256sum -c - \
 && tar xzf obnc.tar.gz && cd "obnc-${OBNC_VERSION}" \
 && ./build --prefix=/usr/local && ./install \
 && cd / && rm -rf /tmp/obnc* \
 && apt-get purge -y curl ca-certificates && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*
COPY obnc-build /usr/local/bin/obnc-build
RUN chmod +x /usr/local/bin/obnc-build
WORKDIR /src
