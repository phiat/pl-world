#!/bin/sh
# Fetch the build context this Dockerfile COPYs (kept out of git): Boehm GC 7.2g and Portable CLU.
set -eu
cd "$(dirname "$0")"
[ -f gc-7.2g.tar.gz ] || curl -fL -o gc-7.2g.tar.gz https://www.hboehm.info/gc/gc_source/gc-7.2g.tar.gz
[ -d pclu ] || git clone --depth 1 https://github.com/get-a-clu/updated-pclu pclu
