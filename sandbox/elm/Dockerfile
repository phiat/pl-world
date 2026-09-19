# Elm 0.19.2 on Node.js 24 LTS (Alpine), with a template project whose packages are downloaded and built
# when the image is built, since sandbox runs have no network for package.elm-lang.org.
#
# Elm compiles to JavaScript and has no console of its own. Sandbox programs are `port module`s run as
# Platform.worker programs that send their output out through a port. `elm-run` copies the template to
# /tmp, compiles the program with elm make and runs it in Node.js with host.cjs, which prints every value
# the program sends through a port. The official Linux binary is statically linked, so it runs on musl.
FROM node:24.21.0-alpine3.24
ARG ELM_URL=https://github.com/elm/compiler/releases/download/0.19.2/elm-0.19.2-linux-x64.gz
ARG ELM_SHA256=66320d27701654fa11bd0e8d84bdf9829694d5770c8dcee2dede6160fad58737
RUN wget -q -U 'pl-world-build/0.1' -O /tmp/elm.gz "$ELM_URL" \
 && echo "$ELM_SHA256  /tmp/elm.gz" | sha256sum -c - \
 && gunzip /tmp/elm.gz \
 && install -m 755 /tmp/elm /usr/local/bin/elm \
 && rm -f /tmp/elm
# Download and build the packages into the template's own ELM_HOME (elm make with network, once).
COPY template/ /opt/plw-elm/
RUN cd /opt/plw-elm \
 && ELM_HOME=/opt/plw-elm/elm-home elm make src/Main.elm --output=/dev/null \
 && chmod -R a+rX /opt/plw-elm
COPY host.cjs /usr/local/lib/elm-run/host.cjs
COPY elm-run /usr/local/bin/elm-run
RUN chmod 755 /usr/local/bin/elm-run && chmod 644 /usr/local/lib/elm-run/host.cjs
# Smoke test: compile and run the template offline, exactly as the sandbox will.
RUN test "$(elm-run /opt/plw-elm/src/Main.elm)" = "Hello, World!" \
 && rm -rf /tmp/* /tmp/.[!.]*
WORKDIR /src
