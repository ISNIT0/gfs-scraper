const path = require('path');
const exec = require('promised-exec');

const {
    getLatestAvailableGfsRun,
    getAvailableGfsRunSteps,
    getDownloadedGfsRunSteps,
    downloadDir,
    log
} = require('./util');

log(`Using download directory [${downloadDir}]`);


async function downloadGfsStep(runCode, firstStepNumber, lastStepNumber, parameters = ['all'], levels = ['all'], stepDifference = 3) {
    log(`Downloading GFS Step: [runCode=${runCode}] [firstStepNumber=${firstStepNumber}] [lastStepNumber=${lastStepNumber}] [stepDifference=${stepDifference}] [parameters=${parameters}] [levels=${levels}]`);
    const getGfsPath = path.join(downloadDir, `../get_gfs.pl`);
    const targetPath = path.join(downloadDir, `gfs.${runCode}`);
    await exec(`mkdir -p ${targetPath}`);
    await exec(`perl ${getGfsPath} data ${runCode} ${firstStepNumber} ${lastStepNumber} ${stepDifference} ${parameters.join(':')} ${levels.join(':')} ${targetPath}`);
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

        const stepsByStepGap = stepsToDownload.reduce((acc, step, index, arr) => {
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

        for(let stepGap in stepsByStepGap) {
            log(`Downloading range [${stepsToDownload[0]}] to [${stepsToDownload.slice(-1)[0]}] with [stepGap=${stepGap}]`);
    
            const steps = stepsByStepGap[stepGap];

            await downloadGfsStep(latestAvailableRun, steps[0], steps.slice(-1)[0], ['TMP', 'LAND', 'VEG', 'TCDC'], ['2'], stepGap);
        }


        await run();

    } catch (err) {
        console.error(err);
    }
})();