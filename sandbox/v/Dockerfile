# V 0.5.2 (12 July 2026) from the official x86_64 Linux release zip, sha256-checked. The zip holds a prebuilt `v`
# compiler, the full vlib, and V's bundled TinyCC (thirdparty/tcc) with a prebuilt Boehm GC (libgc.a), so the default
# debug build needs no gcc or clang: `v` emits C and tcc compiles and links it, in well under a second. tcc still needs
# the glibc headers and crt objects, hence libc6-dev.
# The official thevlang/vlang image only has rolling tags (latest/alpine/debian), so it cannot be pinned to a release.
# `v` has no telemetry and never checks for updates on its own; only explicit `v up`, `v install` and friends go
# online. HOME and VMODULES point into /tmp, so the module cache (VMODULES/.cache, i.e. VCACHE) and the generated C
# files (/tmp/v_<uid>) land in the sandbox's tmpfs and a build works on a read-only root filesystem.
FROM debian:trixie-slim
ARG V_VERSION=0.5.2
ARG V_SHA256=86caf9e70c3342d48ef19eb4f6c47b709f18c90ae86255520d5c29df6b482e23
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl unzip libc6-dev \
 && curl -fsSL -o /tmp/v.zip "https://github.com/vlang/v/releases/download/${V_VERSION}/v_linux.zip" \
 && echo "${V_SHA256}  /tmp/v.zip" | sha256sum -c - \
 && unzip -q /tmp/v.zip -d /opt && rm /tmp/v.zip \
 && chmod -R a+rX /opt/v \
 && apt-get purge -y curl unzip && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*
ENV PATH=/opt/v:$PATH HOME=/tmp VMODULES=/tmp/.vmodules
# Smoke test: compile, link and run a program at build time, then leave /tmp empty. There is nothing to pre-warm:
# V compiles the whole program (vlib included) to one C file per build, and the tcc path links the prebuilt libgc.a.
RUN printf "fn main() {\n\tprintln('v ok')\n}\n" > /tmp/smoke.v \
 && cd /tmp && v -o /tmp/smoke smoke.v && /tmp/smoke \
 && rm -rf /tmp/* /tmp/.vmodules
WORKDIR /src
