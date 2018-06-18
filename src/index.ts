import * as yargs from 'yargs';
import * as moment from 'moment';

import {
    getLatestAvailableGfsRun,
    downloadAllStepsForRun,
    customDownloadGfsStepParams,
    leftPad,
    log,
} from './util';
import { exec } from 'child_process';

log('\n\n\n==================== Starting GFS Downloader ====================');

yargs
    .command('downloadRun', 'Find and download all available steps from the latest available run', {
        parameters: {
            type: 'array',
            default: ['all'],
            describe: 'Parameters to pass to get_gfs.pl'
        },
        heights: {
            type: 'array',
            default: ['all'],
            describe: 'Heights to pass to get_gfs.pl'
        },
        run: {
            type: 'string',
            default: 'latest',
            describe: '"latest" or GFS Formatted Run ID (YYYYMMDDHH)'
        },
        downloadDirectory: {
            describe: 'Directory to Download GFS Files to',
            type: 'string',
            default: './download',
        }
    },
        async function (argv: any) {
            try {
                let runToFetch = argv.run;
                if (runToFetch === 'latest') {
                    runToFetch = await getLatestAvailableGfsRun();
                }

                await downloadAllStepsForRun(argv.downloadDirectory, runToFetch);

            } catch (err) {
                log(`Failed to run command:`, err);
            }
            log('\n=================== Finishing GFS Downloader ===================\n\n');

        })
    .command('downloadStep', 'Download specific parameters/heights from a specific run/step', {
        outFile: {
            describe: 'Path the result should be saved in',
            type: 'string',
            demand: true
        },
        parameterHeightGroups: {
            describe: `"all" or the parameters/heights you'd like to download`,
            type: 'array',
            default: ["TMP:2 m above ground"]
        },
        run: {
            type: 'string',
            describe: 'GFS Formatted Run ID (YYYYMMDDHH)',
            demand: true
        },
        step: {
            type: 'string',
            default: '000',
            describe: 'Left-padded step id (e.g. 000, 003, 009)'
        },
    }, async function (argv) {
        const date = moment(argv.run, 'YYYYMMDDHH');
        const runHours = leftPad(date.get('hours'), 2);

        const phGroups = argv.parameterHeightGroups.map((ph: string) => {
            const [p, h] = ph.replace(/ /g, '').split(':');
            return { parameter: p, height: h };
        });

        const url = `http://www.ftp.ncep.noaa.gov/data/nccf/com/gfs/prod/gfs.${argv.run}/gfs.t${runHours}z.pgrb2.0p25.f${argv.step}`;
        await customDownloadGfsStepParams(argv.outFile, url, phGroups);
        log('\n=================== Finishing GFS Downloader ===================\n\n');
    })
    .command('grib2netcdf', 'Convert specific grib file to netcdf', {
        wgrib2: {
            describe: 'Path to wgrib2',
            default: 'wgrib2'
        },
        inFile: {
            describe: 'File to convert (grib)',
            type: 'string',
            demand: true
        },
        outFile: {
            describe: 'Path the result should be saved in',
            type: 'string',
            demand: true
        }
    }, async function (argv) {
        try {
            const out = await exec(`${argv.wgrib2} -i "${argv.inFile}" -netcdf "${argv.outFile}"`);
            out.stderr.on('data', (msg) => console.error(msg));
        } catch (err) {
            console.error(`Error converting grib file:`, err);
        }
        log('\n=================== Finishing GFS Downloader ===================\n\n');
    })
    .demandCommand(1, 'Please specify at least one command')
    .help()
    .argv;