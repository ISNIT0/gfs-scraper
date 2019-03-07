import * as yargs from 'yargs';
import * as moment from 'moment';

import {
    getLatestAvailableGfsRun,
    downloadAllStepsForGFSRun,
    downloadGfsStep,
    leftPad,
    log,
} from './util';
import { exec } from 'child_process';

log('\n\n\n==================== Starting GFS Downloader ====================');

function downloadStep(outFile: string, run: string, _step: number | string, parameterHeightGroups: Array<{ height: string, parameter: string }> | 'all' = 'all') {
    const step = leftPad(_step, 3);

    const hours = moment(run, 'YYYYMMDDHH').get('hours');
    const runHours = leftPad(hours, 2);

    const url = `http://www.ftp.ncep.noaa.gov/data/nccf/com/gfs/prod/gfs.${run}/gfs.t${runHours}z.pgrb2.0p25.f${step}`;
    return downloadGfsStep(outFile, url, parameterHeightGroups);
}

export {
    downloadStep,
    getLatestAvailableGfsRun as getLatestRun,
    downloadAllStepsForGFSRun,
};

const noop = yargs
    .command('downloadRun', 'Find and download all available steps from the latest available run', {
        parameters: {
            type: 'array',
            default: ['all'],
            describe: 'Parameters to pass to get_gfs.pl',
        },
        heights: {
            type: 'array',
            default: ['all'],
            describe: 'Heights to pass to get_gfs.pl',
        },
        run: {
            type: 'string',
            default: 'latest',
            describe: '"latest" or GFS Formatted Run ID (YYYYMMDDHH)',
        },
        downloadDirectory: {
            describe: 'Directory to Download GFS Files to',
            type: 'string',
            default: './download/gfs',
        },
    },
        async function (argv: any) {
            try {
                let runToFetch = argv.run;
                if (runToFetch === 'latest') {
                    runToFetch = await getLatestAvailableGfsRun();
                }

                await downloadAllStepsForGFSRun(argv.downloadDirectory, runToFetch);

            } catch (err) {
                log(`Failed to run command:`, err);
                process.exit(1);
            }
            log('\n=================== Finishing GFS Downloader ===================\n\n');

        })
    .command('downloadStep', 'Download specific parameters/heights from a specific run/step', {
        outFile: {
            describe: 'Path the result should be saved in',
            type: 'string',
            demand: true,
        },
        parameterHeightGroups: {
            describe: `"all" or the parameters/heights you'd like to download`,
            type: 'array',
            default: ['TMP:2 m above ground'],
        },
        run: {
            type: 'string',
            describe: 'GFS Formatted Run ID (YYYYMMDDHH)',
            demand: true,
        },
        step: {
            type: 'string',
            default: '000',
            describe: 'Left-padded step id (e.g. 000, 003, 009)',
        },
    }, async function (argv) {
        const date = moment(argv.run, 'YYYYMMDDHH');
        const runHours = leftPad(date.get('hours'), 2);

        const phGroups = argv.parameterHeightGroups.map((ph: string) => {
            const [p, h] = ph.replace(/ /g, '').split(':');
            return { parameter: p, height: h };
        });

        try {
            const outDir = argv.outFile.split('/').slice(0, -1).join('/');
            console.log(`Making directory: [${outDir}]`);
            await exec(`mkdir -p ${outDir}`);

            const url = `http://www.ftp.ncep.noaa.gov/data/nccf/com/gfs/prod/gfs.${argv.run}/gfs.t${runHours}z.pgrb2.0p25.f${argv.step}`;
            await downloadGfsStep(argv.outFile, url, phGroups);
        } catch (err) {
            console.error(`Error converting grib file:`, err);
            process.exit(1);
        }
        log('\n=================== Finishing GFS Downloader ===================\n\n');
    })
    .command('grib2netcdf', 'Convert specific grib file to netcdf', {
        wgrib2: {
            describe: 'Path to wgrib2',
            default: 'wgrib2',
        },
        inFile: {
            describe: 'File to convert (grib)',
            type: 'string',
            demand: true,
        },
        outFile: {
            describe: 'Path the result should be saved in',
            type: 'string',
            demand: true,
        },
    }, async function (argv) {
        try {
            const out = await exec(`${argv.wgrib2} -s "${argv.inFile}" | ${argv.wgrib2} -i "${argv.inFile}" -netcdf "${argv.outFile}"`);
            out.stdout.on('data', (msg) => console.info('INFO:', msg));
            out.stderr.on('data', (msg) => console.error('ERR:', msg));
        } catch (err) {
            console.error(`Error converting grib file:`, err);
            process.exit(1);
        }
        log('\n=================== Finishing GFS Downloader ===================\n\n');
    })
    .demandCommand(1, 'Please specify at least one command')
    .help()
    .argv;
