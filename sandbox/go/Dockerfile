# golang:1.26-alpine with the build cache pre-warmed for the std packages snippets and small edits typically use.
# Without this every fresh container recompiles fmt and friends (~5 s per run).
FROM golang:1.26-alpine
RUN mkdir /warm && cd /warm \
 && printf '%s\n' 'package main' 'import (' '_ "bufio"' '_ "errors"' '_ "fmt"' '_ "maps"' '_ "math"' '_ "os"' '_ "slices"' \
      '_ "sort"' '_ "strconv"' '_ "strings"' '_ "sync"' '_ "time"' '_ "unicode"' ')' 'func main() {}' > w.go \
 && go build -o w w.go && cd / && rm -rf /warm
