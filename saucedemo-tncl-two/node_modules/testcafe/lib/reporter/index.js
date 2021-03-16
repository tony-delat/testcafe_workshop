"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const is_stream_1 = require("is-stream");
const plugin_host_1 = __importDefault(require("./plugin-host"));
const plugin_methods_1 = __importDefault(require("./plugin-methods"));
const format_command_1 = __importDefault(require("./command/format-command"));
const get_browser_1 = __importDefault(require("../utils/get-browser"));
const runtime_1 = require("../errors/runtime");
class Reporter {
    constructor(plugin, task, outStream, name) {
        this.plugin = new plugin_host_1.default(plugin, outStream, name);
        this.task = task;
        this.disposed = false;
        this.passed = 0;
        this.failed = 0;
        this.skipped = 0;
        this.testCount = task.tests.filter(test => !test.skip).length;
        this.reportQueue = Reporter._createReportQueue(task);
        this.stopOnFirstFail = task.opts.stopOnFirstFail;
        this.outStream = outStream;
        this.pendingTaskDonePromise = Reporter._createPendingPromise();
        this._assignTaskEventHandlers();
    }
    static _isSpecialStream(stream) {
        return stream.isTTY || stream === process.stdout || stream === process.stderr;
    }
    static _createPendingPromise() {
        let resolver = null;
        const promise = new Promise(resolve => {
            resolver = resolve;
        });
        promise.resolve = resolver;
        return promise;
    }
    static _createReportItem(test, runsPerTest) {
        return {
            fixture: test.fixture,
            test: test,
            testRunIds: [],
            screenshotPath: null,
            screenshots: [],
            videos: [],
            quarantine: null,
            errs: [],
            warnings: [],
            unstable: false,
            startTime: null,
            testRunInfo: null,
            pendingRuns: runsPerTest,
            pendingStarts: runsPerTest,
            pendingTestRunDonePromise: Reporter._createPendingPromise(),
            pendingTestRunStartPromise: Reporter._createPendingPromise(),
            browsers: []
        };
    }
    static _createReportQueue(task) {
        const runsPerTest = task.browserConnectionGroups.length;
        return task.tests.map(test => Reporter._createReportItem(test, runsPerTest));
    }
    static _createTestRunInfo(reportItem) {
        return {
            errs: lodash_1.sortBy(reportItem.errs, ['userAgent', 'code']),
            warnings: reportItem.warnings,
            durationMs: new Date() - reportItem.startTime,
            unstable: reportItem.unstable,
            screenshotPath: reportItem.screenshotPath,
            screenshots: reportItem.screenshots,
            videos: reportItem.videos,
            quarantine: reportItem.quarantine,
            skipped: reportItem.test.skip,
            browsers: reportItem.browsers,
            testId: reportItem.test.id
        };
    }
    _getReportItemForTestRun(testRun) {
        return lodash_1.find(this.reportQueue, i => i.test === testRun.test);
    }
    async _shiftReportQueue(reportItem) {
        let currentFixture = null;
        let nextReportItem = null;
        while (this.reportQueue.length && this.reportQueue[0].testRunInfo) {
            reportItem = this.reportQueue.shift();
            currentFixture = reportItem.fixture;
            // NOTE: here we assume that tests are sorted by fixture.
            // Therefore, if the next report item has a different
            // fixture, we can report this fixture start.
            nextReportItem = this.reportQueue[0];
            await this.dispatchToPlugin({
                method: plugin_methods_1.default.reportTestDone,
                args: [
                    reportItem.test.name,
                    reportItem.testRunInfo,
                    reportItem.test.meta
                ]
            });
            if (!nextReportItem)
                continue;
            if (nextReportItem.fixture === currentFixture)
                continue;
            await this.dispatchToPlugin({
                method: plugin_methods_1.default.reportFixtureStart,
                args: [
                    nextReportItem.fixture.name,
                    nextReportItem.fixture.path,
                    nextReportItem.fixture.meta
                ]
            });
        }
    }
    async _resolveReportItem(reportItem, testRun) {
        if (this.task.screenshots.hasCapturedFor(testRun.test)) {
            reportItem.screenshotPath = this.task.screenshots.getPathFor(testRun.test);
            reportItem.screenshots = this.task.screenshots.getScreenshotsInfo(testRun.test);
        }
        if (this.task.videos)
            reportItem.videos = this.task.videos.getTestVideos(reportItem.test.id);
        if (testRun.quarantine) {
            reportItem.quarantine = testRun.quarantine.attempts.reduce((result, errors, index) => {
                const passed = !errors.length;
                const quarantineAttempt = index + 1;
                result[quarantineAttempt] = { passed };
                return result;
            }, {});
        }
        if (!reportItem.testRunInfo) {
            reportItem.testRunInfo = Reporter._createTestRunInfo(reportItem);
            if (reportItem.test.skip)
                this.skipped++;
            else if (reportItem.errs.length)
                this.failed++;
            else
                this.passed++;
        }
        await this._shiftReportQueue(reportItem);
        reportItem.pendingTestRunDonePromise.resolve();
    }
    _prepareReportTestActionEventArgs({ command, duration, result, testRun, err }) {
        const args = {};
        if (err)
            args.err = err;
        if (typeof duration === 'number')
            args.duration = duration;
        return Object.assign(args, {
            testRunId: testRun.id,
            test: {
                id: testRun.test.id,
                name: testRun.test.name,
                phase: testRun.phase,
            },
            fixture: {
                name: testRun.test.fixture.name,
                id: testRun.test.fixture.id
            },
            command: format_command_1.default(command, result),
            browser: testRun.controller.browser,
        });
    }
    async dispatchToPlugin({ method, args = [] }) {
        try {
            await this.plugin[method](...args);
        }
        catch (originalError) {
            const uncaughError = new runtime_1.ReporterPluginError({
                name: this.plugin.name,
                method,
                originalError
            });
            this.task.emit('error', uncaughError);
        }
    }
    async _onceTaskStartHandler() {
        const startTime = new Date();
        const userAgents = this.task.browserConnectionGroups.map(group => group[0].userAgent);
        const first = this.reportQueue[0];
        const taskProperties = {
            configuration: this.task.opts
        };
        await this.dispatchToPlugin({
            method: plugin_methods_1.default.reportTaskStart,
            args: [
                startTime,
                userAgents,
                this.testCount,
                this.task.testStructure,
                taskProperties
            ]
        });
        await this.dispatchToPlugin({
            method: plugin_methods_1.default.reportFixtureStart,
            args: [
                first.fixture.name,
                first.fixture.path,
                first.fixture.meta
            ]
        });
    }
    async _onTaskTestRunStartHandler(testRun) {
        const reportItem = this._getReportItemForTestRun(testRun);
        reportItem.testRunIds.push(testRun.id);
        if (!reportItem.startTime)
            reportItem.startTime = new Date();
        reportItem.pendingStarts--;
        if (!reportItem.pendingStarts) {
            if (this.plugin.reportTestStart) {
                const testStartInfo = { testRunIds: reportItem.testRunIds, testId: reportItem.test.id };
                await this.dispatchToPlugin({
                    method: plugin_methods_1.default.reportTestStart,
                    args: [
                        reportItem.test.name,
                        reportItem.test.meta,
                        testStartInfo
                    ]
                });
            }
            reportItem.pendingTestRunStartPromise.resolve();
        }
        return reportItem.pendingTestRunStartPromise;
    }
    async _onTaskTestRunDoneHandler(testRun) {
        const reportItem = this._getReportItemForTestRun(testRun);
        const isTestRunStoppedTaskExecution = !!testRun.errs.length && this.stopOnFirstFail;
        reportItem.pendingRuns = isTestRunStoppedTaskExecution ? 0 : reportItem.pendingRuns - 1;
        reportItem.unstable = reportItem.unstable || testRun.unstable;
        reportItem.errs = reportItem.errs.concat(testRun.errs);
        reportItem.warnings = testRun.warningLog ? lodash_1.union(reportItem.warnings, testRun.warningLog.messages) : [];
        reportItem.browsers.push(Object.assign({ testRunId: testRun.id }, get_browser_1.default(testRun.browserConnection)));
        if (!reportItem.pendingRuns)
            await this._resolveReportItem(reportItem, testRun);
        await reportItem.pendingTestRunDonePromise;
    }
    async _onTaskTestActionStart(_a) {
        var { apiActionName } = _a, restArgs = __rest(_a, ["apiActionName"]);
        if (this.plugin.reportTestActionStart) {
            restArgs = this._prepareReportTestActionEventArgs(restArgs);
            await this.dispatchToPlugin({
                method: plugin_methods_1.default.reportTestActionStart,
                args: [
                    apiActionName,
                    restArgs
                ]
            });
        }
    }
    async _onTaskTestActionDone(_a) {
        var { apiActionName } = _a, restArgs = __rest(_a, ["apiActionName"]);
        if (this.plugin.reportTestActionDone) {
            restArgs = this._prepareReportTestActionEventArgs(restArgs);
            await this.dispatchToPlugin({
                method: plugin_methods_1.default.reportTestActionDone,
                args: [
                    apiActionName,
                    restArgs
                ]
            });
        }
    }
    async _onceTaskDoneHandler() {
        const endTime = new Date();
        const result = {
            passedCount: this.passed,
            failedCount: this.failed,
            skippedCount: this.skipped
        };
        await this.dispatchToPlugin({
            method: plugin_methods_1.default.reportTaskDone,
            args: [
                endTime,
                this.passed,
                this.task.warningLog.messages,
                result
            ]
        });
        this.pendingTaskDonePromise.resolve();
    }
    _assignTaskEventHandlers() {
        const task = this.task;
        task.once('start', async () => await this._onceTaskStartHandler());
        task.on('test-run-start', async (testRun) => await this._onTaskTestRunStartHandler(testRun));
        task.on('test-run-done', async (testRun) => await this._onTaskTestRunDoneHandler(testRun));
        task.on('test-action-start', async (e) => await this._onTaskTestActionStart(e));
        task.on('test-action-done', async (e) => await this._onTaskTestActionDone(e));
        task.once('done', async () => await this._onceTaskDoneHandler());
    }
    async dispose() {
        if (this.disposed)
            return Promise.resolve();
        this.disposed = true;
        if (!this.outStream || Reporter._isSpecialStream(this.outStream) || !is_stream_1.writable(this.outStream))
            return Promise.resolve();
        const streamFinishedPromise = new Promise(resolve => {
            this.outStream.once('finish', resolve);
            this.outStream.once('error', resolve);
        });
        this.outStream.end();
        return streamFinishedPromise;
    }
}
exports.default = Reporter;
module.exports = exports.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcmVwb3J0ZXIvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG1DQUlnQjtBQUVoQix5Q0FBeUQ7QUFDekQsZ0VBQStDO0FBQy9DLHNFQUFvRDtBQUNwRCw4RUFBcUQ7QUFDckQsdUVBQThDO0FBQzlDLCtDQUF3RDtBQUV4RCxNQUFxQixRQUFRO0lBQ3pCLFlBQWEsTUFBTSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSTtRQUN0QyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUkscUJBQWtCLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM5RCxJQUFJLENBQUMsSUFBSSxHQUFLLElBQUksQ0FBQztRQUVuQixJQUFJLENBQUMsUUFBUSxHQUFVLEtBQUssQ0FBQztRQUM3QixJQUFJLENBQUMsTUFBTSxHQUFZLENBQUMsQ0FBQztRQUN6QixJQUFJLENBQUMsTUFBTSxHQUFZLENBQUMsQ0FBQztRQUN6QixJQUFJLENBQUMsT0FBTyxHQUFXLENBQUMsQ0FBQztRQUN6QixJQUFJLENBQUMsU0FBUyxHQUFTLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQ3BFLElBQUksQ0FBQyxXQUFXLEdBQU8sUUFBUSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pELElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUM7UUFDakQsSUFBSSxDQUFDLFNBQVMsR0FBUyxTQUFTLENBQUM7UUFFakMsSUFBSSxDQUFDLHNCQUFzQixHQUFHLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1FBRS9ELElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO0lB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LE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRTdCLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDaEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMxQyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFckIsT0FBTyxxQkFBcUIsQ0FBQztJQUNqQyxDQUFDO0NBQ0o7QUF2V0QsMkJBdVdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgICBmaW5kLFxuICAgIHNvcnRCeSxcbiAgICB1bmlvblxufSBmcm9tICdsb2Rhc2gnO1xuXG5pbXBvcnQgeyB3cml0YWJsZSBhcyBpc1dyaXRhYmxlU3RyZWFtIH0gZnJvbSAnaXMtc3RyZWFtJztcbmltcG9ydCBSZXBvcnRlclBsdWdpbkhvc3QgZnJvbSAnLi9wbHVnaW4taG9zdCc7XG5pbXBvcnQgUmVwb3J0ZXJQbHVnaW5NZXRob2QgZnJvbSAnLi9wbHVnaW4tbWV0aG9kcyc7XG5pbXBvcnQgZm9ybWF0Q29tbWFuZCBmcm9tICcuL2NvbW1hbmQvZm9ybWF0LWNvbW1hbmQnO1xuaW1wb3J0IGdldEJyb3dzZXIgZnJvbSAnLi4vdXRpbHMvZ2V0LWJyb3dzZXInO1xuaW1wb3J0IHsgUmVwb3J0ZXJQbHVnaW5FcnJvciB9IGZyb20gJy4uL2Vycm9ycy9ydW50aW1lJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVwb3J0ZXIge1xuICAgIGNvbnN0cnVjdG9yIChwbHVnaW4sIHRhc2ssIG91dFN0cmVhbSwgbmFtZSkge1xuICAgICAgICB0aGlzLnBsdWdpbiA9IG5ldyBSZXBvcnRlclBsdWdpbkhvc3QocGx1Z2luLCBvdXRTdHJlYW0sIG5hbWUpO1xuICAgICAgICB0aGlzLnRhc2sgICA9IHRhc2s7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NlZCAgICAgICAgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5wYXNzZWQgICAgICAgICAgPSAwO1xuICAgICAgICB0aGlzLmZhaWxlZCAgICAgICAgICA9IDA7XG4gICAgICAgIHRoaXMuc2tpcHBlZCAgICAgICAgID0gMDtcbiAgICAgICAgdGhpcy50ZXN0Q291bnQgICAgICAgPSB0YXNrLnRlc3RzLmZpbHRlcih0ZXN0ID0+ICF0ZXN0LnNraXApLmxlbmd0aDtcbiAgICAgICAgdGhpcy5yZXBvcnRRdWV1ZSAgICAgPSBSZXBvcnRlci5fY3JlYXRlUmVwb3J0UXVldWUodGFzayk7XG4gICAgICAgIHRoaXMuc3RvcE9uRmlyc3RGYWlsID0gdGFzay5vcHRzLnN0b3BPbkZpcnN0RmFpbDtcbiAgICAgICAgdGhpcy5vdXRTdHJlYW0gICAgICAgPSBvdXRTdHJlYW07XG5cbiAgICAgICAgdGhpcy5wZW5kaW5nVGFza0RvbmVQcm9taXNlID0gUmVwb3J0ZXIuX2NyZWF0ZVBlbmRpbmdQcm9taXNlKCk7XG5cbiAgICAgICAgdGhpcy5fYXNzaWduVGFza0V2ZW50SGFuZGxlcnMoKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgX2lzU3BlY2lhbFN0cmVhbSAoc3RyZWFtKSB7XG4gICAgICAgIHJldHVybiBzdHJlYW0uaXNUVFkgfHwgc3RyZWFtID09PSBwcm9jZXNzLnN0ZG91dCB8fCBzdHJlYW0gPT09IHByb2Nlc3Muc3RkZXJyO1xuICAgIH1cblxuICAgIHN0YXRpYyBfY3JlYXRlUGVuZGluZ1Byb21pc2UgKCkge1xuICAgICAgICBsZXQgcmVzb2x2ZXIgPSBudWxsO1xuXG4gICAgICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIHJlc29sdmVyID0gcmVzb2x2ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcHJvbWlzZS5yZXNvbHZlID0gcmVzb2x2ZXI7XG5cbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuXG4gICAgc3RhdGljIF9jcmVhdGVSZXBvcnRJdGVtICh0ZXN0LCBydW5zUGVyVGVzdCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZml4dHVyZTogICAgICAgICAgICAgICAgICAgIHRlc3QuZml4dHVyZSxcbiAgICAgICAgICAgIHRlc3Q6ICAgICAgICAgICAgICAgICAgICAgICB0ZXN0LFxuICAgICAgICAgICAgdGVzdFJ1bklkczogICAgICAgICAgICAgICAgIFtdLFxuICAgICAgICAgICAgc2NyZWVuc2hvdFBhdGg6ICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBzY3JlZW5zaG90czogICAgICAgICAgICAgICAgW10sXG4gICAgICAgICAgICB2aWRlb3M6ICAgICAgICAgICAgICAgICAgICAgW10sXG4gICAgICAgICAgICBxdWFyYW50aW5lOiAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIGVycnM6ICAgICAgICAgICAgICAgICAgICAgICBbXSxcbiAgICAgICAgICAgIHdhcm5pbmdzOiAgICAgICAgICAgICAgICAgICBbXSxcbiAgICAgICAgICAgIHVuc3RhYmxlOiAgICAgICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgIHN0YXJ0VGltZTogICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgdGVzdFJ1bkluZm86ICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBwZW5kaW5nUnVuczogICAgICAgICAgICAgICAgcnVuc1BlclRlc3QsXG4gICAgICAgICAgICBwZW5kaW5nU3RhcnRzOiAgICAgICAgICAgICAgcnVuc1BlclRlc3QsXG4gICAgICAgICAgICBwZW5kaW5nVGVzdFJ1bkRvbmVQcm9taXNlOiAgUmVwb3J0ZXIuX2NyZWF0ZVBlbmRpbmdQcm9taXNlKCksXG4gICAgICAgICAgICBwZW5kaW5nVGVzdFJ1blN0YXJ0UHJvbWlzZTogUmVwb3J0ZXIuX2NyZWF0ZVBlbmRpbmdQcm9taXNlKCksXG4gICAgICAgICAgICBicm93c2VyczogICAgICAgICAgICAgICAgICAgW11cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBzdGF0aWMgX2NyZWF0ZVJlcG9ydFF1ZXVlICh0YXNrKSB7XG4gICAgICAgIGNvbnN0IHJ1bnNQZXJUZXN0ID0gdGFzay5icm93c2VyQ29ubmVjdGlvbkdyb3Vwcy5sZW5ndGg7XG5cbiAgICAgICAgcmV0dXJuIHRhc2sudGVzdHMubWFwKHRlc3QgPT4gUmVwb3J0ZXIuX2NyZWF0ZVJlcG9ydEl0ZW0odGVzdCwgcnVuc1BlclRlc3QpKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgX2NyZWF0ZVRlc3RSdW5JbmZvIChyZXBvcnRJdGVtKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBlcnJzOiAgICAgICAgICAgc29ydEJ5KHJlcG9ydEl0ZW0uZXJycywgWyd1c2VyQWdlbnQnLCAnY29kZSddKSxcbiAgICAgICAgICAgIHdhcm5pbmdzOiAgICAgICByZXBvcnRJdGVtLndhcm5pbmdzLFxuICAgICAgICAgICAgZHVyYXRpb25NczogICAgIG5ldyBEYXRlKCkgLSByZXBvcnRJdGVtLnN0YXJ0VGltZSxcbiAgICAgICAgICAgIHVuc3RhYmxlOiAgICAgICByZXBvcnRJdGVtLnVuc3RhYmxlLFxuICAgICAgICAgICAgc2NyZWVuc2hvdFBhdGg6IHJlcG9ydEl0ZW0uc2NyZWVuc2hvdFBhdGgsXG4gICAgICAgICAgICBzY3JlZW5zaG90czogICAgcmVwb3J0SXRlbS5zY3JlZW5zaG90cyxcbiAgICAgICAgICAgIHZpZGVvczogICAgICAgICByZXBvcnRJdGVtLnZpZGVvcyxcbiAgICAgICAgICAgIHF1YXJhbnRpbmU6ICAgICByZXBvcnRJdGVtLnF1YXJhbnRpbmUsXG4gICAgICAgICAgICBza2lwcGVkOiAgICAgICAgcmVwb3J0SXRlbS50ZXN0LnNraXAsXG4gICAgICAgICAgICBicm93c2VyczogICAgICAgcmVwb3J0SXRlbS5icm93c2VycyxcbiAgICAgICAgICAgIHRlc3RJZDogICAgICAgICByZXBvcnRJdGVtLnRlc3QuaWRcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBfZ2V0UmVwb3J0SXRlbUZvclRlc3RSdW4gKHRlc3RSdW4pIHtcbiAgICAgICAgcmV0dXJuIGZpbmQodGhpcy5yZXBvcnRRdWV1ZSwgaSA9PiBpLnRlc3QgPT09IHRlc3RSdW4udGVzdCk7XG4gICAgfVxuXG4gICAgYXN5bmMgX3NoaWZ0UmVwb3J0UXVldWUgKHJlcG9ydEl0ZW0pIHtcbiAgICAgICAgbGV0IGN1cnJlbnRGaXh0dXJlID0gbnVsbDtcbiAgICAgICAgbGV0IG5leHRSZXBvcnRJdGVtID0gbnVsbDtcblxuICAgICAgICB3aGlsZSAodGhpcy5yZXBvcnRRdWV1ZS5sZW5ndGggJiYgdGhpcy5yZXBvcnRRdWV1ZVswXS50ZXN0UnVuSW5mbykge1xuICAgICAgICAgICAgcmVwb3J0SXRlbSAgICAgPSB0aGlzLnJlcG9ydFF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICBjdXJyZW50Rml4dHVyZSA9IHJlcG9ydEl0ZW0uZml4dHVyZTtcblxuICAgICAgICAgICAgLy8gTk9URTogaGVyZSB3ZSBhc3N1bWUgdGhhdCB0ZXN0cyBhcmUgc29ydGVkIGJ5IGZpeHR1cmUuXG4gICAgICAgICAgICAvLyBUaGVyZWZvcmUsIGlmIHRoZSBuZXh0IHJlcG9ydCBpdGVtIGhhcyBhIGRpZmZlcmVudFxuICAgICAgICAgICAgLy8gZml4dHVyZSwgd2UgY2FuIHJlcG9ydCB0aGlzIGZpeHR1cmUgc3RhcnQuXG4gICAgICAgICAgICBuZXh0UmVwb3J0SXRlbSA9IHRoaXMucmVwb3J0UXVldWVbMF07XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZGlzcGF0Y2hUb1BsdWdpbih7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiBSZXBvcnRlclBsdWdpbk1ldGhvZC5yZXBvcnRUZXN0RG9uZSxcbiAgICAgICAgICAgICAgICBhcmdzOiAgIFtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0SXRlbS50ZXN0Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydEl0ZW0udGVzdFJ1bkluZm8sXG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydEl0ZW0udGVzdC5tZXRhXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmICghbmV4dFJlcG9ydEl0ZW0pXG4gICAgICAgICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgICAgIGlmIChuZXh0UmVwb3J0SXRlbS5maXh0dXJlID09PSBjdXJyZW50Rml4dHVyZSlcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5kaXNwYXRjaFRvUGx1Z2luKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFJlcG9ydGVyUGx1Z2luTWV0aG9kLnJlcG9ydEZpeHR1cmVTdGFydCxcbiAgICAgICAgICAgICAgICBhcmdzOiAgIFtcbiAgICAgICAgICAgICAgICAgICAgbmV4dFJlcG9ydEl0ZW0uZml4dHVyZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBuZXh0UmVwb3J0SXRlbS5maXh0dXJlLnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIG5leHRSZXBvcnRJdGVtLmZpeHR1cmUubWV0YVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgX3Jlc29sdmVSZXBvcnRJdGVtIChyZXBvcnRJdGVtLCB0ZXN0UnVuKSB7XG4gICAgICAgIGlmICh0aGlzLnRhc2suc2NyZWVuc2hvdHMuaGFzQ2FwdHVyZWRGb3IodGVzdFJ1bi50ZXN0KSkge1xuICAgICAgICAgICAgcmVwb3J0SXRlbS5zY3JlZW5zaG90UGF0aCA9IHRoaXMudGFzay5zY3JlZW5zaG90cy5nZXRQYXRoRm9yKHRlc3RSdW4udGVzdCk7XG4gICAgICAgICAgICByZXBvcnRJdGVtLnNjcmVlbnNob3RzICAgID0gdGhpcy50YXNrLnNjcmVlbnNob3RzLmdldFNjcmVlbnNob3RzSW5mbyh0ZXN0UnVuLnRlc3QpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMudGFzay52aWRlb3MpXG4gICAgICAgICAgICByZXBvcnRJdGVtLnZpZGVvcyA9IHRoaXMudGFzay52aWRlb3MuZ2V0VGVzdFZpZGVvcyhyZXBvcnRJdGVtLnRlc3QuaWQpO1xuXG4gICAgICAgIGlmICh0ZXN0UnVuLnF1YXJhbnRpbmUpIHtcbiAgICAgICAgICAgIHJlcG9ydEl0ZW0ucXVhcmFudGluZSA9IHRlc3RSdW4ucXVhcmFudGluZS5hdHRlbXB0cy5yZWR1Y2UoKHJlc3VsdCwgZXJyb3JzLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhc3NlZCAgICAgICAgICAgID0gIWVycm9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgY29uc3QgcXVhcmFudGluZUF0dGVtcHQgPSBpbmRleCArIDE7XG5cbiAgICAgICAgICAgICAgICByZXN1bHRbcXVhcmFudGluZUF0dGVtcHRdID0geyBwYXNzZWQgfTtcblxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9LCB7fSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXJlcG9ydEl0ZW0udGVzdFJ1bkluZm8pIHtcbiAgICAgICAgICAgIHJlcG9ydEl0ZW0udGVzdFJ1bkluZm8gPSBSZXBvcnRlci5fY3JlYXRlVGVzdFJ1bkluZm8ocmVwb3J0SXRlbSk7XG5cbiAgICAgICAgICAgIGlmIChyZXBvcnRJdGVtLnRlc3Quc2tpcClcbiAgICAgICAgICAgICAgICB0aGlzLnNraXBwZWQrKztcbiAgICAgICAgICAgIGVsc2UgaWYgKHJlcG9ydEl0ZW0uZXJycy5sZW5ndGgpXG4gICAgICAgICAgICAgICAgdGhpcy5mYWlsZWQrKztcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0aGlzLnBhc3NlZCsrO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5fc2hpZnRSZXBvcnRRdWV1ZShyZXBvcnRJdGVtKTtcblxuICAgICAgICByZXBvcnRJdGVtLnBlbmRpbmdUZXN0UnVuRG9uZVByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIF9wcmVwYXJlUmVwb3J0VGVzdEFjdGlvbkV2ZW50QXJncyAoeyBjb21tYW5kLCBkdXJhdGlvbiwgcmVzdWx0LCB0ZXN0UnVuLCBlcnIgfSkge1xuICAgICAgICBjb25zdCBhcmdzID0ge307XG5cbiAgICAgICAgaWYgKGVycilcbiAgICAgICAgICAgIGFyZ3MuZXJyID0gZXJyO1xuXG4gICAgICAgIGlmICh0eXBlb2YgZHVyYXRpb24gPT09ICdudW1iZXInKVxuICAgICAgICAgICAgYXJncy5kdXJhdGlvbiA9IGR1cmF0aW9uO1xuXG4gICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKGFyZ3MsIHtcbiAgICAgICAgICAgIHRlc3RSdW5JZDogdGVzdFJ1bi5pZCxcbiAgICAgICAgICAgIHRlc3Q6ICAgICAge1xuICAgICAgICAgICAgICAgIGlkOiAgICB0ZXN0UnVuLnRlc3QuaWQsXG4gICAgICAgICAgICAgICAgbmFtZTogIHRlc3RSdW4udGVzdC5uYW1lLFxuICAgICAgICAgICAgICAgIHBoYXNlOiB0ZXN0UnVuLnBoYXNlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZpeHR1cmU6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiB0ZXN0UnVuLnRlc3QuZml4dHVyZS5uYW1lLFxuICAgICAgICAgICAgICAgIGlkOiAgIHRlc3RSdW4udGVzdC5maXh0dXJlLmlkXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29tbWFuZDogZm9ybWF0Q29tbWFuZChjb21tYW5kLCByZXN1bHQpLFxuICAgICAgICAgICAgYnJvd3NlcjogdGVzdFJ1bi5jb250cm9sbGVyLmJyb3dzZXIsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGRpc3BhdGNoVG9QbHVnaW4gKHsgbWV0aG9kLCBhcmdzID0gW10gfSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW5bbWV0aG9kXSguLi5hcmdzKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAob3JpZ2luYWxFcnJvcikge1xuICAgICAgICAgICAgY29uc3QgdW5jYXVnaEVycm9yID0gbmV3IFJlcG9ydGVyUGx1Z2luRXJyb3Ioe1xuICAgICAgICAgICAgICAgIG5hbWU6IHRoaXMucGx1Z2luLm5hbWUsXG4gICAgICAgICAgICAgICAgbWV0aG9kLFxuICAgICAgICAgICAgICAgIG9yaWdpbmFsRXJyb3JcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB0aGlzLnRhc2suZW1pdCgnZXJyb3InLCB1bmNhdWdoRXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgX29uY2VUYXNrU3RhcnRIYW5kbGVyICgpIHtcbiAgICAgICAgY29uc3Qgc3RhcnRUaW1lICA9IG5ldyBEYXRlKCk7XG4gICAgICAgIGNvbnN0IHVzZXJBZ2VudHMgPSB0aGlzLnRhc2suYnJvd3NlckNvbm5lY3Rpb25Hcm91cHMubWFwKGdyb3VwID0+IGdyb3VwWzBdLnVzZXJBZ2VudCk7XG4gICAgICAgIGNvbnN0IGZpcnN0ICAgICAgPSB0aGlzLnJlcG9ydFF1ZXVlWzBdO1xuXG4gICAgICAgIGNvbnN0IHRhc2tQcm9wZXJ0aWVzID0ge1xuICAgICAgICAgICAgY29uZmlndXJhdGlvbjogdGhpcy50YXNrLm9wdHNcbiAgICAgICAgfTtcblxuICAgICAgICBhd2FpdCB0aGlzLmRpc3BhdGNoVG9QbHVnaW4oe1xuICAgICAgICAgICAgbWV0aG9kOiBSZXBvcnRlclBsdWdpbk1ldGhvZC5yZXBvcnRUYXNrU3RhcnQsXG4gICAgICAgICAgICBhcmdzOiAgIFtcbiAgICAgICAgICAgICAgICBzdGFydFRpbWUsXG4gICAgICAgICAgICAgICAgdXNlckFnZW50cyxcbiAgICAgICAgICAgICAgICB0aGlzLnRlc3RDb3VudCxcbiAgICAgICAgICAgICAgICB0aGlzLnRhc2sudGVzdFN0cnVjdHVyZSxcbiAgICAgICAgICAgICAgICB0YXNrUHJvcGVydGllc1xuICAgICAgICAgICAgXVxuICAgICAgICB9KTtcblxuICAgICAgICBhd2FpdCB0aGlzLmRpc3BhdGNoVG9QbHVnaW4oe1xuICAgICAgICAgICAgbWV0aG9kOiBSZXBvcnRlclBsdWdpbk1ldGhvZC5yZXBvcnRGaXh0dXJlU3RhcnQsXG4gICAgICAgICAgICBhcmdzOiAgIFtcbiAgICAgICAgICAgICAgICBmaXJzdC5maXh0dXJlLm5hbWUsXG4gICAgICAgICAgICAgICAgZmlyc3QuZml4dHVyZS5wYXRoLFxuICAgICAgICAgICAgICAgIGZpcnN0LmZpeHR1cmUubWV0YVxuICAgICAgICAgICAgXVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBfb25UYXNrVGVzdFJ1blN0YXJ0SGFuZGxlciAodGVzdFJ1bikge1xuICAgICAgICBjb25zdCByZXBvcnRJdGVtID0gdGhpcy5fZ2V0UmVwb3J0SXRlbUZvclRlc3RSdW4odGVzdFJ1bik7XG5cbiAgICAgICAgcmVwb3J0SXRlbS50ZXN0UnVuSWRzLnB1c2godGVzdFJ1bi5pZCk7XG5cbiAgICAgICAgaWYgKCFyZXBvcnRJdGVtLnN0YXJ0VGltZSlcbiAgICAgICAgICAgIHJlcG9ydEl0ZW0uc3RhcnRUaW1lID0gbmV3IERhdGUoKTtcblxuICAgICAgICByZXBvcnRJdGVtLnBlbmRpbmdTdGFydHMtLTtcblxuICAgICAgICBpZiAoIXJlcG9ydEl0ZW0ucGVuZGluZ1N0YXJ0cykge1xuICAgICAgICAgICAgaWYgKHRoaXMucGx1Z2luLnJlcG9ydFRlc3RTdGFydCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRlc3RTdGFydEluZm8gPSB7IHRlc3RSdW5JZHM6IHJlcG9ydEl0ZW0udGVzdFJ1bklkcywgdGVzdElkOiByZXBvcnRJdGVtLnRlc3QuaWQgfTtcblxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZGlzcGF0Y2hUb1BsdWdpbih7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogUmVwb3J0ZXJQbHVnaW5NZXRob2QucmVwb3J0VGVzdFN0YXJ0LFxuICAgICAgICAgICAgICAgICAgICBhcmdzOiAgIFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcG9ydEl0ZW0udGVzdC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVwb3J0SXRlbS50ZXN0Lm1ldGEsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXN0U3RhcnRJbmZvXG4gICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVwb3J0SXRlbS5wZW5kaW5nVGVzdFJ1blN0YXJ0UHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVwb3J0SXRlbS5wZW5kaW5nVGVzdFJ1blN0YXJ0UHJvbWlzZTtcbiAgICB9XG5cbiAgICBhc3luYyBfb25UYXNrVGVzdFJ1bkRvbmVIYW5kbGVyICh0ZXN0UnVuKSB7XG4gICAgICAgIGNvbnN0IHJlcG9ydEl0ZW0gICAgICAgICAgICAgICAgICAgID0gdGhpcy5fZ2V0UmVwb3J0SXRlbUZvclRlc3RSdW4odGVzdFJ1bik7XG4gICAgICAgIGNvbnN0IGlzVGVzdFJ1blN0b3BwZWRUYXNrRXhlY3V0aW9uID0gISF0ZXN0UnVuLmVycnMubGVuZ3RoICYmIHRoaXMuc3RvcE9uRmlyc3RGYWlsO1xuXG4gICAgICAgIHJlcG9ydEl0ZW0ucGVuZGluZ1J1bnMgPSBpc1Rlc3RSdW5TdG9wcGVkVGFza0V4ZWN1dGlvbiA/IDAgOiByZXBvcnRJdGVtLnBlbmRpbmdSdW5zIC0gMTtcbiAgICAgICAgcmVwb3J0SXRlbS51bnN0YWJsZSAgICA9IHJlcG9ydEl0ZW0udW5zdGFibGUgfHwgdGVzdFJ1bi51bnN0YWJsZTtcbiAgICAgICAgcmVwb3J0SXRlbS5lcnJzICAgICAgICA9IHJlcG9ydEl0ZW0uZXJycy5jb25jYXQodGVzdFJ1bi5lcnJzKTtcbiAgICAgICAgcmVwb3J0SXRlbS53YXJuaW5ncyAgICA9IHRlc3RSdW4ud2FybmluZ0xvZyA/IHVuaW9uKHJlcG9ydEl0ZW0ud2FybmluZ3MsIHRlc3RSdW4ud2FybmluZ0xvZy5tZXNzYWdlcykgOiBbXTtcblxuICAgICAgICByZXBvcnRJdGVtLmJyb3dzZXJzLnB1c2goT2JqZWN0LmFzc2lnbih7IHRlc3RSdW5JZDogdGVzdFJ1bi5pZCB9LCBnZXRCcm93c2VyKHRlc3RSdW4uYnJvd3NlckNvbm5lY3Rpb24pKSk7XG5cbiAgICAgICAgaWYgKCFyZXBvcnRJdGVtLnBlbmRpbmdSdW5zKVxuICAgICAgICAgICAgYXdhaXQgdGhpcy5fcmVzb2x2ZVJlcG9ydEl0ZW0ocmVwb3J0SXRlbSwgdGVzdFJ1bik7XG5cbiAgICAgICAgYXdhaXQgcmVwb3J0SXRlbS5wZW5kaW5nVGVzdFJ1bkRvbmVQcm9taXNlO1xuICAgIH1cblxuICAgIGFzeW5jIF9vblRhc2tUZXN0QWN0aW9uU3RhcnQgKHsgYXBpQWN0aW9uTmFtZSwgLi4ucmVzdEFyZ3MgfSkge1xuICAgICAgICBpZiAodGhpcy5wbHVnaW4ucmVwb3J0VGVzdEFjdGlvblN0YXJ0KSB7XG4gICAgICAgICAgICByZXN0QXJncyA9IHRoaXMuX3ByZXBhcmVSZXBvcnRUZXN0QWN0aW9uRXZlbnRBcmdzKHJlc3RBcmdzKTtcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5kaXNwYXRjaFRvUGx1Z2luKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFJlcG9ydGVyUGx1Z2luTWV0aG9kLnJlcG9ydFRlc3RBY3Rpb25TdGFydCxcbiAgICAgICAgICAgICAgICBhcmdzOiAgIFtcbiAgICAgICAgICAgICAgICAgICAgYXBpQWN0aW9uTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgcmVzdEFyZ3NcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIF9vblRhc2tUZXN0QWN0aW9uRG9uZSAoeyBhcGlBY3Rpb25OYW1lLCAuLi5yZXN0QXJncyB9KSB7XG4gICAgICAgIGlmICh0aGlzLnBsdWdpbi5yZXBvcnRUZXN0QWN0aW9uRG9uZSkge1xuICAgICAgICAgICAgcmVzdEFyZ3MgPSB0aGlzLl9wcmVwYXJlUmVwb3J0VGVzdEFjdGlvbkV2ZW50QXJncyhyZXN0QXJncyk7XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZGlzcGF0Y2hUb1BsdWdpbih7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiBSZXBvcnRlclBsdWdpbk1ldGhvZC5yZXBvcnRUZXN0QWN0aW9uRG9uZSxcbiAgICAgICAgICAgICAgICBhcmdzOiAgIFtcbiAgICAgICAgICAgICAgICAgICAgYXBpQWN0aW9uTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgcmVzdEFyZ3NcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIF9vbmNlVGFza0RvbmVIYW5kbGVyICgpIHtcbiAgICAgICAgY29uc3QgZW5kVGltZSA9IG5ldyBEYXRlKCk7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgICAgICAgcGFzc2VkQ291bnQ6ICB0aGlzLnBhc3NlZCxcbiAgICAgICAgICAgIGZhaWxlZENvdW50OiAgdGhpcy5mYWlsZWQsXG4gICAgICAgICAgICBza2lwcGVkQ291bnQ6IHRoaXMuc2tpcHBlZFxuICAgICAgICB9O1xuXG4gICAgICAgIGF3YWl0IHRoaXMuZGlzcGF0Y2hUb1BsdWdpbih7XG4gICAgICAgICAgICBtZXRob2Q6IFJlcG9ydGVyUGx1Z2luTWV0aG9kLnJlcG9ydFRhc2tEb25lLFxuICAgICAgICAgICAgYXJnczogICBbXG4gICAgICAgICAgICAgICAgZW5kVGltZSxcbiAgICAgICAgICAgICAgICB0aGlzLnBhc3NlZCxcbiAgICAgICAgICAgICAgICB0aGlzLnRhc2sud2FybmluZ0xvZy5tZXNzYWdlcyxcbiAgICAgICAgICAgICAgICByZXN1bHRcbiAgICAgICAgICAgIF1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5wZW5kaW5nVGFza0RvbmVQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICBfYXNzaWduVGFza0V2ZW50SGFuZGxlcnMgKCkge1xuICAgICAgICBjb25zdCB0YXNrID0gdGhpcy50YXNrO1xuXG4gICAgICAgIHRhc2sub25jZSgnc3RhcnQnLCBhc3luYyAoKSA9PiBhd2FpdCB0aGlzLl9vbmNlVGFza1N0YXJ0SGFuZGxlcigpKTtcblxuICAgICAgICB0YXNrLm9uKCd0ZXN0LXJ1bi1zdGFydCcsIGFzeW5jIHRlc3RSdW4gPT4gYXdhaXQgdGhpcy5fb25UYXNrVGVzdFJ1blN0YXJ0SGFuZGxlcih0ZXN0UnVuKSk7XG5cbiAgICAgICAgdGFzay5vbigndGVzdC1ydW4tZG9uZScsIGFzeW5jIHRlc3RSdW4gPT4gYXdhaXQgdGhpcy5fb25UYXNrVGVzdFJ1bkRvbmVIYW5kbGVyKHRlc3RSdW4pKTtcblxuICAgICAgICB0YXNrLm9uKCd0ZXN0LWFjdGlvbi1zdGFydCcsIGFzeW5jIGUgPT4gYXdhaXQgdGhpcy5fb25UYXNrVGVzdEFjdGlvblN0YXJ0KGUpKTtcblxuICAgICAgICB0YXNrLm9uKCd0ZXN0LWFjdGlvbi1kb25lJywgYXN5bmMgZSA9PiBhd2FpdCB0aGlzLl9vblRhc2tUZXN0QWN0aW9uRG9uZShlKSk7XG5cbiAgICAgICAgdGFzay5vbmNlKCdkb25lJywgYXN5bmMgKCkgPT4gYXdhaXQgdGhpcy5fb25jZVRhc2tEb25lSGFuZGxlcigpKTtcbiAgICB9XG5cbiAgICBhc3luYyBkaXNwb3NlICgpIHtcbiAgICAgICAgaWYgKHRoaXMuZGlzcG9zZWQpXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NlZCA9IHRydWU7XG5cbiAgICAgICAgaWYgKCF0aGlzLm91dFN0cmVhbSB8fCBSZXBvcnRlci5faXNTcGVjaWFsU3RyZWFtKHRoaXMub3V0U3RyZWFtKSB8fCAhaXNXcml0YWJsZVN0cmVhbSh0aGlzLm91dFN0cmVhbSkpXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgICAgICAgY29uc3Qgc3RyZWFtRmluaXNoZWRQcm9taXNlID0gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICB0aGlzLm91dFN0cmVhbS5vbmNlKCdmaW5pc2gnLCByZXNvbHZlKTtcbiAgICAgICAgICAgIHRoaXMub3V0U3RyZWFtLm9uY2UoJ2Vycm9yJywgcmVzb2x2ZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMub3V0U3RyZWFtLmVuZCgpO1xuXG4gICAgICAgIHJldHVybiBzdHJlYW1GaW5pc2hlZFByb21pc2U7XG4gICAgfVxufVxuIl19