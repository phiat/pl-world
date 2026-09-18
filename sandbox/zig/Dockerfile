FROM debian:trixie-slim
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates xz-utils \
 && curl -fL https://ziglang.org/download/0.16.0/zig-x86_64-linux-0.16.0.tar.xz | tar -xJ -C /opt \
 && ln -s /opt/zig-x86_64-linux-0.16.0/zig /usr/local/bin/zig \
 && apt-get purge -y curl xz-utils && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*
# Pre-warm the global cache (compiler_rt, std) so sandbox compiles don't start cold.
RUN mkdir /warm && cd /warm \
 && printf 'const std = @import("std");\npub fn main() void { std.debug.print("", .{}); }\n' > w.zig \
 && zig build-exe -O Debug -femit-bin=w w.zig && cd / && rm -rf /warm
