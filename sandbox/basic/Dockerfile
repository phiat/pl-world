FROM debian:trixie-slim
RUN apt-get update && apt-get install -y --no-install-recommends gcc libc6-dev wget ca-certificates unzip \
 && wget -q -O /tmp/bw.zip "https://sourceforge.net/projects/bwbasic/files/bwbasic/version%203.20/bwbasic-3.20.zip/download" \
 && mkdir /tmp/bw && cd /tmp/bw && unzip -q /tmp/bw.zip \
 && gcc -O2 -w -o /usr/local/bin/bwbasic bwbasic.c bwb_cmd.c bwb_cnd.c bwb_dio.c bwb_exp.c bwb_fnc.c bwb_inp.c bwb_int.c bwb_prn.c bwb_stc.c bwb_str.c bwb_tbl.c bwb_var.c bwd_cmd.c bwd_fun.c bwx_tty.c -lm \
 && mkdir -p /usr/local/share/doc/bwbasic && cp bwbasic.doc DOCS/* /usr/local/share/doc/bwbasic/ 2>/dev/null; \
 cd / && rm -rf /tmp/bw /tmp/bw.zip && apt-get purge -y gcc libc6-dev wget unzip && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*
