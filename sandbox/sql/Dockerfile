# Throwaway image with the SQLite shell (Debian trixie)
FROM debian:trixie-slim
RUN apt-get update && apt-get install -y --no-install-recommends sqlite3 && rm -rf /var/lib/apt/lists/*
WORKDIR /src
