# Critical Mass Modula-3 (cm3) 5.12.0, from the prebuilt AMD64_LINUX .deb attached to the modula3/cm3
# d5.12.0 release (checksum-verified). It installs to /usr/local/cm3: the cm3 driver, cm3cg (the GCC-based
# code generator) and the m3core and libm3 packages. cm3 assembles with `as` and links through gcc with
# -fuse-ld=gold (set in its Linux.common config), so gcc, binutils and binutils-gold stay in the image.
# cm3 builds packages (a directory with src/m3makefile), so `m3-run` copies the template package in
# /opt/plw-m3 to /tmp and builds the user's file there; sandbox runs have no network.
FROM debian:trixie-slim
ARG CM3_VERSION=5.12.0
ARG CM3_SHA256=e45a61ac5cd48aa5dac6517ddffab0db47c8804b1bb5bbfcca5be58dd300a5c5
RUN apt-get update && apt-get install -y --no-install-recommends gcc libc6-dev binutils binutils-gold curl ca-certificates \
 && curl -fsSL -o /tmp/cm3.deb "https://github.com/modula3/cm3/releases/download/d${CM3_VERSION}/cm3_${CM3_VERSION}_amd64.deb" \
 && echo "${CM3_SHA256}  /tmp/cm3.deb" | sha256sum -c - \
 && apt-get install -y --no-install-recommends /tmp/cm3.deb \
 && chmod -R o-w /usr/local/cm3 \
 && rm -f /tmp/cm3.deb \
 && apt-get purge -y curl ca-certificates && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*
ENV PATH=/usr/local/cm3/bin:$PATH
COPY template/ /opt/plw-m3/
COPY m3-run /usr/local/bin/m3-run
# Smoke test: build and run the template the way a sandbox run does, then leave /tmp empty.
RUN chmod 755 /usr/local/bin/m3-run \
 && test "$(m3-run /opt/plw-m3/src/Main.m3)" = warm \
 && rm -rf /tmp/*
WORKDIR /src
