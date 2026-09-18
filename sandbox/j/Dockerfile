# J 9.7.1 from Jsoftware: the official Linux "base system" build (engine libj.so, jconsole, standard library).
# Scripts run headless with `jconsole -jscript file.ijs`, which exits at the end of input and with status 3
# on an untrapped error. The profile keeps its user folders under $HOME, so HOME=/tmp keeps every write in the
# sandbox tmpfs (the image works with a read-only root filesystem).
FROM debian:trixie-slim
ADD https://www.jsoftware.com/download/j9.7/install/j9.7.1_linux.tar.gz /tmp/j.tar.gz
RUN echo "1c0cf450b45f563d7408a6c93563006782da8b422e0769781eb8731c465ffd06  /tmp/j.tar.gz" | sha256sum -c - \
 && tar xzf /tmp/j.tar.gz -C /opt --no-same-owner && rm /tmp/j.tar.gz \
 && chmod -R a+rX /opt/j9.7
ENV PATH=/opt/j9.7/bin:$PATH HOME=/tmp
WORKDIR /src
