FROM debian:trixie-slim
RUN apt-get update && apt-get install -y --no-install-recommends gcc libc6-dev binutils git ca-certificates && rm -rf /var/lib/apt/lists/*
RUN git clone https://github.com/aap/b.git /opt/b && cd /opt/b && git checkout 8779d9e8684d1daaa47c6fab1705194d732863bb \
 && cd amd64 && PATH=.:$PATH sh xx
COPY bcomp /usr/local/bin/bcomp
RUN chmod +x /usr/local/bin/bcomp
WORKDIR /src
