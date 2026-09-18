FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends gcc libc6-dev make && rm -rf /var/lib/apt/lists/*
ADD https://ftp.gnu.org/gnu/cim/cim-5.1.tar.gz /tmp/
RUN cd /tmp && tar xzf cim-5.1.tar.gz && cd cim-5.1 \
 && sed -i 's|#include "../../lib/cim.h"|#include "cim.h"|' lib/simset.c lib/simulation.c \
 && touch lib/simset.c lib/simulation.c lib/*.atr \
 && ./configure --prefix=/usr/local CFLAGS="-O2 -fcommon -std=gnu89 -w" \
 && make && make install && ldconfig && cd / && rm -rf /tmp/cim-5.1*
WORKDIR /src
