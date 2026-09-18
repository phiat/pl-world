FROM debian:bookworm-slim
RUN dpkg --add-architecture i386 && apt-get update && apt-get install -y --no-install-recommends \
    git ca-certificates cmake make gcc g++ gcc-multilib g++-multilib \
    libx11-dev:i386 libxext-dev:i386 libncurses-dev:i386 libtinfo-dev:i386 \
 && rm -rf /var/lib/apt/lists/*
RUN git clone --depth 1 --branch 2024.1 https://github.com/russellallen/self.git /opt/self
WORKDIR /opt/self/build
RUN CC="gcc -m32" CXX="g++ -m32" cmake .. -DCMAKE_BUILD_TYPE=Release && cmake --build . -j8 2>&1 | tail -30
# Build a headless world (no Morphic/UI1) from the Self sources and snapshot it.
RUN cd /opt/self/objects && printf "saveAs: '/opt/self/clean.snap'\n" \
    | /opt/self/build/vm/Self -f worldBuilder.self -b /opt/self/objects -o none > /tmp/world.log 2>&1; \
    tail -3 /tmp/world.log; test -s /opt/self/clean.snap
COPY self-run /usr/local/bin/self-run
RUN chmod +x /usr/local/bin/self-run
WORKDIR /src
