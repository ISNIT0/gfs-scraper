# GFS Downloader
![npm](https://img.shields.io/npm/v/gfsscraper.svg)
[![Build Status](https://travis-ci.org/ISNIT0/gfs-scraper.svg?branch=master)](https://travis-ci.org/ISNIT0/gfs-scraper)
[![codecov](https://codecov.io/gh/ISNIT0/gfs-scraper/branch/master/graph/badge.svg)](https://codecov.io/gh/ISNIT0/gfs-scraper)
[![CodeFactor](https://www.codefactor.io/repository/github/isnit0/gfs-scraper/badge)](https://www.codefactor.io/repository/github/isnit0/gfs-scraper)
![NPM License](https://img.shields.io/npm/l/gfsscraper.svg)
> A modern, tested, open source GFS model downloader built on NodeJS


## Installation
```bash
> npm i -g gfsscraper
```

## Requirements
- *nix based OS
- NodeJS
- NPM


## Usage
### Command Line
```bash
> gfsscraper --help

> gfsscraper downloadStep --run "2018082712" --step "000" --outFile ./out.grib2 --parameterHeightGroups TMP:2maboveground LAND:surface
```

### NodeJS
```typescript
import * as gfsScraper from 'gfsscraper';

gfsScraper.downloadStep('./out.grib2', '2018082712', '000', 'all'); // Downloads all parameters and heights for selected step

gfsScraper.downloadStep('./out.grib2', '2018082712', '000', [{
    height: '2maboveground',
    parameter: 'TMP'
}, {
    height: 'surface',
    parameter: 'LAND'
}]);
```
See [`example/example.ts`](./example/example.ts)


## Justification
The industry standard for GFS GRIB file downloading is [`get_gfs.pl`](http://www.cpc.ncep.noaa.gov/products/wesley/get_gfs.html). It's quite old, and not a whole lot of people are proficient in perl... Hopefully TypeScript is easier to maintain and improve!

Also, making new things is **fun**!

## TODO
- [ ] Remove coupling to GFS (make more generic)
- [ ] Prettier Logging
- [ ] UI For selecting parameters (FUTURE)

## Building
```bash
> ./build.sh
```

## Testing
```bash
> npm t
```

## License
[MIT](./LICENSE)
