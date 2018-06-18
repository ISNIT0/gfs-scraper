#!/bin/bash
tsc
echo "#!/usr/bin/env node"|cat - ./bin/index.js > /tmp/gfsscraper && mv /tmp/gfsscraper ./bin/gfsscraper