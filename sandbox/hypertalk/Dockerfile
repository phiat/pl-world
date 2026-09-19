# HyperTalk on the LiveCode Community Server 9.6.3 engine (build 15543, July 2021, GPLv3).
# LiveCode descends from HyperTalk through MetaCard and Revolution; its server engine runs xTalk
# scripts headless, and `put` with no destination writes to stdout. The Community Edition was withdrawn on
# 31 August 2021 and downloads.livecode.com now redirects to a trial page, so the unmodified official zip
# comes from the Internet Archive's mirror of every community server build, pinned by SHA-256.
#
# `hypertalk-run FILE` makes FILE the script of a button on a card of a new stack and clicks it (sends
# mouseUp), as HyperCard would. Unhandled messages pass up to the card, the stack and the Home stack.
# Errors are reported on stderr with row/column, and the exit status is non-zero.
FROM debian:trixie-slim AS fetch
ARG LC_URL=https://archive.org/download/live-code-community-server-for-linux-all-versions/Linux%2064-Bit/LiveCodeCommunityServer-9_6_3-Linux-x86_64.zip
ARG LC_SHA256=e7f92cf82074b69349307c1b904014d3949284546659ce72fb032972d99dcb76
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates unzip \
 && curl -fsSL -A 'pl-world-build/0.1' -o /tmp/lc.zip "$LC_URL" \
 && echo "$LC_SHA256  /tmp/lc.zip" | sha256sum -c - \
 && mkdir -p /opt/livecode && unzip -q /tmp/lc.zip -d /opt/livecode \
 && rm /opt/livecode/*.pdf && chmod 755 /opt/livecode/livecode-community-server

FROM debian:trixie-slim
# The engine links against expat, FreeType and fontconfig even when no text is rendered.
RUN apt-get update && apt-get install -y --no-install-recommends libexpat1 libfreetype6 libfontconfig1 \
 && rm -rf /var/lib/apt/lists/*
COPY --from=fetch /opt/livecode /opt/livecode
COPY click.lc /opt/plw-hypertalk/click.lc
COPY hypertalk-run /usr/local/bin/hypertalk-run
RUN chmod 644 /opt/plw-hypertalk/click.lc && chmod 755 /usr/local/bin/hypertalk-run
ENV HOME=/tmp
WORKDIR /src
