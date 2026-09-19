# LDC 1.43.0, the LLVM-based D compiler (DMD 2.113.0 frontend, druntime and Phobos; LLVM 22.1.8 built in), from the
# official x86_64 Linux release tarball, checked against the sha256 in ldc2-1.43.0.sha256sums.txt on the release page.
# There is no maintained official Docker image: the dlang2/ldc-ubuntu images stopped at LDC 1.26 (2021).
# LDC hands its object file to the system C compiler driver (`cc`) for linking, so the image adds Debian's gcc and
# libc6-dev. lib32 (the -m32 multilib runtime) is dropped. HOME points into /tmp; the compiler keeps no cache unless
# asked (-cache=…), so a compile writes only the object file and executable next to the source in /src.
FROM debian:trixie-slim
ARG LDC_VERSION=1.43.0
ARG LDC_SHA256=35805db60f47fd1a162b2035da84d96beec37e6d1e7b1edf60498a90acfaedce
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl xz-utils gcc libc6-dev \
 && curl -fsSL -o /tmp/ldc.tar.xz \
      "https://github.com/ldc-developers/ldc/releases/download/v${LDC_VERSION}/ldc2-${LDC_VERSION}-linux-x86_64.tar.xz" \
 && echo "${LDC_SHA256}  /tmp/ldc.tar.xz" | sha256sum -c - \
 && mkdir /opt/ldc && tar xJf /tmp/ldc.tar.xz -C /opt/ldc --strip-components=1 --no-same-owner && rm /tmp/ldc.tar.xz \
 && rm -rf /opt/ldc/lib32 && chmod -R a+rX /opt/ldc \
 && apt-get purge -y curl xz-utils && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*
ENV PATH=/opt/ldc/bin:$PATH HOME=/tmp
# Smoke test: compile, link and run a Phobos program at build time, then leave /tmp empty.
RUN printf 'import std.stdio;\nvoid main() { writeln("ldc ok"); }\n' > /tmp/smoke.d \
 && cd /tmp && ldc2 -g -of=/tmp/smoke smoke.d && /tmp/smoke \
 && rm -rf /tmp/* /tmp/.[!.]*
WORKDIR /src
