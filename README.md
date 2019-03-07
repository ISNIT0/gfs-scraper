# GFS Scraper
[![Build Status](https://travis-ci.org/ISNIT0/gfs-scraper.svg?branch=master)](https://travis-ci.org/ISNIT0/gfs-scraper)
[![CodeFactor](https://www.codefactor.io/repository/github/isnit0/gfs-scraper/badge)](https://www.codefactor.io/repository/github/isnit0/gfs-scraper)

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
The industry standard for GFS GRIB file downloading is [`get_gfs.pl`](http://www.cpc.ncep.noaa.gov/products/wesley/get_gfs.html). There's nothing particularly wrong with this, but it's a shame to have yet another language/tool to learn for new weather developers. It also doesn't scale particularly well or provide an API to other systems.

Also, making new things is **fun**!

## TODO
- [ ] Remove coupling to GFS (make more generic)
- [ ] Prettier Logging
- [ ] UI For selecting parameters (FUTURE)

## Building
```bash
> ./build.sh
```

## License
[MIT](./LICENSE)
