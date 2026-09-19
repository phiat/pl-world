# Icon 9.5.25a (September 2025, public domain), the University of Arizona reference implementation, built from the
# v9.5.25a tag of its official repository (github.com/gtownsend/icon, commit 876c587), pinned by SHA-256. The Icon
# Project's download page points to that repository; there are no release tarballs, so the tag archive is used.
# `make Configure name=linux` selects the build without X11 graphics, and `make` builds the translator/linker icont,
# the interpreter iconx and the Icon Program Library (IPL), whose ucode files land in lib/ so `link` finds them.
# The build's own test suite (make Test) must pass before installing into /opt/icon.
#
# A program is compiled with `icont -s -o OUT FILE`, which translates FILE to ucode and links it into an icode file
# OUT (a short /bin/sh header that execs iconx, followed by the bytecode). icont writes its intermediate .u1/.u2
# files next to the source and deletes them after linking, so nothing is written outside /src. No C compiler is
# needed at run time. Icon has no telemetry.
FROM debian:trixie-slim AS build
ARG ICON_VERSION=9.5.25a
ARG ICON_SHA256=ab15b7fc5a96e8b4da1b76cc6c7935400879f8a54b0fcf94a947c02815f21006
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl gcc libc6-dev make
RUN curl -fsSL -A 'pl-world-build/0.1' -o /tmp/icon.tar.gz \
      "https://github.com/gtownsend/icon/archive/refs/tags/v${ICON_VERSION}.tar.gz" \
 && echo "${ICON_SHA256}  /tmp/icon.tar.gz" | sha256sum -c - \
 && tar xzf /tmp/icon.tar.gz -C /tmp \
 && cd /tmp/icon-${ICON_VERSION} \
 && make Configure name=linux \
 && make \
 && { make Test > /tmp/test.log 2>&1 || { tail -40 /tmp/test.log; exit 1; }; } \
 && grep -q 'All tests passed' /tmp/test.log \
 && make Install dest=/opt/icon \
 && strip /opt/icon/bin/icont /opt/icon/bin/iconx

FROM debian:trixie-slim
COPY --from=build /opt/icon /opt/icon
ENV PATH=/opt/icon/bin:$PATH HOME=/tmp
# Smoke test through the sandbox path: a generator, string scanning and a linked IPL procedure, then leave /tmp empty.
RUN mkdir /tmp/smoke && cd /tmp/smoke \
 && printf 'link numbers\nprocedure main()\n  every writes(1 to 3, " ")\n  "icon ok" ? write(tab(upto(" ")), " ", gcd(12, 18))\nend\n' > smoke.icn \
 && icont -s -o smoke smoke.icn && [ "$(./smoke </dev/null)" = "1 2 3 icon 6" ] \
 && cd / && rm -rf /tmp/* /tmp/.[!.]*
WORKDIR /src
