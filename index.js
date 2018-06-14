const request = require('request-promise-native');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const exec = require('promised-exec');

const downloadDir = path.join(__dirname, '../download/');

console.log(`Using download directory [${downloadDir}]`);

function getLatestAvailableGfsRun() {
    console.info(`Getting latest available GFS runs`);
    return request.get(`http://www.ftp.ncep.noaa.gov/data/nccf/com/gfs/prod/`)
        .then(html => {
            const $ = cheerio.load(html);
            const latestGfs = $('a')
                .map((i, el) => el.attr('href'))
                .map(a => console.log('value', a) || a)
                .filter(a => a)
                .filter(href => href.startsWith('gfs.'))
                .map(href => {
                    return href.replace(/[^0-9]/g, '');
                })
                .sort((a, b) => {
                    return moment(a, 'YYYYMMDDHH').valueOf() > moment(b, 'YYYYMMDDHH').valueOf() ? 1 : -1;
                })[0];
            return latestGfs;
        });
}

function getLatestAvailableGfsRunStep(gfsRunCode) {
    console.info(`Getting latest available GFS step for run [${gfsRunCode}]`);
    return request.get(`http://www.ftp.ncep.noaa.gov/data/nccf/com/gfs/prod/gfs.${gfsRunCode}/`)
        .then(html => {
            const $ = cheerio.load(html);
            const latestGfs = $('a')
                .map((i, el) => el.attr('href'))
                .map(a => console.log('value', a) || a)
                .filter(a => a)
                .filter(href => href.startsWith('gfs.'))
                .map(href => {
                    return href.replace(/[^0-9]/g, '');
                })
                .filter(file => file.endsWith(/\.f[0-9]+/))
                .map(file => file.split('.').slice(-1)[0])
                .map(stepHour => Number(stepHour))
                .sort()
                .reverse()[0];
            return latestGfs;
        });
}

function getLatestDownloadedGfsRun(downloadDir) {
    const runDownloadDir = fs.readdirSync(downloadDir);
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

function getLatestDownloadedGfsRunStep(runCode) {
    console.info(`Getting latest downloaded GFS step for run [${runCode}]`);
    const stepDownloadDir = path.join(downloadDir, `gfs.${runCode}`);
    const latestDownloadedStep = fs.readdirSync(stepDownloadDir)
        .filter(file => file.endsWith(/\.f[0-9]+/))
        .map(file => file.split('.').slice(-1)[0])
        .map(stepHour => Number(stepHour))
        .sort()
        .reverse()[0];
    return latestDownloadedStep;
}

async function downloadGfsStep(runCode, stepNumber, parameters = ['all'], levels = ['all']) {
    console.info(`Downloading GFS Step: [runCode=${runCode}] [stepNumber=${stepNumber}] [parameters=${parameters}] [levels=${levels}]`);
    const targetPath = path.join(downloadDir, `gfs.${runCode}`);
    await exec(`mkdir -p ${targetPath}`);
    await exec(`perl ./get_gfs.pl data ${runCode} ${stepNumber} 0 0 ${parameters.join(':')} ${levels.join(':')} ${targetPath}`);
}

(async function () {
    //const latestDownloadedRun = getLatestDownloadedGfsRun();
    const latestAvailableRun = await getLatestAvailableGfsRun();
    const latestDownloadedStep = getLatestDownloadedGfsRunStep(latestAvailableRun);
    const latestAvailableStep = await getLatestAvailableGfsRunStep(latestAvailableRun);
    if (latestDownloadedStep !== latestAvailableStep) {
        await downloadGfsStep(latestAvailableRun, latestAvailableStep, ['TMP', 'LAND', 'VEG', 'TCDC'], ['2']);
    }
})();