
const path = require('path');
const exec = require('promised-exec');
const request = require('request-promise-native');
const cheerio = require('cheerio');
const fs = require('fs');
const moment = require('moment');

const downloadDir = path.join(__dirname, '../download/');
const netcdfDir = path.join(__dirname, '../netcdf/');

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
    log(`Getting latest downloaded GFS steps for run [${runCode}]`);
    const stepDownloadDir = path.join(downloadDir, `gfs.${runCode}`);
    await exec(`mkdir -p ${stepDownloadDir}`);
    const latestDownloadedSteps = fs.readdirSync(stepDownloadDir)
        .filter(file => file.slice(-5).match(/\.f[0-9]+/))
        .map(file => file.split('.').slice(-1)[0].slice(1))
        .map(stepHour => parseInt(stepHour))
        .sort(((a, b) => a - b))
        .reverse();
    return latestDownloadedSteps;
}


async function getConvertedGfsRunSteps(runCode) {
    log(`Getting converted GFS steps for run [${runCode}]`);
    const stepNetcdfDir = path.join(netcdfDir, `gfs.${runCode}`);
    await exec(`mkdir -p ${stepNetcdfDir}`);
    const latestDownloadedSteps = fs.readdirSync(stepNetcdfDir)
        .filter(file => file.match(/\f[0-9]+/))
        .map(file => file.split('.')[0].slice(1))
        .map(stepHour => parseInt(stepHour))
        .sort(((a, b) => a - b))
        .reverse();
    return latestDownloadedSteps;
}

function log(...messages) {
    console.log(`[${(new Date()).toUTCString()}]`, ...messages);
}

module.exports = {
    getLatestAvailableGfsRun,
    getAvailableGfsRunSteps,
    getLatestDownloadedGfsRun,
    getDownloadedGfsRunSteps,
    getConvertedGfsRunSteps,
    downloadDir,
    log
};