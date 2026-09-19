# Lean 4.34.0 for the PL World sandbox: the official x86_64 Linux release, pinned by sha256. It contains lean, leanc
# (a wrapper around a bundled clang and lld with its own glibc sysroot, so no system compiler is needed) and the
# precompiled Init, Std and Lean libraries, so `import Std` and `import Lean` work offline. Nothing is fetched at run
# time: no elan, no Lake packages, no Mathlib. The release is trimmed of what a sandbox never uses: the library
# sources, the .ilean editor indexes and Lake, Lean's build tool (libLake.a stays because leanc's link line names it).
# Lean itself has no telemetry. `lean-run` elaborates a file with `lean -c` and links it with `leanc`.
FROM debian:trixie-slim AS fetch
ARG LEAN_VERSION=4.34.0
ARG LEAN_SHA256=caaa98356098c85dc0fcbbd28e1ec66f39eb6551829972b752ff20e1286b646b
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl zstd \
 && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL -o /tmp/lean.tar.zst \
      "https://github.com/leanprover/lean4/releases/download/v${LEAN_VERSION}/lean-${LEAN_VERSION}-linux.tar.zst" \
 && echo "${LEAN_SHA256}  /tmp/lean.tar.zst" | sha256sum -c - \
 && mkdir /opt/lean \
 && tar --zstd -xf /tmp/lean.tar.zst -C /opt/lean --strip-components=1 --no-same-owner \
 && rm /tmp/lean.tar.zst \
 && cd /opt/lean \
 && rm -rf src bin/lake lib/lean/Lake lib/lean/Lake.* lib/lean/LakeMain.* lib/lean/libLake_shared.so \
 && find lib/lean -name '*.ilean' -delete \
 && chmod -R a+rX /opt/lean

FROM debian:trixie-slim
COPY --from=fetch /opt/lean /opt/lean
# HOME=/tmp keeps any stray writes inside the sandbox tmpfs.
ENV PATH=/opt/lean/bin:$PATH HOME=/tmp
COPY lean-run /usr/local/bin/lean-run
# Smoke test: check a proof, compile, link and run a program at build time, then leave /tmp empty.
RUN chmod 755 /usr/local/bin/lean-run \
 && lean --version \
 && mkdir /tmp/smoke && cd /tmp/smoke \
 && printf 'theorem t : 2 + 2 = 4 := by decide\ndef main : IO Unit := IO.println "lean ok"\n' > main.lean \
 && test "$(lean-run main.lean)" = "lean ok" \
 && cd / && rm -rf /tmp/smoke /tmp/plw-lean && test -z "$(ls -A /tmp)"
WORKDIR /src
