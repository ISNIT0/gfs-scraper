import * as path from 'path';
import exec = require('promised-exec');
import * as request from 'request-promise-native';
import * as normalRequest from 'request';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as moment from 'moment';

export function leftPad(number: any, targetLength: number) {
    const str = String(number);
    return '0'.repeat(Math.max(targetLength - str.length, 0)) + str;
}

export function getLatestAvailableGfsRun() {
    log(`Getting latest available GFS runs`);
    return request.get(`http://www.ftp.ncep.noaa.gov/data/nccf/com/gfs/prod/`)
        .then((html: string) => {
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

export function getAvailableGfsRunSteps(gfsRunCode: string): Promise<number[]> {
    log(`Getting latest available GFS step for run [${gfsRunCode}]`);
    return request.get(`http://www.ftp.ncep.noaa.gov/data/nccf/com/gfs/prod/gfs.${gfsRunCode}/`)
        .then(html => {
            const $ = cheerio.load(html);
            return $('a')
                .toArray()
                .map((el: any) => <string>$(el).attr('href'))
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

export function getLatestDownloadedGfsRun(downloadDir: string) {
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

export async function getDownloadedGfsRunSteps(downloadDir: string, runCode: string) {
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


// export async function getConvertedGfsRunSteps(runCode: string) {
//     log(`Getting converted GFS steps for run [${runCode}]`);
//     const stepNetcdfDir = path.join(netcdfDir, `gfs.${runCode}`);
//     await exec(`mkdir -p ${stepNetcdfDir}`);
//     const latestDownloadedSteps = fs.readdirSync(stepNetcdfDir)
//         .filter(file => file.match(/\f[0-9]+/))
//         .map(file => file.split('.')[0].slice(1))
//         .map(stepHour => parseInt(stepHour))
//         .sort(((a, b) => a - b))
//         .reverse();
//     return latestDownloadedSteps;
// }


export async function customDownloadGfsStepParams(outFile: string, url: string, parameterHeightGroups: { height: string, parameter: string }[] | 'all' = 'all') {
    return new Promise(async (resolve, reject) => {
        let reqHeaders = {};
        if (parameterHeightGroups !== 'all') {
            const inventoryStr = <string>await request.get(`${url}.idx`);
            const inventory = inventoryStr.split('\n')
                .map(invLine => {
                    const [index, byteStartPoint, date, parameter, height, fcst] = invLine.split(':');
                    return {
                        index, byteStartPoint, date, parameter, height, fcst
                    };
                })
                .reduce((acc: any, lineData, index, arr) => {
                    const nextLineData = arr[index + 1];
                    const { parameter, height, byteStartPoint } = lineData;
                    const key = `${parameter}-${height}`.replace(/ /g, '');

                    const fromBytes = byteStartPoint;

                    const toBytes = !!nextLineData ? nextLineData.byteStartPoint : '*';
                    acc[key] = [fromBytes, toBytes];
                    return acc;
                }, {});


            const rangeString = 'bytes=' + parameterHeightGroups.map(({ height, parameter }) => {
                const key = `${parameter}-${height}`;
                return inventory[key];
            })
                .sort(((a, b) => a[0] < b[0] ? 1 : -1))
                .map((bytes) => bytes.join('-'))
                .join(', ');

            reqHeaders = {
                "Range": rangeString
            };

        } else {
            // Download whole file
        }

        console.log(`Using Url:`, url);
        console.log(`Using Headers:`, reqHeaders);

        const fileWriteStream = fs.createWriteStream(outFile);
        normalRequest
            .get({
                url: url,
                headers: reqHeaders
            }, function () {
                fileWriteStream.on('finish', function () {
                    fileWriteStream.close();
                    resolve();
                });
            }).on('error', function (err) {
                fs.unlink(outFile, () => { });
                console.error(`Failed to download file:`, err);
                reject(err);
            })
            .pipe(fileWriteStream);
    });
}

export function log(...messages: any[]) {
    console.log(`[${(new Date()).toUTCString()}]`, ...messages);
}

export async function downloadGfsStep(downloadDir: string, runCode: string, firstStepNumber: number, lastStepNumber: number, parameters = ['all'], levels = ['all'], stepDifference = 3) {
    log(`Downloading GFS Step: [runCode=${runCode}] [firstStepNumber=${firstStepNumber}] [lastStepNumber=${lastStepNumber}] [stepDifference=${stepDifference}] [parameters=${parameters}] [levels=${levels}]`);
    const getGfsPath = path.join(__dirname, `../get_gfs.pl`);
    const targetPath = path.join(downloadDir, `gfs`, runCode);
    await exec(`mkdir -p ${targetPath}`);
    await exec(`perl ${getGfsPath} data ${runCode} ${firstStepNumber} ${lastStepNumber} ${stepDifference} ${parameters.join(':')} ${levels.join(':')} ${targetPath}`);
}

export async function downloadAllStepsForRun(downloadDir: string, runCode: string, parameters = ['all'], heights = ['all']) {
    const downloadedSteps = await getDownloadedGfsRunSteps(downloadDir, runCode);
    const availableSteps = await getAvailableGfsRunSteps(runCode);

    const stepsToDownload = availableSteps.filter(a => !~downloadedSteps.indexOf(a)).sort((a, b) => a - b);

    log(`Found [${availableSteps.length}] Steps - Already Downloaded [${downloadedSteps.length}] Steps - Downloading [${stepsToDownload.length}] Steps`);

    if (!availableSteps.length) {
        log(`No steps available for run [${runCode}]`);
        return;
    }

    if (!stepsToDownload.length) {
        log(`Already downloaded all available steps`);
        return;
    }

    const stepsByStepGap = stepsToDownload.reduce((acc: any, step, index, arr) => {
        const actualStep = step;
        const isLastStep = index === arr.length + 1;

        if (isLastStep) {
            index--;
            step = arr[index - 1];
        }

        const nextStep = arr[index + 1];
        const stepGap = nextStep - step;
        acc[stepGap] = acc[stepGap] || [];
        acc[stepGap].push(actualStep);

        return acc;
    }, {});

    for (let stepGap in stepsByStepGap) {
        log(`Downloading range [${stepsToDownload[0]}] to [${stepsToDownload.slice(-1)[0]}] with [stepGap=${stepGap}]`);

        const steps = stepsByStepGap[stepGap];

        await downloadGfsStep(downloadDir, runCode, steps[0], steps.slice(-1)[0], parameters, heights, parseInt(stepGap));
    }
}