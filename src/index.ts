import * as yargs from 'yargs';

import {
    getLatestAvailableGfsRun,
    downloadAllStepsForRun,
    log
} from './util';

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
            log('=================== Finishing GFS Downloader ===================\n\n');

        })
    .demandCommand(1, 'Please specify at least one command')
    .help()
    .argv;