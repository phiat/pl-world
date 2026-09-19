# Open Dylan 2026.2, the official x86_64 Linux binary release (the compiler, prebuilt libraries, and a bundled
# LLVM/Clang, BDW GC and libunwind). Clang still needs the C runtime startup files and a linker from the base system.
# `dylan-run --prepare` compiles a template project with the Dylan Playground's standard imports into
# /opt/plw-dylan/_build, so a sandbox run only compiles the user's library. HOME=/tmp keeps every write in the
# sandbox tmpfs.
FROM debian:trixie-slim
ARG OD_VERSION=2026.2
ARG OD_SHA256=d917efed6d82aae3a31746eee0a46e8095a898d183d730ad8198961b5efa2197
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl bzip2 binutils libc6-dev libgcc-14-dev \
 && curl -fsSL -o /tmp/od.tar.bz2 \
      "https://github.com/dylan-lang/opendylan/releases/download/v${OD_VERSION}.0/opendylan-${OD_VERSION}-x86_64-linux.tar.bz2" \
 && echo "${OD_SHA256}  /tmp/od.tar.bz2" | sha256sum -c - \
 && tar xjf /tmp/od.tar.bz2 -C /opt --no-same-owner && rm /tmp/od.tar.bz2 \
 && chmod -R a+rX /opt/opendylan-${OD_VERSION} \
 && apt-get purge -y curl bzip2 && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*
ENV PATH=/opt/opendylan-${OD_VERSION}/bin:$PATH HOME=/tmp
COPY dylan-run /usr/local/bin/dylan-run
RUN chmod 755 /usr/local/bin/dylan-run && dylan-run --prepare && chmod -R a+rX /opt/plw-dylan
WORKDIR /src
