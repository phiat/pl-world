FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends gcc make libc6-dev && rm -rf /var/lib/apt/lists/*
ENV CLUHOME=/opt/pclu
COPY gc-7.2g.tar.gz /tmp/
RUN mkdir -p $CLUHOME/code && cd /tmp && tar xzf gc-7.2g.tar.gz && cd gc-7.2 \
 && CFLAGS="-O2 -w -fcommon" ./configure --enable-static=yes --enable-shared=no --enable-threads=no --with-libatomic-ops=no --prefix=$CLUHOME/code/gc \
 && make -j4 && make install \
 && mkdir -p $CLUHOME/code/gc/include/gc/private && cp include/private/*.h $CLUHOME/code/gc/include/gc/private/ \
 && cd / && rm -rf /tmp/gc-7.2*
COPY pclu /opt/pclu
ARG FLAGS="-O1 -w -fcommon"
RUN cd $CLUHOME && mkdir -p include && make symlinks \
 && cd $CLUHOME/code && make OPT_FLAGS="$FLAGS" optlib \
 && cd $CLUHOME/code/cmp && make OPT_FLAGS="$FLAGS" \
 && cd $CLUHOME/lib && make libs
ENV PATH=/opt/pclu/exe:$PATH
WORKDIR /src
