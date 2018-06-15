const request = require('request-promise-native');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const exec = require('promised-exec');
const moment = require('moment');

const downloadDir = path.join(__dirname, '../download/');

function log(...messages) {
    console.log(`[${(new Date()).toUTCString()}]`, ...messages);
}

log(`Using download directory [${downloadDir}]`);

function getLatestAvailableGfsRun() {
    log(`Getting latest available GFS runs`);
    return request.get(`http://www.ftp.ncep.noaa.gov/data/nccf/com/gfs/prod/`)
        .then(html => {
            const $ = cheerio.load(html);
            const latestGfs = $('a')
                .toArray()
                .map(el => $(el).attr('href'))
                .filter(a => a)
                .filter(href => href.startsWith('gfs.'))
                .map(href => {
                    return href.replace(/[^0-9]/g, '');
                })
                .sort((a, b) => {
                    return moment(a, 'YYYYMMDDHH').valueOf() > moment(b, 'YYYYMMDDHH').valueOf() ? 1 : -1;
                })
                .reverse()[0];
            return latestGfs;
        });
}

function getAvailableGfsRunSteps(gfsRunCode) {
    log(`Getting latest available GFS step for run [${gfsRunCode}]`);
    return request.get(`http://www.ftp.ncep.noaa.gov/data/nccf/com/gfs/prod/gfs.${gfsRunCode}/`)
        .then(html => {
            const $ = cheerio.load(html);
            return $('a')
                .toArray()
                .map(el => $(el).attr('href'))
                .filter(a => a)
                .filter(href => href.startsWith('gfs.'))
                .filter(file => file.slice(-5).match(/\.f[0-9]+$/))
                .filter(file => !!~file.indexOf('.pgrb2.1'))
                .map(file => file.split('.').slice(-1)[0])
                .map(href => href.slice(1))
                .map(stepHour => parseInt(stepHour))
                .reverse();
        });
}

function getLatestDownloadedGfsRun(downloadDir) {
    const downloads = fs.readdirSync(downloadDir);
    const latestDownloaded = downloads
        .filter(dir => dir.startsWith('gfs.'))
        .map(dir => {
            return dir.replace(/[^0-9]/g, '');
        })
        .sort((a, b) => {
            return moment(a, 'YYYYMMDDHH').valueOf() > moment(b, 'YYYYMMDDHH').valueOf() ? 1 : -1;
        })[0];
    return latestDownloaded;
}

async function getDownloadedGfsRunSteps(runCode) {
    log(`Getting latest downloaded GFS step for run [${runCode}]`);
    const stepDownloadDir = path.join(downloadDir, `gfs.${runCode}`);
    await exec(`mkdir -p ${stepDownloadDir}`);
    const latestDownloadedSteps = fs.readdirSync(stepDownloadDir)
        .filter(file => file.slice(-5).match(/\.f[0-9]+/))
        .map(file => file.split('.').slice(-1)[0].slice(1))
        .map(stepHour => parseInt(stepHour))
        .sort(((a, b) => a - b))
        .slice(-1)
        .reverse();
    return latestDownloadedSteps;
}

async function downloadGfsStep(runCode, firstStepNumber, lastStepNumber, parameters = ['all'], levels = ['all'], stepDifference = 3) {
    log(`Downloading GFS Step: [runCode=${runCode}] [firstStepNumber=${firstStepNumber}] [lastStepNumber=${lastStepNumber}] [stepDifference=${stepDifference}] [parameters=${parameters}] [levels=${levels}]`);
    const targetPath = path.join(downloadDir, `gfs.${runCode}`);
    await exec(`mkdir -p ${targetPath}`);
    await exec(`perl ../get_gfs.pl data ${runCode} ${firstStepNumber} ${lastStepNumber} ${stepDifference} ${parameters.join(':')} ${levels.join(':')} ${targetPath}`);
}

(async function run() {
    try {
        //const latestDownloadedRun = getLatestDownloadedGfsRun();
        const latestAvailableRun = await getLatestAvailableGfsRun();
        const downloadedSteps = await getDownloadedGfsRunSteps(latestAvailableRun);
        const availableSteps = await getAvailableGfsRunSteps(latestAvailableRun);

        const stepsToDownload = availableSteps.filter(a => !~downloadedSteps.indexOf(a)).sort((a, b) => a - b);

        log(`Found [${availableSteps.length}] Steps - Already Downloaded [${downloadedSteps.length}] Steps - Downloading [${stepsToDownload.length}] Steps`);

        if (!availableSteps.length) {
            log(`No steps available for run [${latestAvailableRun}]`);
            return;
        }

        if (!stepsToDownload.length) {
            log(`Already downloaded all available steps`);
            return;
        }

        log(`Downloading range [${stepsToDownload[0]}] to [${stepsToDownload.slice(-1)[0]}]`);

        await downloadGfsStep(latestAvailableRun, stepsToDownload[0], stepsToDownload.slice(-1)[0], ['TMP', 'LAND', 'VEG', 'TCDC'], ['2']);

        await run();

    } catch (err) {
        console.error(err);
    }
})();