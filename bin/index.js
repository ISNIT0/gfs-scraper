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
var yargs = require("yargs");
var moment = require("moment");
var util_1 = require("./util");
var child_process_1 = require("child_process");
util_1.log('\n\n\n==================== Starting GFS Downloader ====================');
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
}, function (argv) {
    return __awaiter(this, void 0, void 0, function () {
        var runToFetch, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    runToFetch = argv.run;
                    if (!(runToFetch === 'latest')) return [3 /*break*/, 2];
                    return [4 /*yield*/, util_1.getLatestAvailableGfsRun()];
                case 1:
                    runToFetch = _a.sent();
                    _a.label = 2;
                case 2: return [4 /*yield*/, util_1.downloadAllStepsForRun(argv.downloadDirectory, runToFetch)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _a.sent();
                    util_1.log("Failed to run command:", err_1);
                    return [3 /*break*/, 5];
                case 5:
                    util_1.log('\n=================== Finishing GFS Downloader ===================\n\n');
                    return [2 /*return*/];
            }
        });
    });
})
    .command('downloadStep', 'Download specific parameters/heights from a specific run/step', {
    outFile: {
        describe: 'Path the result should be saved in',
        type: 'string',
        demand: true
    },
    parameterHeightGroups: {
        describe: "\"all\" or the parameters/heights you'd like to download",
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
}, function (argv) {
    return __awaiter(this, void 0, void 0, function () {
        var date, runHours, phGroups, url;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    date = moment(argv.run, 'YYYYMMDDHH');
                    runHours = util_1.leftPad(date.get('hours'), 2);
                    phGroups = argv.parameterHeightGroups.map(function (ph) {
                        var _a = ph.replace(/ /g, '').split(':'), p = _a[0], h = _a[1];
                        return { parameter: p, height: h };
                    });
                    url = "http://www.ftp.ncep.noaa.gov/data/nccf/com/gfs/prod/gfs." + argv.run + "/gfs.t" + runHours + "z.pgrb2.0p25.f" + argv.step;
                    return [4 /*yield*/, util_1.customDownloadGfsStepParams(argv.outFile, url, phGroups)];
                case 1:
                    _a.sent();
                    util_1.log('\n=================== Finishing GFS Downloader ===================\n\n');
                    return [2 /*return*/];
            }
        });
    });
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
}, function (argv) {
    return __awaiter(this, void 0, void 0, function () {
        var out, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, child_process_1.exec(argv.wgrib2 + " -s \"" + argv.inFile + "\" | " + argv.wgrib2 + " -i \"" + argv.inFile + "\" -netcdf \"" + argv.outFile + "\"")];
                case 1:
                    out = _a.sent();
                    out.stdout.on('data', function (msg) { return console.info('INFO:', msg); });
                    out.stderr.on('data', function (msg) { return console.error('ERR:', msg); });
                    return [3 /*break*/, 3];
                case 2:
                    err_2 = _a.sent();
                    console.error("Error converting grib file:", err_2);
                    return [3 /*break*/, 3];
                case 3:
                    util_1.log('\n=================== Finishing GFS Downloader ===================\n\n');
                    return [2 /*return*/];
            }
        });
    });
})
    .demandCommand(1, 'Please specify at least one command')
    .help()
    .argv;
