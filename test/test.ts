import * as os from 'os';
import * as path from 'path';
import test from 'blue-tape';
import { leftPad, getLatestAvailableGfsRun, getAvailableGfsRunSteps, downloadAllStepsForGFSRun, getLatestDownloadedGfsRun, getDownloadedGfsRunSteps } from 'src/util';
import moment from 'moment';

const TMP_WRITE_DIR = path.join(os.tmpdir(), 'gfs-scraper');
console.info(`✅  Downloading test files to [${TMP_WRITE_DIR}] ✅`);

const FULL_TEST = process.env.TEST_MODE === 'full';

if (FULL_TEST) {
    console.info(`⌛  Doing full test, this will download an entire GFS run. It'll take a while ⌛`);
} else {
    console.info(`ℹ️  Skipping full run download, to test this too, set [TEST_MODE=full] env var ℹ️`);
}

test(`Sanity Check leftPad`, async (t) => {
    const randomNumber = Math.floor(Math.random() * 10);
    t.equal(leftPad(randomNumber, 3), `00${randomNumber}`, `leftPad pads one digit numbers`);
    t.equal(leftPad(randomNumber * 10, 3), `0${randomNumber}0`, `leftPad pads two digit numbers`);
    t.equal(leftPad(randomNumber * 100, 3), `${randomNumber}00`, `leftPad pads three digit numbers`);
});

test(`getLatestAvailableGfsRun`, async (t) => {
    const latestRun = await getLatestAvailableGfsRun();
    const date = moment(latestRun, 'YYYYMMDDhh');
    t.ok(date.isValid(), 'Date is valid');
    t.ok(date.hours() % 6 === 0, 'Hour is multiple of 6');
});

test(`getAvailableGfsRunSteps`, async (t) => {
    const latestRun = await getLatestAvailableGfsRun();
    const steps = await getAvailableGfsRunSteps(latestRun);
    t.ok(Array.isArray(steps), 'Returns step array');
    t.ok(steps.length <= 128, 'Returns the correct number of steps');

    const allStepsAreMultOf3 = steps.every((step) => step % 3 === 0);
    t.ok(allStepsAreMultOf3, 'All steps are a multiple of 3');
});

if (FULL_TEST) {
    test(`downloadAllStepsForGFSRun and check`, async (t) => {
        const latestRun = await getLatestAvailableGfsRun();
        const [steps] = await Promise.all([
            getAvailableGfsRunSteps(latestRun),
            downloadAllStepsForGFSRun(TMP_WRITE_DIR, latestRun),
        ]);
        const latestDownloadedRun = getLatestDownloadedGfsRun(TMP_WRITE_DIR);
        t.equal(latestDownloadedRun, latestRun, 'Run correct run was downloaded');

        const downloadedSteps = await getDownloadedGfsRunSteps(TMP_WRITE_DIR, latestDownloadedRun);

        t.equal(downloadedSteps.length, steps.length, 'Same number of steps were downloaded');
    });
}
