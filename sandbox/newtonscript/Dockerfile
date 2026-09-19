# NEWT/0: Makoto Nukui's open-source NewtonScript bytecode compiler and interpreter, built from source.
FROM debian:bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates git gcc make libc6-dev bison flex \
 && rm -rf /var/lib/apt/lists/*
ARG NEWT0_COMMIT=cb7482c4908f2e0ce86c93faf6a5b3997d958143
RUN git clone https://github.com/gnue/NEWT0.git /tmp/newt0 \
 && git -C /tmp/newt0 checkout -q "$NEWT0_COMMIT"
WORKDIR /tmp/newt0
# -D_GNU_SOURCE declares strcasestr (used by StrPos); without the prototype GCC assumes it returns int,
# which truncates the pointer on 64-bit hosts and makes StrPos return garbage. `make test` runs NEWT/0's
# own test suite.
RUN CPPFLAGS=-D_GNU_SOURCE ./configure --prefix=/opt/newt0 \
 && make \
 && make test \
 && mkdir -p /opt/newt0/bin /opt/newt0/lib /opt/newt0/include \
 && make install

FROM debian:bookworm-slim
# The interpreter plus its extension libraries (protoFILE, protoREGEX) in the compiled-in site dir.
COPY --from=build /opt/newt0/bin/newt /opt/newt0/bin/newt
COPY --from=build /opt/newt0/lib/newt0 /opt/newt0/lib/newt0
ENV PATH=/opt/newt0/bin:$PATH
WORKDIR /src
