# QBasic on QB64 Phoenix Edition 4.6.0 (July 2026; libqb runtime MIT), built from the official Linux source release,
# pinned by SHA-256. QB64-PE compiles QuickBASIC 4.5 / QBasic 1.1 source by translating it to C++ for g++, so the image
# keeps g++ plus the OpenGL, GLU, X11 and ALSA development libraries that QB64-PE links into every Linux program, even a
# console-only one that never opens a window.
#
# headless.patch changes three behaviours for runs without a terminal (stdin is /dev/null in the sandbox):
#   - END no longer prints "Press enter to continue" and waits, unless stdin and stdout are both terminals;
#   - an unhandled runtime error, reported on stderr as "Runtime error: Line: N (in main.bas) ...", ends the program with
#     exit status 1 instead of looping forever on a "Continue? y/n" prompt it cannot answer;
#   - INPUT at the end of a redirected stdin raises error 62, "Input past end of file", instead of waiting for keys.
#
# The IDE build (make BUILD_QB64=y) is followed by two warm-up compiles that precompile the console-only runtime, with
# and without sound (BEEP, SOUND and PLAY pull in the audio library), so a sandbox compile only builds the program itself.
# The IDE's help pages and qb64pe's own sources and objects are then removed. `qbasic-build FILE OUT` copies the tree to
# /tmp, where QB64-PE keeps its work files, and compiles FILE unchanged (see the script). QB64-PE has no telemetry.
FROM debian:trixie-slim
ARG QB64PE_VERSION=4.6.0
ARG QB64PE_SHA256=4bc518bb64862d87e085cf6a8870d5ef58f5ed6fbbf27a6400029bbc828e70c5
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl patch g++ make \
      libgl-dev libglu1-mesa-dev libx11-dev libxcb1-dev libasound2-dev libpng-dev libcurl4-openssl-dev zlib1g-dev \
 && rm -rf /var/lib/apt/lists/*
COPY headless.patch /tmp/headless.patch
RUN curl -fsSL -A 'pl-world-build/0.1' -o /tmp/qb64pe.tar.gz \
      "https://github.com/QB64-Phoenix-Edition/QB64pe/releases/download/v${QB64PE_VERSION}/qb64pe_lnx-${QB64PE_VERSION}.tar.gz" \
 && echo "${QB64PE_SHA256}  /tmp/qb64pe.tar.gz" | sha256sum -c - \
 && tar xzf /tmp/qb64pe.tar.gz -C /opt --no-same-owner && rm /tmp/qb64pe.tar.gz \
 && cd /opt/qb64pe && patch -p1 < /tmp/headless.patch && rm /tmp/headless.patch \
 && { make OS=lnx BUILD_QB64=y -j"$(nproc)" > /tmp/build.log 2>&1 || { tail -40 /tmp/build.log; exit 1; }; } \
 && rm -rf /tmp/build.log internal/help internal/source source internal/c/qbx.o internal/c/libqb_make_*.o \
 && apt-get purge -y curl patch && apt-get autoremove -y
RUN cd /opt/qb64pe \
 && printf '$CONSOLE:ONLY\nPRINT "QB64-PE"; 1 / 3\n' > warm1.bas && ./qb64pe -x -q -m warm1.bas -o /tmp/warm1 && /tmp/warm1 \
 && printf '$CONSOLE:ONLY\nBEEP\nSOUND 440, 1\nPLAY "C"\n' > warm2.bas && ./qb64pe -x -q -m warm2.bas -o /tmp/warm2 \
 && rm -rf warm1.bas warm2.bas settings internal/temp[0-9]* internal/c/qbx.o internal/c/qbx[0-9]* \
 && find internal/temp -mindepth 1 ! -name temp.bin -delete \
 && rm -rf /tmp/*
COPY qbasic-build /usr/local/bin/qbasic-build
RUN chmod 755 /usr/local/bin/qbasic-build
ENV HOME=/tmp
# Smoke test through the sandbox path: compile with qbasic-build, run with stdin at EOF, then leave /tmp empty.
RUN printf 'DECLARE SUB Hi (n%%)\nHi 42\nEND\n\nSUB Hi (n%%)\n    PRINT "qbasic ok"; n%%\nEND SUB\n' > /tmp/smoke.bas \
 && qbasic-build /tmp/smoke.bas /tmp/smoke && /tmp/smoke < /dev/null | grep -qx 'qbasic ok 42 ' \
 && rm -rf /tmp/* /tmp/.[!.]*
WORKDIR /src
