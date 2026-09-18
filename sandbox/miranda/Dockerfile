# Throwaway image for David Turner's Miranda (open source, codeberg.org/DATurner/miranda)
FROM gcc:14 AS build
ADD https://codeberg.org/DATurner/miranda/archive/miranda-2.068.tar.gz /tmp/mira.tar.gz
RUN cd /tmp && tar xzf mira.tar.gz && cd miranda && make && make install BIN=/usr/local/bin LIB=/usr/local/lib MAN=/tmp

FROM debian:trixie-slim
COPY --from=build /usr/local/bin/mira /usr/local/bin/mira
COPY --from=build /usr/local/lib/miralib /usr/local/lib/miralib
WORKDIR /src
