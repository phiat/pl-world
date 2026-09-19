# Unison: UCM 1.4.0 (the Unison Codebase Manager, released 19 August 2026) with @unison/base 7.19.2 installed.
#
# Unison code lives in a codebase, a SQLite database, rather than in text files, and libraries normally come
# from Unison Share over the network. Sandbox runs have no network, so the fetch stage downloads the official
# ucm release (pinned by SHA-256) and runs setup.md, a UCM transcript that creates the project plw/main and
# installs @unison/base/releases/7.19.2 into its lib namespace (public releases need no Share login). The final
# image carries ucm and that ~17 MB codebase; `unison-run` copies it to /tmp for each run, typechecks and
# compiles the scratch file with a transcript, and runs the result with `ucm run.compiled`.
#
# ucm has no telemetry. It only goes online for Share commands (lib.install, pull, push) and to look up the
# titles of known-bug GitHub issues when it reports a crash; offline, both fail fast. unison-run also turns off
# the language server (UNISON_LSP_ENABLED=false), which would otherwise listen on port 5757.
FROM debian:trixie-slim AS fetch
ARG UCM_URL=https://github.com/unisonweb/unison/releases/download/release%2F1.4.0/ucm-linux-x64.tar.gz
ARG UCM_SHA256=4613b451ac0c97f20748fdaf4dc8702a02d58e99a7037577d39e80d780ba1259
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl libgmp10 zlib1g \
 && curl -fsSL -A 'pl-world-build/0.1' -o /tmp/ucm.tar.gz "$UCM_URL" \
 && echo "$UCM_SHA256  /tmp/ucm.tar.gz" | sha256sum -c - \
 && mkdir -p /opt/unison && tar -xzf /tmp/ucm.tar.gz -C /opt/unison \
 && rm -rf /opt/unison/ui /opt/unison/ucm /tmp/ucm.tar.gz
COPY setup.md /tmp/setup/setup.md
RUN cd /tmp/setup \
 && HOME=/tmp UNISON_LSP_ENABLED=false /opt/unison/unison/unison transcript \
      --save-codebase-to /opt/plw-unison/codebase setup.md \
 && grep -q 'unison_base_7_19_2' setup.output.md \
 && rm -f /opt/plw-unison/codebase/.unison/v2/unison.lockfile

FROM debian:trixie-slim
# ucm links against GMP and zlib, and unison-run needs bash and perl: all are already in the base image.
COPY --from=fetch /opt/unison /opt/unison
COPY --from=fetch /opt/plw-unison /opt/plw-unison
COPY unison-run /usr/local/bin/unison-run
RUN chmod 755 /usr/local/bin/unison-run && ln -s /opt/unison/unison/unison /usr/local/bin/ucm \
 && chmod -R a+rX /opt/plw-unison
ENV HOME=/tmp
# Smoke test: typecheck, compile and run a program offline, exactly as the sandbox will.
RUN printf 'main : %s{IO, Exception} ()\nmain = do printLine "ok"\n' "'" > /tmp/main.u \
 && test "$(unison-run /tmp/main.u)" = ok \
 && rm -rf /tmp/* /tmp/.[!.]*
WORKDIR /src
