FROM debian:trixie-slim
RUN apt-get update && apt-get install -y --no-install-recommends gcc libc6-dev make && rm -rf /var/lib/apt/lists/*
ADD https://www.cl.cam.ac.uk/~mr10/BCPL/bcpl.tgz /tmp/bcpl.tgz
RUN mkdir -p /opt && tar xzf /tmp/bcpl.tgz -C /opt --no-same-owner --exclude='BCPL/.git' && chmod -R a+rX /opt/BCPL && rm /tmp/bcpl.tgz
ENV BCPLROOT=/opt/BCPL/cintcode
ENV BCPLPATH=/opt/BCPL/cintcode/cin
ENV BCPLHDRS=/opt/BCPL/cintcode/g
ENV BCPLSCRIPTS=/opt/BCPL/cintcode/s
ENV PATH=/opt/BCPL/cintcode/bin:$PATH
WORKDIR /opt/BCPL/cintcode
RUN make sys 2>&1 | tail -20
WORKDIR /src
