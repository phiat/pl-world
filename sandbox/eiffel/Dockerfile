FROM debian:trixie-slim
RUN apt-get update && apt-get install -y --no-install-recommends gcc libc6-dev curl ca-certificates xz-utils && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://github.com/gobo-eiffel/gobo/releases/download/gobo-26.09/gobo-linux-x86_64-26.09.03+8969a11.tar.xz -o /tmp/gobo.tar.xz \
 && mkdir -p /opt && tar -xJf /tmp/gobo.tar.xz -C /opt && rm /tmp/gobo.tar.xz && ls /opt
ENV GOBO=/opt/gobo
ENV PATH=/opt/gobo/bin:$PATH
