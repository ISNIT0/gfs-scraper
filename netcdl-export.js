const {
    getLatestAvailableGfsRun,
    getDownloadedGfsRunSteps,
    getConvertedGfsRunSteps,
    log
} = require('./util');

(async function run() {
    try {
        const latestAvailableRun = await getLatestAvailableGfsRun();
        const downloadedSteps = await getDownloadedGfsRunSteps(latestAvailableRun);
        const convertedSteps = await getConvertedGfsRunSteps(latestAvailableRun);

        const stepsToConvert = downloadedSteps.filter(a => !~convertedSteps.indexOf(a)).sort((a, b) => a - b);

        log(`Found [${downloadedSteps.length}] Steps - Already Converted [${convertedSteps.length}] Steps - Converting [${stepsToConvert.length}] Steps`);

        if (!downloadedSteps.length) {
            log(`No steps available for run [${latestAvailableRun}]`);
            return;
        }

        if (!stepsToConvert.length) {
            log(`Already converted all available steps`);
            return;
        }

        for (let step of stepsToConvert) {
            log(`Converting step [${step}]`);

            await convertGfsStep(latestAvailableRun, step);
        }


        await run();

    } catch (err) {
        console.error(err);
    }
})();