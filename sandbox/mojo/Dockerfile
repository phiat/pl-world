# Mojo 1.1.0 for the PL World sandbox, installed the way the Mojo docs recommend (a Python package from PyPI).
# `mojo-compiler` is the slim variant of the `mojo` package: the mojo CLI (compiler, `mojo run`/`mojo build`) and the
# precompiled standard library, without the LSP server, LLDB debugger and formatter. Base: Python 3.14 slim
# (Debian 13, glibc 2.41; the wheels need glibc >= 2.34).
FROM python:3.14-slim

# On Linux Mojo uses a C compiler as its linker driver (a documented system requirement), so `mojo build` needs gcc.
RUN apt-get update \
 && apt-get install -y --no-install-recommends gcc libc6-dev \
 && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/mojo \
 && /opt/mojo/bin/pip install --no-cache-dir mojo-compiler==1.1.0

# /opt/mojo/bin/mojo is a Python shim that sets these variables and execs the native driver. Setting them here and
# putting the driver itself on PATH saves a Python start-up (~30 ms) on every call.
# Telemetry is switched off (sandbox containers have no network anyway), and HOME=/tmp keeps the compile cache
# (~/.cache/modular) inside the tmpfs, so nothing is written outside /src and /tmp.
ENV MOJO_ROOT=/opt/mojo/lib/python3.14/site-packages/modular
ENV MODULAR_MAX_PACKAGE_ROOT=$MOJO_ROOT \
    MODULAR_MOJO_MAX_PACKAGE_ROOT=$MOJO_ROOT \
    MODULAR_MOJO_MAX_DRIVER_PATH=$MOJO_ROOT/bin/mojo \
    MODULAR_MOJO_MAX_IMPORT_PATH=$MOJO_ROOT/lib/mojo \
    PATH=$MOJO_ROOT/bin:$PATH \
    MODULAR_TELEMETRY_ENABLED=false \
    HOME=/tmp

# Smoke test: compile, link and run a program at build time, then leave /tmp empty.
RUN mojo --version \
 && printf 'def main():\n    print("mojo ok")\n' > /tmp/smoke.mojo \
 && mojo build -o /tmp/smoke /tmp/smoke.mojo && /tmp/smoke \
 && rm -rf /tmp/* /tmp/.cache

WORKDIR /src
