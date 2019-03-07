#!/bin/bash
rm -rf bin
tsc --build tsconfig.build.json
echo "#!/usr/bin/env node" | cat - ./bin/index.js > /tmp/gfsscraper && mv /tmp/gfsscraper ./bin/gfsscraper