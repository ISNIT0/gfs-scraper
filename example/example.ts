import * as gfsScraper from '../src/index';
import { join } from 'path';

const outFile = join(__dirname, 'out.grib2');

gfsScraper.downloadStep(outFile, '2018082712', '000', 'all');

gfsScraper.getLatestRun()
    .then((run) => {
        console.info(`Latest available GFS run is [${run}]`);
    });

gfsScraper.downloadStep('./out.grib2', '2018082712', '000', [{
    height: '2maboveground',
    parameter: 'TMP',
}, {
    height: 'surface',
    parameter: 'LAND',
}]);
