FROM debian:trixie-slim
RUN apt-get update && apt-get install -y --no-install-recommends gcc libc6-dev make wget ca-certificates && rm -rf /var/lib/apt/lists/*
RUN wget -q https://ftp.gnu.org/gnu/marst/marst-2.8.tar.gz && tar xzf marst-2.8.tar.gz && cd marst-2.8 && ./configure && make && make install && ldconfig && cd .. && rm -rf marst-2.8*
