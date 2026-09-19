# Logo on UCBLogo (Berkeley Logo) 6.2.5 (February 2025, GPLv3): the release tarball from the maintained
# repository (github.com/jrincayc/ucblogo-code), pinned by SHA-256 and built from source without graphics.
# --disable-wx (and the default --disable-x11) select nographics.c and the plain terminal front end; Debian's
# ucblogo package is the wxWidgets build and pulls in GTK. automake still links with g++. nographics.patch
# fixes two bugs of the headless build (a heap overflow on the first FORWARD, and headings never reduced
# modulo 360), as upstream pull requests #247 and #242 do. Turtle commands keep track of the turtle's
# position and heading, but nothing is drawn.
#
# `logo-run FILE` loads FILE through run.lg and exits: no banner, prompt or farewell on stdout, and an
# error that stops the program goes to stderr with exit status 1. HOME=/tmp keeps UCBLogo's lookup of
# a startup file inside the sandbox tmpfs.
FROM debian:trixie-slim AS build
ARG UCBLOGO_VERSION=6.2.5
ARG UCBLOGO_SHA256=8f4033a79c95efd0d4d2fb257b1f45dd7ba33cf7a2c8d942c29b5467ce31a4fa
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl gcc g++ make patch libncurses-dev
COPY nographics.patch /tmp/nographics.patch
RUN curl -fsSL -A 'pl-world-build/0.1' -o /tmp/ucblogo.tar.gz \
      "https://github.com/jrincayc/ucblogo-code/releases/download/version_${UCBLOGO_VERSION}/ucblogo-${UCBLOGO_VERSION}.tar.gz" \
 && echo "${UCBLOGO_SHA256}  /tmp/ucblogo.tar.gz" | sha256sum -c - \
 && tar xzf /tmp/ucblogo.tar.gz -C /tmp \
 && cd /tmp/ucblogo-${UCBLOGO_VERSION} \
 && patch -p1 < /tmp/nographics.patch \
 && ./configure --prefix=/usr/local --disable-wx --disable-x11 --disable-docs \
 && make -j"$(nproc)" && make install-strip

FROM debian:trixie-slim
COPY --from=build /usr/local/bin/ucblogo /usr/local/bin/ucblogo
COPY --from=build /usr/local/share/ucblogo /usr/local/share/ucblogo
COPY run.lg /opt/plw-logo/run.lg
COPY logo-run /usr/local/bin/logo-run
RUN chmod 644 /opt/plw-logo/run.lg && chmod 755 /usr/local/bin/logo-run
ENV HOME=/tmp
WORKDIR /src
