FROM debian:trixie-slim
RUN apt-get update && apt-get install -y --no-install-recommends gcc make libc6-dev git ca-certificates \
 && git clone https://github.com/aap/l15 /opt/l15 && cd /opt/l15 && git checkout cb56c34b1a21cfdbb16364707f4c0ad5816b71d3 \
 && make LDLIBS=-lm \
 && apt-get purge -y git && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*
COPY lisp15 /usr/local/bin/lisp15
RUN chmod +x /usr/local/bin/lisp15
WORKDIR /opt/l15
