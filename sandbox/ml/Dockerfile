# Throwaway image for Standard ML '97 (Poly/ML 5.7.1 from Debian bookworm)
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends polyml libpolyml-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /src
