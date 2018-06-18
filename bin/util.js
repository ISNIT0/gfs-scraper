"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var exec = require("promised-exec");
var request = require("request-promise-native");
var normalRequest = require("request");
var cheerio = require("cheerio");
var fs = require("fs");
var moment = require("moment");
function leftPad(number, targetLength) {
    var str = String(number);
    return '0'.repeat(Math.max(targetLength - str.length, 0)) + str;
}
exports.leftPad = leftPad;
function getLatestAvailableGfsRun() {
    log("Getting latest available GFS runs");
    return request.get("http://www.ftp.ncep.noaa.gov/data/nccf/com/gfs/prod/")
        .then(function (html) {
        var $ = cheerio.load(html);
        var latestGfs = $('a')
            .toArray()
            .map(function (el) { return $(el).attr('href'); })
            .filter(function (a) { return a; })
            .filter(function (href) { return href.startsWith('gfs.'); })
            .map(function (href) {
            return href.replace(/[^0-9]/g, '');
        })
            .sort(function (a, b) {
            return moment(a, 'YYYYMMDDHH').valueOf() > moment(b, 'YYYYMMDDHH').valueOf() ? 1 : -1;
        })
            .reverse()[0];
        return latestGfs;
    });
}
exports.getLatestAvailableGfsRun = getLatestAvailableGfsRun;
function getAvailableGfsRunSteps(gfsRunCode) {
    log("Getting latest available GFS step for run [" + gfsRunCode + "]");
    return request.get("http://www.ftp.ncep.noaa.gov/data/nccf/com/gfs/prod/gfs." + gfsRunCode + "/")
        .then(function (html) {
        var $ = cheerio.load(html);
        return $('a')
            .toArray()
            .map(function (el) { return $(el).attr('href'); })
            .filter(function (a) { return a; })
            .filter(function (href) { return href.startsWith('gfs.'); })
            .filter(function (file) { return file.slice(-5).match(/\.f[0-9]+$/); })
            .filter(function (file) { return !!~file.indexOf('.pgrb2.1'); })
            .map(function (file) { return file.split('.').slice(-1)[0]; })
            .map(function (href) { return href.slice(1); })
            .map(function (stepHour) { return parseInt(stepHour); })
            .reverse();
    });
}
exports.getAvailableGfsRunSteps = getAvailableGfsRunSteps;
function getLatestDownloadedGfsRun(downloadDir) {
    var downloads = fs.readdirSync(downloadDir);
    var latestDownloaded = downloads
        .filter(function (dir) { return dir.startsWith('gfs.'); })
        .map(function (dir) {
        return dir.replace(/[^0-9]/g, '');
    })
        .sort(function (a, b) {
        return moment(a, 'YYYYMMDDHH').valueOf() > moment(b, 'YYYYMMDDHH').valueOf() ? 1 : -1;
    })[0];
    return latestDownloaded;
}
exports.getLatestDownloadedGfsRun = getLatestDownloadedGfsRun;
function getDownloadedGfsRunSteps(downloadDir, runCode) {
    return __awaiter(this, void 0, void 0, function () {
        var stepDownloadDir, latestDownloadedSteps;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    log("Getting latest downloaded GFS steps for run [" + runCode + "]");
                    stepDownloadDir = path.join(downloadDir, "gfs." + runCode);
                    return [4 /*yield*/, exec("mkdir -p " + stepDownloadDir)];
                case 1:
                    _a.sent();
                    latestDownloadedSteps = fs.readdirSync(stepDownloadDir)
                        .filter(function (file) { return file.slice(-5).match(/\.f[0-9]+/); })
                        .map(function (file) { return file.split('.').slice(-1)[0].slice(1); })
                        .map(function (stepHour) { return parseInt(stepHour); })
                        .sort((function (a, b) { return a - b; }))
                        .reverse();
                    return [2 /*return*/, latestDownloadedSteps];
            }
        });
    });
}
exports.getDownloadedGfsRunSteps = getDownloadedGfsRunSteps;
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
function customDownloadGfsStepParams(outFile, url, parameterHeightGroups) {
    if (parameterHeightGroups === void 0) { parameterHeightGroups = 'all'; }
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                    var reqHeaders, inventoryStr, inventory_1, rangeString, fileWriteStream;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                reqHeaders = {};
                                if (!(parameterHeightGroups !== 'all')) return [3 /*break*/, 2];
                                return [4 /*yield*/, request.get(url + ".idx")];
                            case 1:
                                inventoryStr = _a.sent();
                                inventory_1 = inventoryStr.split('\n')
                                    .map(function (invLine) {
                                    var _a = invLine.split(':'), index = _a[0], byteStartPoint = _a[1], date = _a[2], parameter = _a[3], height = _a[4], fcst = _a[5];
                                    return {
                                        index: index, byteStartPoint: byteStartPoint, date: date, parameter: parameter, height: height, fcst: fcst
                                    };
                                })
                                    .reduce(function (acc, lineData, index, arr) {
                                    var nextLineData = arr[index + 1];
                                    var parameter = lineData.parameter, height = lineData.height, byteStartPoint = lineData.byteStartPoint;
                                    var key = (parameter + "-" + height).replace(/ /g, '');
                                    var fromBytes = byteStartPoint;
                                    var toBytes = !!nextLineData ? nextLineData.byteStartPoint : '*';
                                    acc[key] = [fromBytes, toBytes];
                                    return acc;
                                }, {});
                                rangeString = 'bytes=' + parameterHeightGroups.map(function (_a) {
                                    var height = _a.height, parameter = _a.parameter;
                                    var key = parameter + "-" + height;
                                    return inventory_1[key];
                                })
                                    .sort((function (a, b) { return a[0] < b[0] ? 1 : -1; }))
                                    .map(function (bytes) { return bytes.join('-'); })
                                    .join(', ');
                                reqHeaders = {
                                    "Range": rangeString
                                };
                                return [3 /*break*/, 2];
                            case 2:
                                console.log("Using Url:", url);
                                console.log("Using Headers:", reqHeaders);
                                fileWriteStream = fs.createWriteStream(outFile);
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
                                    fs.unlink(outFile, function () { });
                                    console.error("Failed to download file:", err);
                                    reject(err);
                                })
                                    .pipe(fileWriteStream);
                                return [2 /*return*/];
                        }
                    });
                }); })];
        });
    });
}
exports.customDownloadGfsStepParams = customDownloadGfsStepParams;
function log() {
    var messages = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        messages[_i] = arguments[_i];
    }
    console.log.apply(console, ["[" + (new Date()).toUTCString() + "]"].concat(messages));
}
exports.log = log;
function downloadGfsStep(downloadDir, runCode, firstStepNumber, lastStepNumber, parameters, levels, stepDifference) {
    if (parameters === void 0) { parameters = ['all']; }
    if (levels === void 0) { levels = ['all']; }
    if (stepDifference === void 0) { stepDifference = 3; }
    return __awaiter(this, void 0, void 0, function () {
        var getGfsPath, targetPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    log("Downloading GFS Step: [runCode=" + runCode + "] [firstStepNumber=" + firstStepNumber + "] [lastStepNumber=" + lastStepNumber + "] [stepDifference=" + stepDifference + "] [parameters=" + parameters + "] [levels=" + levels + "]");
                    getGfsPath = path.join(__dirname, "../get_gfs.pl");
                    targetPath = path.join(downloadDir, "gfs", runCode);
                    return [4 /*yield*/, exec("mkdir -p " + targetPath)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, exec("perl " + getGfsPath + " data " + runCode + " " + firstStepNumber + " " + lastStepNumber + " " + stepDifference + " " + parameters.join(':') + " " + levels.join(':') + " " + targetPath)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.downloadGfsStep = downloadGfsStep;
function downloadAllStepsForRun(downloadDir, runCode, parameters, heights) {
    if (parameters === void 0) { parameters = ['all']; }
    if (heights === void 0) { heights = ['all']; }
    return __awaiter(this, void 0, void 0, function () {
        var downloadedSteps, availableSteps, stepsToDownload, stepsByStepGap, date, runHours, _a, _b, _i, stepGap, steps, downloadPath, _c, _d, _e, step, downloadTarget, url;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, getDownloadedGfsRunSteps(downloadDir, runCode)];
                case 1:
                    downloadedSteps = _f.sent();
                    return [4 /*yield*/, getAvailableGfsRunSteps(runCode)];
                case 2:
                    availableSteps = _f.sent();
                    stepsToDownload = availableSteps.filter(function (a) { return !~downloadedSteps.indexOf(a); }).sort(function (a, b) { return a - b; });
                    log("Found [" + availableSteps.length + "] Steps - Already Downloaded [" + downloadedSteps.length + "] Steps - Downloading [" + stepsToDownload.length + "] Steps");
                    if (!availableSteps.length) {
                        log("No steps available for run [" + runCode + "]");
                        return [2 /*return*/];
                    }
                    if (!stepsToDownload.length) {
                        log("Already downloaded all available steps");
                        return [2 /*return*/];
                    }
                    stepsByStepGap = stepsToDownload.reduce(function (acc, step, index, arr) {
                        var actualStep = step;
                        var isLastStep = index === arr.length + 1;
                        if (isLastStep) {
                            index--;
                            step = arr[index - 1];
                        }
                        var nextStep = arr[index + 1];
                        var stepGap = nextStep - step;
                        acc[stepGap] = acc[stepGap] || [];
                        acc[stepGap].push(actualStep);
                        return acc;
                    }, {});
                    date = moment(runCode, 'YYYYMMDDHH');
                    runHours = leftPad(date.get('hours'), 2);
                    _a = [];
                    for (_b in stepsByStepGap)
                        _a.push(_b);
                    _i = 0;
                    _f.label = 3;
                case 3:
                    if (!(_i < _a.length)) return [3 /*break*/, 9];
                    stepGap = _a[_i];
                    log("Downloading range [" + stepsToDownload[0] + "] to [" + stepsToDownload.slice(-1)[0] + "] with [stepGap=" + stepGap + "]");
                    steps = stepsByStepGap[stepGap];
                    downloadPath = path.join(downloadDir, runCode);
                    return [4 /*yield*/, exec("mkdir -p " + downloadPath)];
                case 4:
                    _f.sent();
                    _c = [];
                    for (_d in steps)
                        _c.push(_d);
                    _e = 0;
                    _f.label = 5;
                case 5:
                    if (!(_e < _c.length)) return [3 /*break*/, 8];
                    step = _c[_e];
                    downloadTarget = path.join(downloadPath, leftPad(step, 3) + ".grib2");
                    url = "http://www.ftp.ncep.noaa.gov/data/nccf/com/gfs/prod/gfs." + runCode + "/gfs.t" + runHours + "z.pgrb2.0p25.f" + leftPad(step, 3);
                    return [4 /*yield*/, customDownloadGfsStepParams(downloadTarget, url, 'all')];
                case 6:
                    _f.sent();
                    _f.label = 7;
                case 7:
                    _e++;
                    return [3 /*break*/, 5];
                case 8:
                    _i++;
                    return [3 /*break*/, 3];
                case 9: return [2 /*return*/];
            }
        });
    });
}
exports.downloadAllStepsForRun = downloadAllStepsForRun;
