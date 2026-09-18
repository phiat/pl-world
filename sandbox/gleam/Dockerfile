# Gleam 1.18.1 on Erlang/OTP 29 (official Alpine image) with a pre-built template project, so sandbox
# runs (no network) can import gleam_stdlib, gleam_erlang and gleam_otp without fetching from Hex.
# `gleam-run` copies the template into /tmp, drops in the user's module and runs it.
FROM ghcr.io/gleam-lang/gleam:v1.18.1-erlang-alpine
# Without network, erl's boot-time host lookup waits ~5 s on DNS; resolve from /etc/hosts only.
COPY inetrc /etc/plw-gleam.inetrc
ENV ERL_INETRC=/etc/plw-gleam.inetrc
COPY template/ /opt/plw-gleam/
RUN cd /opt/plw-gleam \
 && gleam deps download \
 && gleam build \
 && gleam run --module main --no-print-progress \
 && rm -rf /root/.cache/gleam
COPY gleam-run /usr/local/bin/gleam-run
RUN chmod 755 /usr/local/bin/gleam-run
WORKDIR /src
