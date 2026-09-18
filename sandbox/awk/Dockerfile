# The One True AWK: Brian Kernighan's awk, the version described in "The AWK Programming Language"
# (2nd edition, 2023), built from source and pinned to a release tag. Installed as /usr/local/bin/awk;
# BusyBox's awk applet link is removed so `awk` is unambiguous. It writes nothing outside /src or /tmp.
FROM alpine:3.24 AS build
RUN apk add --no-cache build-base bison git
RUN git clone --depth 1 --branch 20260426 https://github.com/onetrueawk/awk.git /ota \
 && cd /ota && test "$(git rev-parse HEAD)" = 5739fd79bcfc75ba7526773d0cf634521f8aca3c \
 && make CFLAGS=-O2 && strip a.out && ./a.out 'BEGIN { print "ok" }'

FROM alpine:3.24
COPY --from=build /ota/a.out /usr/local/bin/awk
RUN rm -f /usr/bin/awk && awk --version
ENV HOME=/tmp
WORKDIR /src
