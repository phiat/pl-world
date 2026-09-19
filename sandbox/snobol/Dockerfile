# SNOBOL4 on CSNOBOL4 2.3.4 (24 April 2026), Phil Budne's BSD-licensed port of Macro SNOBOL4, the original Bell Labs
# implementation written in SIL (the SNOBOL4 Implementation Language), to C. It runs the full SNOBOL4 language of the
# 1971 "Green Book" plus the SPITBOL and SNOBOL4B (Blocks) extensions.
#
# The release tarball from ftp.regressive.org (the project's download area, linked from regressive.org/snobol4/csnobol4)
# is pinned by SHA-256. Upstream publishes no checksum, so the hash was recorded from the download; the tarball's
# hand-written sources are byte-identical to the REL_2_3_4 tag of github.com/philbudne/csnobol4, and it adds the C that
# SNOBOL4 programs (genc.sno, gendata.sno, gensyn.sno) generate from v311.sil, so no SNOBOL4 is needed to bootstrap.
#
# `make install_notiming` builds the interpreter, runs its regression suite and installs it, skipping only the timing
# benchmark. Loadable extension modules (FFI, SQLite, sockets and so on) and readline are left out, so the interpreter
# needs nothing beyond libc and libm; the SNOBOL4 source libraries in lib/snobol4 (for -INCLUDE) are kept.
FROM debian:trixie-slim AS build
ARG CSNOBOL4_VERSION=2.3.4
ARG CSNOBOL4_SHA256=702f73b4107438bd251ebc253d335994f37bb40379242360d876e2de6dc03f78
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl gcc libc6-dev make m4 \
 && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL -A 'pl-world-build/0.1' -o /tmp/snobol4.tar.gz \
      "https://ftp.regressive.org/snobol4/snobol4-${CSNOBOL4_VERSION}.tar.gz" \
 && echo "${CSNOBOL4_SHA256}  /tmp/snobol4.tar.gz" | sha256sum -c - \
 && tar xzf /tmp/snobol4.tar.gz -C /tmp --no-same-owner \
 && cd "/tmp/snobol4-${CSNOBOL4_VERSION}" \
 && ./configure --prefix=/usr/local --without-modules --without-readline --without-docs \
 && { make install_notiming > /tmp/build.log 2>&1 || { tail -60 /tmp/build.log; exit 1; }; } \
 && grep -q 'Passed regression tests' /tmp/build.log \
 && rm -rf /usr/local/share/man

FROM debian:trixie-slim
COPY --from=build /usr/local/bin/ /usr/local/bin/
COPY --from=build /usr/local/lib/snobol4/ /usr/local/lib/snobol4/
# Smoke test: a defined function, a pattern with conditional assignment and a :S/:F goto, run with stdin at EOF.
RUN printf '%s\n' \
      "        DEFINE('TWICE(N)')                :(TWICE_END)" \
      "TWICE   TWICE = N * 2                     :(RETURN)" \
      "TWICE_END" \
      "        'snobol ok' BREAK(' ') . W        :F(END)" \
      "        OUTPUT = W ' ' TWICE(21)" \
      "END" > /tmp/smoke.sno \
 && snobol4 /tmp/smoke.sno < /dev/null | grep -qx 'snobol 42' \
 && rm -rf /tmp/* /tmp/.[!.]*
WORKDIR /src
