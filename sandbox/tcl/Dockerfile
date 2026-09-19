# Tcl 9.0.4 (26 June 2026), the current stable release, built from the official source distribution and checked
# against its sha256 (SourceForge's published md5 and sha1 for the file match too). There is no official Docker image,
# and Debian stable (trixie) packages 9.0.1; 9.0.4 is only in testing and unstable, whose versions are not pinnable.
# The full source distribution also builds the bundled packages: Thread, [incr Tcl], the SQLite extension and TDBC.
# Tcl links the system zlib (zlib1g, already part of the debian:trixie-slim base), as Debian's own package does.
# Tcl 9 attaches its script library to libtcl9.0.so as a zip archive (zipfs), so nothing is read from disk at startup.
# The core is built before the packages, whose configure scripts run the new, not yet installed tclsh (hence
# LD_LIBRARY_PATH; a single parallel `make` would configure them before tclsh exists). `make install-strip` fails on
# the sqlite3_analyzer script, so the binaries are installed unstripped.
# LANG selects UTF-8 for the standard channels: in the C locale Tcl 9 uses ISO 8859-1 and, because encoding errors
# are strict by default in 9.0, fails with an error on writing any character outside Latin-1.
FROM debian:trixie-slim AS build
ARG TCL_VERSION=9.0.4
ARG TCL_SHA256=d0aed49230bc02a65c1e0229e65f34590a4b037ec40d546f32573b467f7551ea
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl gcc make libc6-dev zlib1g-dev \
 && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL -o /tmp/tcl.tar.gz \
      "https://downloads.sourceforge.net/project/tcl/Tcl/${TCL_VERSION}/tcl${TCL_VERSION}-src.tar.gz" \
 && echo "${TCL_SHA256}  /tmp/tcl.tar.gz" | sha256sum -c - \
 && mkdir /tmp/tcl && tar xzf /tmp/tcl.tar.gz -C /tmp/tcl --strip-components=1 --no-same-owner \
 && cd /tmp/tcl/unix \
 && export LD_LIBRARY_PATH=/tmp/tcl/unix \
 && ./configure --prefix=/opt/tcl \
 && make -j"$(nproc)" binaries libraries \
 && make -j"$(nproc)" packages \
 && make install \
 && ln -s tclsh9.0 /opt/tcl/bin/tclsh \
 && rm -rf /opt/tcl/share/man

FROM debian:trixie-slim
COPY --from=build /opt/tcl /opt/tcl
ENV PATH=/opt/tcl/bin:$PATH LANG=C.UTF-8 HOME=/tmp
# Smoke test: the interpreter, its zipfs-mounted library and two bundled packages load.
RUN printf 'puts "tcl [info patchlevel] [package require Thread] [package require sqlite3]"\n' | tclsh
WORKDIR /src
