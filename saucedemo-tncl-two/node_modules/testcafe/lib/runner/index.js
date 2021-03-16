"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const debug_1 = __importDefault(require("debug"));
const promisify_event_1 = __importDefault(require("promisify-event"));
const map_reverse_1 = __importDefault(require("map-reverse"));
const events_1 = require("events");
const lodash_1 = require("lodash");
const bootstrapper_1 = __importDefault(require("./bootstrapper"));
const reporter_1 = __importDefault(require("../reporter"));
const task_1 = __importDefault(require("./task"));
const debug_logger_1 = __importDefault(require("../notifications/debug-logger"));
const runtime_1 = require("../errors/runtime");
const types_1 = require("../errors/types");
const type_assertions_1 = require("../errors/runtime/type-assertions");
const utils_1 = require("../errors/test-run/utils");
const detect_ffmpeg_1 = __importDefault(require("../utils/detect-ffmpeg"));
const check_file_path_1 = __importDefault(require("../utils/check-file-path"));
const handle_errors_1 = require("../utils/handle-errors");
const option_names_1 = __importDefault(require("../configuration/option-names"));
const flag_list_1 = __importDefault(require("../utils/flag-list"));
const prepare_reporters_1 = __importDefault(require("../utils/prepare-reporters"));
const load_1 = __importDefault(require("../custom-client-scripts/load"));
const utils_2 = require("../custom-client-scripts/utils");
const reporter_stream_controller_1 = __importDefault(require("./reporter-stream-controller"));
const customizable_compilers_1 = __importDefault(require("../configuration/customizable-compilers"));
const string_1 = require("../utils/string");
const is_localhost_1 = __importDefault(require("../utils/is-localhost"));
const DEBUG_LOGGER = debug_1.default('testcafe:runner');
class Runner extends events_1.EventEmitter {
    constructor(proxy, browserConnectionGateway, configuration, compilerService) {
        super();
        this.proxy = proxy;
        this.bootstrapper = this._createBootstrapper(browserConnectionGateway, compilerService);
        this.pendingTaskPromises = [];
        this.configuration = configuration;
        this.isCli = false;
        this.apiMethodWasCalled = new flag_list_1.default([
            option_names_1.default.src,
            option_names_1.default.browsers,
            option_names_1.default.reporter,
            option_names_1.default.clientScripts
        ]);
    }
    _createBootstrapper(browserConnectionGateway, compilerService) {
        return new bootstrapper_1.default(browserConnectionGateway, compilerService);
    }
    _disposeBrowserSet(browserSet) {
        return browserSet.dispose().catch(e => DEBUG_LOGGER(e));
    }
    _disposeReporters(reporters) {
        return Promise.all(reporters.map(reporter => reporter.dispose().catch(e => DEBUG_LOGGER(e))));
    }
    _disposeTestedApp(testedApp) {
        return testedApp ? testedApp.kill().catch(e => DEBUG_LOGGER(e)) : Promise.resolve();
    }
    async _disposeTaskAndRelatedAssets(task, browserSet, reporters, testedApp) {
        task.abort();
        task.unRegisterClientScriptRouting();
        task.clearListeners();
        await this._disposeAssets(browserSet, reporters, testedApp);
    }
    _disposeAssets(browserSet, reporters, testedApp) {
        return Promise.all([
            this._disposeBrowserSet(browserSet),
            this._disposeReporters(reporters),
            this._disposeTestedApp(testedApp)
        ]);
    }
    _prepareArrayParameter(array) {
        array = lodash_1.flattenDeep(array);
        if (this.isCli)
            return array.length === 0 ? void 0 : array;
        return array;
    }
    _createCancelablePromise(taskPromise) {
        const promise = taskPromise.then(({ completionPromise }) => completionPromise);
        const removeFromPending = () => lodash_1.pull(this.pendingTaskPromises, promise);
        promise
            .then(removeFromPending)
            .catch(removeFromPending);
        promise.cancel = () => taskPromise
            .then(({ cancelTask }) => cancelTask())
            .then(removeFromPending);
        this.pendingTaskPromises.push(promise);
        return promise;
    }
    // Run task
    _getFailedTestCount(task, reporter) {
        let failedTestCount = reporter.testCount - reporter.passed;
        if (task.opts.stopOnFirstFail && !!failedTestCount)
            failedTestCount = 1;
        return failedTestCount;
    }
    async _getTaskResult(task, browserSet, reporters, testedApp) {
        if (!task.opts.live) {
            task.on('browser-job-done', job => {
                job.browserConnections.forEach(bc => browserSet.releaseConnection(bc));
            });
        }
        const browserSetErrorPromise = promisify_event_1.default(browserSet, 'error');
        const taskErrorPromise = promisify_event_1.default(task, 'error');
        const streamController = new reporter_stream_controller_1.default(task, reporters);
        const taskDonePromise = task.once('done')
            .then(() => browserSetErrorPromise.cancel())
            .then(() => {
            return Promise.all(reporters.map(reporter => reporter.pendingTaskDonePromise));
        });
        const promises = [
            taskDonePromise,
            browserSetErrorPromise,
            taskErrorPromise
        ];
        if (testedApp)
            promises.push(testedApp.errorPromise);
        try {
            await Promise.race(promises);
        }
        catch (err) {
            await this._disposeTaskAndRelatedAssets(task, browserSet, reporters, testedApp);
            throw err;
        }
        await this._disposeAssets(browserSet, reporters, testedApp);
        if (streamController.multipleStreamError)
            throw streamController.multipleStreamError;
        return this._getFailedTestCount(task, reporters[0]);
    }
    _createTask(tests, browserConnectionGroups, proxy, opts) {
        return new task_1.default(tests, browserConnectionGroups, proxy, opts);
    }
    _runTask(reporterPlugins, browserSet, tests, testedApp) {
        const task = this._createTask(tests, browserSet.browserConnectionGroups, this.proxy, this.configuration.getOptions());
        const reporters = reporterPlugins.map(reporter => new reporter_1.default(reporter.plugin, task, reporter.outStream, reporter.name));
        const completionPromise = this._getTaskResult(task, browserSet, reporters, testedApp);
        let completed = false;
        task.on('start', handle_errors_1.startHandlingTestErrors);
        if (!this.configuration.getOption(option_names_1.default.skipUncaughtErrors)) {
            task.on('test-run-start', handle_errors_1.addRunningTest);
            task.on('test-run-done', handle_errors_1.removeRunningTest);
        }
        task.on('done', handle_errors_1.stopHandlingTestErrors);
        task.on('error', handle_errors_1.stopHandlingTestErrors);
        const onTaskCompleted = () => {
            task.unRegisterClientScriptRouting();
            completed = true;
        };
        completionPromise
            .then(onTaskCompleted)
            .catch(onTaskCompleted);
        const cancelTask = async () => {
            if (!completed)
                await this._disposeTaskAndRelatedAssets(task, browserSet, reporters, testedApp);
        };
        return { completionPromise, cancelTask };
    }
    _registerAssets(assets) {
        assets.forEach(asset => this.proxy.GET(asset.path, asset.info));
    }
    _validateDebugLogger() {
        const debugLogger = this.configuration.getOption(option_names_1.default.debugLogger);
        const debugLoggerDefinedCorrectly = debugLogger === null || !!debugLogger &&
            ['showBreakpoint', 'hideBreakpoint'].every(method => method in debugLogger && lodash_1.isFunction(debugLogger[method]));
        if (!debugLoggerDefinedCorrectly) {
            this.configuration.mergeOptions({
                [option_names_1.default.debugLogger]: debug_logger_1.default
            });
        }
    }
    _validateSpeedOption() {
        const speed = this.configuration.getOption(option_names_1.default.speed);
        if (speed === void 0)
            return;
        if (typeof speed !== 'number' || isNaN(speed) || speed < 0.01 || speed > 1)
            throw new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.invalidSpeedValue);
    }
    _validateConcurrencyOption() {
        const concurrency = this.configuration.getOption(option_names_1.default.concurrency);
        if (concurrency === void 0)
            return;
        if (typeof concurrency !== 'number' || isNaN(concurrency) || concurrency < 1)
            throw new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.invalidConcurrencyFactor);
    }
    _validateRequestTimeoutOption(optionName) {
        const requestTimeout = this.configuration.getOption(optionName);
        if (requestTimeout === void 0)
            return;
        type_assertions_1.assertType(type_assertions_1.is.nonNegativeNumber, null, `"${optionName}" option`, requestTimeout);
    }
    _validateProxyBypassOption() {
        let proxyBypass = this.configuration.getOption(option_names_1.default.proxyBypass);
        if (proxyBypass === void 0)
            return;
        type_assertions_1.assertType([type_assertions_1.is.string, type_assertions_1.is.array], null, '"proxyBypass" argument', proxyBypass);
        if (typeof proxyBypass === 'string')
            proxyBypass = [proxyBypass];
        proxyBypass = proxyBypass.reduce((arr, rules) => {
            type_assertions_1.assertType(type_assertions_1.is.string, null, '"proxyBypass" argument', rules);
            return arr.concat(rules.split(','));
        }, []);
        this.configuration.mergeOptions({ proxyBypass });
    }
    _getScreenshotOptions() {
        let { path, pathPattern } = this.configuration.getOption(option_names_1.default.screenshots) || {};
        if (!path)
            path = this.configuration.getOption(option_names_1.default.screenshotPath);
        if (!pathPattern)
            pathPattern = this.configuration.getOption(option_names_1.default.screenshotPathPattern);
        return { path, pathPattern };
    }
    _validateScreenshotOptions() {
        const { path, pathPattern } = this._getScreenshotOptions();
        const disableScreenshots = this.configuration.getOption(option_names_1.default.disableScreenshots) || !path;
        this.configuration.mergeOptions({ [option_names_1.default.disableScreenshots]: disableScreenshots });
        if (disableScreenshots)
            return;
        if (path) {
            this._validateScreenshotPath(path, 'screenshots base directory path');
            this.configuration.mergeOptions({ [option_names_1.default.screenshots]: { path: path_1.resolve(path) } });
        }
        if (pathPattern) {
            this._validateScreenshotPath(pathPattern, 'screenshots path pattern');
            this.configuration.mergeOptions({ [option_names_1.default.screenshots]: { pathPattern } });
        }
    }
    async _validateVideoOptions() {
        const videoPath = this.configuration.getOption(option_names_1.default.videoPath);
        const videoEncodingOptions = this.configuration.getOption(option_names_1.default.videoEncodingOptions);
        let videoOptions = this.configuration.getOption(option_names_1.default.videoOptions);
        if (!videoPath) {
            if (videoOptions || videoEncodingOptions)
                throw new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.cannotSetVideoOptionsWithoutBaseVideoPathSpecified);
            return;
        }
        this.configuration.mergeOptions({ [option_names_1.default.videoPath]: path_1.resolve(videoPath) });
        if (!videoOptions) {
            videoOptions = {};
            this.configuration.mergeOptions({ [option_names_1.default.videoOptions]: videoOptions });
        }
        if (videoOptions.ffmpegPath)
            videoOptions.ffmpegPath = path_1.resolve(videoOptions.ffmpegPath);
        else
            videoOptions.ffmpegPath = await detect_ffmpeg_1.default();
        if (!videoOptions.ffmpegPath)
            throw new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.cannotFindFFMPEG);
    }
    _validateCompilerOptions() {
        const compilerOptions = this.configuration.getOption(option_names_1.default.compilerOptions);
        if (!compilerOptions)
            return;
        const specifiedCompilers = Object.keys(compilerOptions);
        const customizedCompilers = Object.keys(customizable_compilers_1.default);
        const wrongCompilers = specifiedCompilers.filter(compiler => !customizedCompilers.includes(compiler));
        if (!wrongCompilers.length)
            return;
        const compilerListStr = string_1.getConcatenatedValuesString(wrongCompilers, void 0, "'");
        const pluralSuffix = string_1.getPluralSuffix(wrongCompilers);
        throw new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.cannotCustomizeSpecifiedCompilers, compilerListStr, pluralSuffix);
    }
    _validateRetryTestPagesOption() {
        const retryTestPagesOption = this.configuration.getOption(option_names_1.default.retryTestPages);
        if (!retryTestPagesOption)
            return;
        const ssl = this.configuration.getOption(option_names_1.default.ssl);
        if (ssl)
            return;
        const hostname = this.configuration.getOption(option_names_1.default.hostname);
        if (is_localhost_1.default(hostname))
            return;
        throw new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.cannotEnableRetryTestPagesOption);
    }
    async _validateRunOptions() {
        this._validateDebugLogger();
        this._validateScreenshotOptions();
        await this._validateVideoOptions();
        this._validateSpeedOption();
        this._validateConcurrencyOption();
        this._validateProxyBypassOption();
        this._validateCompilerOptions();
        this._validateRetryTestPagesOption();
        this._validateRequestTimeoutOption(option_names_1.default.pageRequestTimeout);
        this._validateRequestTimeoutOption(option_names_1.default.ajaxRequestTimeout);
    }
    _createRunnableConfiguration() {
        return this.bootstrapper
            .createRunnableConfiguration()
            .then(runnableConfiguration => {
            this.emit('done-bootstrapping');
            return runnableConfiguration;
        });
    }
    _validateScreenshotPath(screenshotPath, pathType) {
        const forbiddenCharsList = check_file_path_1.default(screenshotPath);
        if (forbiddenCharsList.length)
            throw new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.forbiddenCharatersInScreenshotPath, screenshotPath, pathType, utils_1.renderForbiddenCharsList(forbiddenCharsList));
    }
    _setBootstrapperOptions() {
        this.configuration.prepare();
        this.configuration.notifyAboutOverriddenOptions();
        this.configuration.notifyAboutDeprecatedOptions();
        this.bootstrapper.sources = this.configuration.getOption(option_names_1.default.src) || this.bootstrapper.sources;
        this.bootstrapper.browsers = this.configuration.getOption(option_names_1.default.browsers) || this.bootstrapper.browsers;
        this.bootstrapper.concurrency = this.configuration.getOption(option_names_1.default.concurrency);
        this.bootstrapper.appCommand = this.configuration.getOption(option_names_1.default.appCommand) || this.bootstrapper.appCommand;
        this.bootstrapper.appInitDelay = this.configuration.getOption(option_names_1.default.appInitDelay);
        this.bootstrapper.filter = this.configuration.getOption(option_names_1.default.filter) || this.bootstrapper.filter;
        this.bootstrapper.reporters = this.configuration.getOption(option_names_1.default.reporter) || this.bootstrapper.reporters;
        this.bootstrapper.tsConfigPath = this.configuration.getOption(option_names_1.default.tsConfigPath);
        this.bootstrapper.clientScripts = this.configuration.getOption(option_names_1.default.clientScripts) || this.bootstrapper.clientScripts;
        this.bootstrapper.disableMultipleWindows = this.configuration.getOption(option_names_1.default.disableMultipleWindows);
        this.bootstrapper.compilerOptions = this.configuration.getOption(option_names_1.default.compilerOptions);
        this.bootstrapper.browserInitTimeout = this.configuration.getOption(option_names_1.default.browserInitTimeout);
    }
    async _prepareClientScripts(tests, clientScripts) {
        return Promise.all(tests.map(async (test) => {
            if (test.isLegacy)
                return;
            let loadedTestClientScripts = await load_1.default(test.clientScripts, path_1.dirname(test.testFile.filename));
            loadedTestClientScripts = clientScripts.concat(loadedTestClientScripts);
            test.clientScripts = utils_2.setUniqueUrls(loadedTestClientScripts);
        }));
    }
    // API
    embeddingOptions(opts) {
        const { assets, TestRunCtor } = opts;
        this._registerAssets(assets);
        this.configuration.mergeOptions({ TestRunCtor });
        return this;
    }
    src(...sources) {
        if (this.apiMethodWasCalled.src)
            throw new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.multipleAPIMethodCallForbidden, option_names_1.default.src);
        sources = this._prepareArrayParameter(sources);
        this.configuration.mergeOptions({ [option_names_1.default.src]: sources });
        this.apiMethodWasCalled.src = true;
        return this;
    }
    browsers(...browsers) {
        if (this.apiMethodWasCalled.browsers)
            throw new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.multipleAPIMethodCallForbidden, option_names_1.default.browsers);
        browsers = this._prepareArrayParameter(browsers);
        this.configuration.mergeOptions({ browsers });
        this.apiMethodWasCalled.browsers = true;
        return this;
    }
    concurrency(concurrency) {
        this.configuration.mergeOptions({ concurrency });
        return this;
    }
    reporter(name, output) {
        if (this.apiMethodWasCalled.reporter)
            throw new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.multipleAPIMethodCallForbidden, option_names_1.default.reporter);
        let reporters = prepare_reporters_1.default(name, output);
        reporters = this._prepareArrayParameter(reporters);
        this.configuration.mergeOptions({ [option_names_1.default.reporter]: reporters });
        this.apiMethodWasCalled.reporter = true;
        return this;
    }
    filter(filter) {
        this.configuration.mergeOptions({ filter });
        return this;
    }
    useProxy(proxy, proxyBypass) {
        this.configuration.mergeOptions({ proxy, proxyBypass });
        return this;
    }
    screenshots(...options) {
        let fullPage;
        let [path, takeOnFails, pathPattern] = options;
        if (options.length === 1 && options[0] && typeof options[0] === 'object')
            ({ path, takeOnFails, pathPattern, fullPage } = options[0]);
        this.configuration.mergeOptions({ screenshots: { path, takeOnFails, pathPattern, fullPage } });
        return this;
    }
    video(path, options, encodingOptions) {
        this.configuration.mergeOptions({
            [option_names_1.default.videoPath]: path,
            [option_names_1.default.videoOptions]: options,
            [option_names_1.default.videoEncodingOptions]: encodingOptions
        });
        return this;
    }
    startApp(command, initDelay) {
        this.configuration.mergeOptions({
            [option_names_1.default.appCommand]: command,
            [option_names_1.default.appInitDelay]: initDelay
        });
        return this;
    }
    tsConfigPath(path) {
        this.configuration.mergeOptions({
            [option_names_1.default.tsConfigPath]: path
        });
        return this;
    }
    clientScripts(...scripts) {
        if (this.apiMethodWasCalled.clientScripts)
            throw new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.multipleAPIMethodCallForbidden, option_names_1.default.clientScripts);
        scripts = this._prepareArrayParameter(scripts);
        this.configuration.mergeOptions({ [option_names_1.default.clientScripts]: scripts });
        this.apiMethodWasCalled.clientScripts = true;
        return this;
    }
    compilerOptions(opts) {
        this.configuration.mergeOptions({
            [option_names_1.default.compilerOptions]: opts
        });
        return this;
    }
    run(options = {}) {
        this.apiMethodWasCalled.reset();
        this.configuration.mergeOptions(options);
        this._setBootstrapperOptions();
        const runTaskPromise = Promise.resolve()
            .then(() => this._validateRunOptions())
            .then(() => this._createRunnableConfiguration())
            .then(async ({ reporterPlugins, browserSet, tests, testedApp, commonClientScripts }) => {
            await this._prepareClientScripts(tests, commonClientScripts);
            return this._runTask(reporterPlugins, browserSet, tests, testedApp);
        });
        return this._createCancelablePromise(runTaskPromise);
    }
    async stop() {
        // NOTE: When taskPromise is cancelled, it is removed from
        // the pendingTaskPromises array, which leads to shifting indexes
        // towards the beginning. So, we must copy the array in order to iterate it,
        // or we can perform iteration from the end to the beginning.
        const cancellationPromises = map_reverse_1.default(this.pendingTaskPromises, taskPromise => taskPromise.cancel());
        await Promise.all(cancellationPromises);
    }
}
exports.default = Runner;
module.exports = exports.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcnVubmVyL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsK0JBQXVEO0FBQ3ZELGtEQUEwQjtBQUMxQixzRUFBNkM7QUFDN0MsOERBQXFDO0FBQ3JDLG1DQUFzQztBQUN0QyxtQ0FJZ0I7QUFFaEIsa0VBQTBDO0FBQzFDLDJEQUFtQztBQUNuQyxrREFBMEI7QUFDMUIsaUZBQStEO0FBQy9ELCtDQUFpRDtBQUNqRCwyQ0FBaUQ7QUFDakQsdUVBQW1FO0FBQ25FLG9EQUFvRTtBQUNwRSwyRUFBa0Q7QUFDbEQsK0VBQXFEO0FBQ3JELDBEQUtnQztBQUVoQyxpRkFBeUQ7QUFDekQsbUVBQTBDO0FBQzFDLG1GQUEwRDtBQUMxRCx5RUFBOEQ7QUFDOUQsMERBQStEO0FBQy9ELDhGQUFvRTtBQUNwRSxxR0FBNEU7QUFDNUUsNENBQStFO0FBQy9FLHlFQUFnRDtBQUVoRCxNQUFNLFlBQVksR0FBRyxlQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUU5QyxNQUFxQixNQUFPLFNBQVEscUJBQVk7SUFDNUMsWUFBYSxLQUFLLEVBQUUsd0JBQXdCLEVBQUUsYUFBYSxFQUFFLGVBQWU7UUFDeEUsS0FBSyxFQUFFLENBQUM7UUFFUixJQUFJLENBQUMsS0FBSyxHQUFpQixLQUFLLENBQUM7UUFDakMsSUFBSSxDQUFDLFlBQVksR0FBVSxJQUFJLENBQUMsbUJBQW1CLENBQUMsd0JBQXdCLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDL0YsSUFBSSxDQUFDLG1CQUFtQixHQUFHLEVBQUUsQ0FBQztRQUM5QixJQUFJLENBQUMsYUFBYSxHQUFTLGFBQWEsQ0FBQztRQUN6QyxJQUFJLENBQUMsS0FBSyxHQUFpQixLQUFLLENBQUM7UUFFakMsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksbUJBQVEsQ0FBQztZQUNuQyxzQkFBWSxDQUFDLEdBQUc7WUFDaEIsc0JBQVksQ0FB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QUFDLG1CQUFtQixFQUFFLFdBQVcsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFFdkcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUM7SUFDNUMsQ0FBQztDQUNKO0FBeGlCRCx5QkF3aUJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVzb2x2ZSBhcyByZXNvbHZlUGF0aCwgZGlybmFtZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbmltcG9ydCBwcm9taXNpZnlFdmVudCBmcm9tICdwcm9taXNpZnktZXZlbnQnO1xuaW1wb3J0IG1hcFJldmVyc2UgZnJvbSAnbWFwLXJldmVyc2UnO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnZXZlbnRzJztcbmltcG9ydCB7XG4gICAgZmxhdHRlbkRlZXAgYXMgZmxhdHRlbixcbiAgICBwdWxsIGFzIHJlbW92ZSxcbiAgICBpc0Z1bmN0aW9uXG59IGZyb20gJ2xvZGFzaCc7XG5cbmltcG9ydCBCb290c3RyYXBwZXIgZnJvbSAnLi9ib290c3RyYXBwZXInO1xuaW1wb3J0IFJlcG9ydGVyIGZyb20gJy4uL3JlcG9ydGVyJztcbmltcG9ydCBUYXNrIGZyb20gJy4vdGFzayc7XG5pbXBvcnQgZGVmYXVsdERlYnVnTG9nZ2VyIGZyb20gJy4uL25vdGlmaWNhdGlvbnMvZGVidWctbG9nZ2VyJztcbmltcG9ydCB7IEdlbmVyYWxFcnJvciB9IGZyb20gJy4uL2Vycm9ycy9ydW50aW1lJztcbmltcG9ydCB7IFJVTlRJTUVfRVJST1JTIH0gZnJvbSAnLi4vZXJyb3JzL3R5cGVzJztcbmltcG9ydCB7IGFzc2VydFR5cGUsIGlzIH0gZnJvbSAnLi4vZXJyb3JzL3J1bnRpbWUvdHlwZS1hc3NlcnRpb25zJztcbmltcG9ydCB7IHJlbmRlckZvcmJpZGRlbkNoYXJzTGlzdCB9IGZyb20gJy4uL2Vycm9ycy90ZXN0LXJ1bi91dGlscyc7XG5pbXBvcnQgZGV0ZWN0RkZNUEVHIGZyb20gJy4uL3V0aWxzL2RldGVjdC1mZm1wZWcnO1xuaW1wb3J0IGNoZWNrRmlsZVBhdGggZnJvbSAnLi4vdXRpbHMvY2hlY2stZmlsZS1wYXRoJztcbmltcG9ydCB7XG4gICAgYWRkUnVubmluZ1Rlc3QsXG4gICAgcmVtb3ZlUnVubmluZ1Rlc3QsXG4gICAgc3RhcnRIYW5kbGluZ1Rlc3RFcnJvcnMsXG4gICAgc3RvcEhhbmRsaW5nVGVzdEVycm9yc1xufSBmcm9tICcuLi91dGlscy9oYW5kbGUtZXJyb3JzJztcblxuaW1wb3J0IE9QVElPTl9OQU1FUyBmcm9tICcuLi9jb25maWd1cmF0aW9uL29wdGlvbi1uYW1lcyc7XG5pbXBvcnQgRmxhZ0xpc3QgZnJvbSAnLi4vdXRpbHMvZmxhZy1saXN0JztcbmltcG9ydCBwcmVwYXJlUmVwb3J0ZXJzIGZyb20gJy4uL3V0aWxzL3ByZXBhcmUtcmVwb3J0ZXJzJztcbmltcG9ydCBsb2FkQ2xpZW50U2NyaXB0cyBmcm9tICcuLi9jdXN0b20tY2xpZW50LXNjcmlwdHMvbG9hZCc7XG5pbXBvcnQgeyBzZXRVbmlxdWVVcmxzIH0gZnJvbSAnLi4vY3VzdG9tLWNsaWVudC1zY3JpcHRzL3V0aWxzJztcbmltcG9ydCBSZXBvcnRlclN0cmVhbUNvbnRyb2xsZXIgZnJvbSAnLi9yZXBvcnRlci1zdHJlYW0tY29udHJvbGxlcic7XG5pbXBvcnQgQ3VzdG9taXphYmxlQ29tcGlsZXJzIGZyb20gJy4uL2NvbmZpZ3VyYXRpb24vY3VzdG9taXphYmxlLWNvbXBpbGVycyc7XG5pbXBvcnQgeyBnZXRDb25jYXRlbmF0ZWRWYWx1ZXNTdHJpbmcsIGdldFBsdXJhbFN1ZmZpeCB9IGZyb20gJy4uL3V0aWxzL3N0cmluZyc7XG5pbXBvcnQgaXNMb2NhbGhvc3QgZnJvbSAnLi4vdXRpbHMvaXMtbG9jYWxob3N0JztcblxuY29uc3QgREVCVUdfTE9HR0VSID0gZGVidWcoJ3Rlc3RjYWZlOnJ1bm5lcicpO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSdW5uZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICAgIGNvbnN0cnVjdG9yIChwcm94eSwgYnJvd3NlckNvbm5lY3Rpb25HYXRld2F5LCBjb25maWd1cmF0aW9uLCBjb21waWxlclNlcnZpY2UpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLnByb3h5ICAgICAgICAgICAgICAgPSBwcm94eTtcbiAgICAgICAgdGhpcy5ib290c3RyYXBwZXIgICAgICAgID0gdGhpcy5fY3JlYXRlQm9vdHN0cmFwcGVyKGJyb3dzZXJDb25uZWN0aW9uR2F0ZXdheSwgY29tcGlsZXJTZXJ2aWNlKTtcbiAgICAgICAgdGhpcy5wZW5kaW5nVGFza1Byb21pc2VzID0gW107XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbiAgICAgICA9IGNvbmZpZ3VyYXRpb247XG4gICAgICAgIHRoaXMuaXNDbGkgICAgICAgICAgICAgICA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuYXBpTWV0aG9kV2FzQ2FsbGVkID0gbmV3IEZsYWdMaXN0KFtcbiAgICAgICAgICAgIE9QVElPTl9OQU1FUy5zcmMsXG4gICAgICAgICAgICBPUFRJT05fTkFNRVMuYnJvd3NlcnMsXG4gICAgICAgICAgICBPUFRJT05fTkFNRVMucmVwb3J0ZXIsXG4gICAgICAgICAgICBPUFRJT05fTkFNRVMuY2xpZW50U2NyaXB0c1xuICAgICAgICBdKTtcbiAgICB9XG5cbiAgICBfY3JlYXRlQm9vdHN0cmFwcGVyIChicm93c2VyQ29ubmVjdGlvbkdhdGV3YXksIGNvbXBpbGVyU2VydmljZSkge1xuICAgICAgICByZXR1cm4gbmV3IEJvb3RzdHJhcHBlcihicm93c2VyQ29ubmVjdGlvbkdhdGV3YXksIGNvbXBpbGVyU2VydmljZSk7XG4gICAgfVxuXG4gICAgX2Rpc3Bvc2VCcm93c2VyU2V0IChicm93c2VyU2V0KSB7XG4gICAgICAgIHJldHVybiBicm93c2VyU2V0LmRpc3Bvc2UoKS5jYXRjaChlID0+IERFQlVHX0xPR0dFUihlKSk7XG4gICAgfVxuXG4gICAgX2Rpc3Bvc2VSZXBvcnRlcnMgKHJlcG9ydGVycykge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocmVwb3J0ZXJzLm1hcChyZXBvcnRlciA9PiByZXBvcnRlci5kaXNwb3NlKCkuY2F0Y2goZSA9PiBERUJVR19MT0dHRVIoZSkpKSk7XG4gICAgfVxuXG4gICAgX2Rpc3Bvc2VUZXN0ZWRBcHAgKHRlc3RlZEFwcCkge1xuICAgICAgICByZXR1cm4gdGVzdGVkQXBwID8gdGVzdGVkQXBwLmtpbGwoKS5jYXRjaChlID0+IERFQlVHX0xPR0dFUihlKSkgOiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICBhc3luYyBfZGlzcG9zZVRhc2tBbmRSZWxhdGVkQXNzZXRzICh0YXNrLCBicm93c2VyU2V0LCByZXBvcnRlcnMsIHRlc3RlZEFwcCkge1xuICAgICAgICB0YXNrLmFib3J0KCk7XG4gICAgICAgIHRhc2sudW5SZWdpc3RlckNsaWVudFNjcmlwdFJvdXRpbmcoKTtcbiAgICAgICAgdGFzay5jbGVhckxpc3RlbmVycygpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuX2Rpc3Bvc2VBc3NldHMoYnJvd3NlclNldCwgcmVwb3J0ZXJzLCB0ZXN0ZWRBcHApO1xuICAgIH1cblxuICAgIF9kaXNwb3NlQXNzZXRzIChicm93c2VyU2V0LCByZXBvcnRlcnMsIHRlc3RlZEFwcCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgdGhpcy5fZGlzcG9zZUJyb3dzZXJTZXQoYnJvd3NlclNldCksXG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NlUmVwb3J0ZXJzKHJlcG9ydGVycyksXG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NlVGVzdGVkQXBwKHRlc3RlZEFwcClcbiAgICAgICAgXSk7XG4gICAgfVxuXG4gICAgX3ByZXBhcmVBcnJheVBhcmFtZXRlciAoYXJyYXkpIHtcbiAgICAgICAgYXJyYXkgPSBmbGF0dGVuKGFycmF5KTtcblxuICAgICAgICBpZiAodGhpcy5pc0NsaSlcbiAgICAgICAgICAgIHJldHVybiBhcnJheS5sZW5ndGggPT09IDAgPyB2b2lkIDAgOiBhcnJheTtcblxuICAgICAgICByZXR1cm4gYXJyYXk7XG4gICAgfVxuXG4gICAgX2NyZWF0ZUNhbmNlbGFibGVQcm9taXNlICh0YXNrUHJvbWlzZSkge1xuICAgICAgICBjb25zdCBwcm9taXNlICAgICAgICAgICA9IHRhc2tQcm9taXNlLnRoZW4oKHsgY29tcGxldGlvblByb21pc2UgfSkgPT4gY29tcGxldGlvblByb21pc2UpO1xuICAgICAgICBjb25zdCByZW1vdmVGcm9tUGVuZGluZyA9ICgpID0+IHJlbW92ZSh0aGlzLnBlbmRpbmdUYXNrUHJvbWlzZXMsIHByb21pc2UpO1xuXG4gICAgICAgIHByb21pc2VcbiAgICAgICAgICAgIC50aGVuKHJlbW92ZUZyb21QZW5kaW5nKVxuICAgICAgICAgICAgLmNhdGNoKHJlbW92ZUZyb21QZW5kaW5nKTtcblxuICAgICAgICBwcm9taXNlLmNhbmNlbCA9ICgpID0+IHRhc2tQcm9taXNlXG4gICAgICAgICAgICAudGhlbigoeyBjYW5jZWxUYXNrIH0pID0+IGNhbmNlbFRhc2soKSlcbiAgICAgICAgICAgIC50aGVuKHJlbW92ZUZyb21QZW5kaW5nKTtcblxuICAgICAgICB0aGlzLnBlbmRpbmdUYXNrUHJvbWlzZXMucHVzaChwcm9taXNlKTtcblxuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG5cbiAgICAvLyBSdW4gdGFza1xuICAgIF9nZXRGYWlsZWRUZXN0Q291bnQgKHRhc2ssIHJlcG9ydGVyKSB7XG4gICAgICAgIGxldCBmYWlsZWRUZXN0Q291bnQgPSByZXBvcnRlci50ZXN0Q291bnQgLSByZXBvcnRlci5wYXNzZWQ7XG5cbiAgICAgICAgaWYgKHRhc2sub3B0cy5zdG9wT25GaXJzdEZhaWwgJiYgISFmYWlsZWRUZXN0Q291bnQpXG4gICAgICAgICAgICBmYWlsZWRUZXN0Q291bnQgPSAxO1xuXG4gICAgICAgIHJldHVybiBmYWlsZWRUZXN0Q291bnQ7XG4gICAgfVxuXG4gICAgYXN5bmMgX2dldFRhc2tSZXN1bHQgKHRhc2ssIGJyb3dzZXJTZXQsIHJlcG9ydGVycywgdGVzdGVkQXBwKSB7XG4gICAgICAgIGlmICghdGFzay5vcHRzLmxpdmUpIHtcbiAgICAgICAgICAgIHRhc2sub24oJ2Jyb3dzZXItam9iLWRvbmUnLCBqb2IgPT4ge1xuICAgICAgICAgICAgICAgIGpvYi5icm93c2VyQ29ubmVjdGlvbnMuZm9yRWFjaChiYyA9PiBicm93c2VyU2V0LnJlbGVhc2VDb25uZWN0aW9uKGJjKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGJyb3dzZXJTZXRFcnJvclByb21pc2UgPSBwcm9taXNpZnlFdmVudChicm93c2VyU2V0LCAnZXJyb3InKTtcbiAgICAgICAgY29uc3QgdGFza0Vycm9yUHJvbWlzZSAgICAgICA9IHByb21pc2lmeUV2ZW50KHRhc2ssICdlcnJvcicpO1xuICAgICAgICBjb25zdCBzdHJlYW1Db250cm9sbGVyICAgICAgID0gbmV3IFJlcG9ydGVyU3RyZWFtQ29udHJvbGxlcih0YXNrLCByZXBvcnRlcnMpO1xuXG4gICAgICAgIGNvbnN0IHRhc2tEb25lUHJvbWlzZSA9IHRhc2sub25jZSgnZG9uZScpXG4gICAgICAgICAgICAudGhlbigoKSA9PiBicm93c2VyU2V0RXJyb3JQcm9taXNlLmNhbmNlbCgpKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChyZXBvcnRlcnMubWFwKHJlcG9ydGVyID0+IHJlcG9ydGVyLnBlbmRpbmdUYXNrRG9uZVByb21pc2UpKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHByb21pc2VzID0gW1xuICAgICAgICAgICAgdGFza0RvbmVQcm9taXNlLFxuICAgICAgICAgICAgYnJvd3NlclNldEVycm9yUHJvbWlzZSxcbiAgICAgICAgICAgIHRhc2tFcnJvclByb21pc2VcbiAgICAgICAgXTtcblxuICAgICAgICBpZiAodGVzdGVkQXBwKVxuICAgICAgICAgICAgcHJvbWlzZXMucHVzaCh0ZXN0ZWRBcHAuZXJyb3JQcm9taXNlKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgUHJvbWlzZS5yYWNlKHByb21pc2VzKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9kaXNwb3NlVGFza0FuZFJlbGF0ZWRBc3NldHModGFzaywgYnJvd3NlclNldCwgcmVwb3J0ZXJzLCB0ZXN0ZWRBcHApO1xuXG4gICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB0aGlzLl9kaXNwb3NlQXNzZXRzKGJyb3dzZXJTZXQsIHJlcG9ydGVycywgdGVzdGVkQXBwKTtcblxuICAgICAgICBpZiAoc3RyZWFtQ29udHJvbGxlci5tdWx0aXBsZVN0cmVhbUVycm9yKVxuICAgICAgICAgICAgdGhyb3cgc3RyZWFtQ29udHJvbGxlci5tdWx0aXBsZVN0cmVhbUVycm9yO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRGYWlsZWRUZXN0Q291bnQodGFzaywgcmVwb3J0ZXJzWzBdKTtcbiAgICB9XG5cbiAgICBfY3JlYXRlVGFzayAodGVzdHMsIGJyb3dzZXJDb25uZWN0aW9uR3JvdXBzLCBwcm94eSwgb3B0cykge1xuICAgICAgICByZXR1cm4gbmV3IFRhc2sodGVzdHMsIGJyb3dzZXJDb25uZWN0aW9uR3JvdXBzLCBwcm94eSwgb3B0cyk7XG4gICAgfVxuXG4gICAgX3J1blRhc2sgKHJlcG9ydGVyUGx1Z2lucywgYnJvd3NlclNldCwgdGVzdHMsIHRlc3RlZEFwcCkge1xuICAgICAgICBjb25zdCB0YXNrICAgICAgICAgICAgICA9IHRoaXMuX2NyZWF0ZVRhc2sodGVzdHMsIGJyb3dzZXJTZXQuYnJvd3NlckNvbm5lY3Rpb25Hcm91cHMsIHRoaXMucHJveHksIHRoaXMuY29uZmlndXJhdGlvbi5nZXRPcHRpb25zKCkpO1xuICAgICAgICBjb25zdCByZXBvcnRlcnMgICAgICAgICA9IHJlcG9ydGVyUGx1Z2lucy5tYXAocmVwb3J0ZXIgPT4gbmV3IFJlcG9ydGVyKHJlcG9ydGVyLnBsdWdpbiwgdGFzaywgcmVwb3J0ZXIub3V0U3RyZWFtLCByZXBvcnRlci5uYW1lKSk7XG4gICAgICAgIGNvbnN0IGNvbXBsZXRpb25Qcm9taXNlID0gdGhpcy5fZ2V0VGFza1Jlc3VsdCh0YXNrLCBicm93c2VyU2V0LCByZXBvcnRlcnMsIHRlc3RlZEFwcCk7XG4gICAgICAgIGxldCBjb21wbGV0ZWQgICAgICAgICAgID0gZmFsc2U7XG5cbiAgICAgICAgdGFzay5vbignc3RhcnQnLCBzdGFydEhhbmRsaW5nVGVzdEVycm9ycyk7XG5cbiAgICAgICAgaWYgKCF0aGlzLmNvbmZpZ3VyYXRpb24uZ2V0T3B0aW9uKE9QVElPTl9OQU1FUy5za2lwVW5jYXVnaHRFcnJvcnMpKSB7XG4gICAgICAgICAgICB0YXNrLm9uKCd0ZXN0LXJ1bi1zdGFydCcsIGFkZFJ1bm5pbmdUZXN0KTtcbiAgICAgICAgICAgIHRhc2sub24oJ3Rlc3QtcnVuLWRvbmUnLCByZW1vdmVSdW5uaW5nVGVzdCk7XG4gICAgICAgIH1cblxuICAgICAgICB0YXNrLm9uKCdkb25lJywgc3RvcEhhbmRsaW5nVGVzdEVycm9ycyk7XG5cbiAgICAgICAgdGFzay5vbignZXJyb3InLCBzdG9wSGFuZGxpbmdUZXN0RXJyb3JzKTtcblxuICAgICAgICBjb25zdCBvblRhc2tDb21wbGV0ZWQgPSAoKSA9PiB7XG4gICAgICAgICAgICB0YXNrLnVuUmVnaXN0ZXJDbGllbnRTY3JpcHRSb3V0aW5nKCk7XG5cbiAgICAgICAgICAgIGNvbXBsZXRlZCA9IHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgY29tcGxldGlvblByb21pc2VcbiAgICAgICAgICAgIC50aGVuKG9uVGFza0NvbXBsZXRlZClcbiAgICAgICAgICAgIC5jYXRjaChvblRhc2tDb21wbGV0ZWQpO1xuXG4gICAgICAgIGNvbnN0IGNhbmNlbFRhc2sgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWNvbXBsZXRlZClcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9kaXNwb3NlVGFza0FuZFJlbGF0ZWRBc3NldHModGFzaywgYnJvd3NlclNldCwgcmVwb3J0ZXJzLCB0ZXN0ZWRBcHApO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB7IGNvbXBsZXRpb25Qcm9taXNlLCBjYW5jZWxUYXNrIH07XG4gICAgfVxuXG4gICAgX3JlZ2lzdGVyQXNzZXRzIChhc3NldHMpIHtcbiAgICAgICAgYXNzZXRzLmZvckVhY2goYXNzZXQgPT4gdGhpcy5wcm94eS5HRVQoYXNzZXQucGF0aCwgYXNzZXQuaW5mbykpO1xuICAgIH1cblxuICAgIF92YWxpZGF0ZURlYnVnTG9nZ2VyICgpIHtcbiAgICAgICAgY29uc3QgZGVidWdMb2dnZXIgPSB0aGlzLmNvbmZpZ3VyYXRpb24uZ2V0T3B0aW9uKE9QVElPTl9OQU1FUy5kZWJ1Z0xvZ2dlcik7XG5cbiAgICAgICAgY29uc3QgZGVidWdMb2dnZXJEZWZpbmVkQ29ycmVjdGx5ID0gZGVidWdMb2dnZXIgPT09IG51bGwgfHwgISFkZWJ1Z0xvZ2dlciAmJlxuICAgICAgICAgICAgWydzaG93QnJlYWtwb2ludCcsICdoaWRlQnJlYWtwb2ludCddLmV2ZXJ5KG1ldGhvZCA9PiBtZXRob2QgaW4gZGVidWdMb2dnZXIgJiYgaXNGdW5jdGlvbihkZWJ1Z0xvZ2dlclttZXRob2RdKSk7XG5cbiAgICAgICAgaWYgKCFkZWJ1Z0xvZ2dlckRlZmluZWRDb3JyZWN0bHkpIHtcbiAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tZXJnZU9wdGlvbnMoe1xuICAgICAgICAgICAgICAgIFtPUFRJT05fTkFNRVMuZGVidWdMb2dnZXJdOiBkZWZhdWx0RGVidWdMb2dnZXJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3ZhbGlkYXRlU3BlZWRPcHRpb24gKCkge1xuICAgICAgICBjb25zdCBzcGVlZCA9IHRoaXMuY29uZmlndXJhdGlvbi5nZXRPcHRpb24oT1BUSU9OX05BTUVTLnNwZWVkKTtcblxuICAgICAgICBpZiAoc3BlZWQgPT09IHZvaWQgMClcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBpZiAodHlwZW9mIHNwZWVkICE9PSAnbnVtYmVyJyB8fCBpc05hTihzcGVlZCkgfHwgc3BlZWQgPCAwLjAxIHx8IHNwZWVkID4gMSlcbiAgICAgICAgICAgIHRocm93IG5ldyBHZW5lcmFsRXJyb3IoUlVOVElNRV9FUlJPUlMuaW52YWxpZFNwZWVkVmFsdWUpO1xuICAgIH1cblxuICAgIF92YWxpZGF0ZUNvbmN1cnJlbmN5T3B0aW9uICgpIHtcbiAgICAgICAgY29uc3QgY29uY3VycmVuY3kgPSB0aGlzLmNvbmZpZ3VyYXRpb24uZ2V0T3B0aW9uKE9QVElPTl9OQU1FUy5jb25jdXJyZW5jeSk7XG5cbiAgICAgICAgaWYgKGNvbmN1cnJlbmN5ID09PSB2b2lkIDApXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgaWYgKHR5cGVvZiBjb25jdXJyZW5jeSAhPT0gJ251bWJlcicgfHwgaXNOYU4oY29uY3VycmVuY3kpIHx8IGNvbmN1cnJlbmN5IDwgMSlcbiAgICAgICAgICAgIHRocm93IG5ldyBHZW5lcmFsRXJyb3IoUlVOVElNRV9FUlJPUlMuaW52YWxpZENvbmN1cnJlbmN5RmFjdG9yKTtcbiAgICB9XG5cbiAgICBfdmFsaWRhdGVSZXF1ZXN0VGltZW91dE9wdGlvbiAob3B0aW9uTmFtZSkge1xuICAgICAgICBjb25zdCByZXF1ZXN0VGltZW91dCA9IHRoaXMuY29uZmlndXJhdGlvbi5nZXRPcHRpb24ob3B0aW9uTmFtZSk7XG5cbiAgICAgICAgaWYgKHJlcXVlc3RUaW1lb3V0ID09PSB2b2lkIDApXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgYXNzZXJ0VHlwZShpcy5ub25OZWdhdGl2ZU51bWJlciwgbnVsbCwgYFwiJHtvcHRpb25OYW1lfVwiIG9wdGlvbmAsIHJlcXVlc3RUaW1lb3V0KTtcbiAgICB9XG5cbiAgICBfdmFsaWRhdGVQcm94eUJ5cGFzc09wdGlvbiAoKSB7XG4gICAgICAgIGxldCBwcm94eUJ5cGFzcyA9IHRoaXMuY29uZmlndXJhdGlvbi5nZXRPcHRpb24oT1BUSU9OX05BTUVTLnByb3h5QnlwYXNzKTtcblxuICAgICAgICBpZiAocHJveHlCeXBhc3MgPT09IHZvaWQgMClcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBhc3NlcnRUeXBlKFsgaXMuc3RyaW5nLCBpcy5hcnJheSBdLCBudWxsLCAnXCJwcm94eUJ5cGFzc1wiIGFyZ3VtZW50JywgcHJveHlCeXBhc3MpO1xuXG4gICAgICAgIGlmICh0eXBlb2YgcHJveHlCeXBhc3MgPT09ICdzdHJpbmcnKVxuICAgICAgICAgICAgcHJveHlCeXBhc3MgPSBbcHJveHlCeXBhc3NdO1xuXG4gICAgICAgIHByb3h5QnlwYXNzID0gcHJveHlCeXBhc3MucmVkdWNlKChhcnIsIHJ1bGVzKSA9PiB7XG4gICAgICAgICAgICBhc3NlcnRUeXBlKGlzLnN0cmluZywgbnVsbCwgJ1wicHJveHlCeXBhc3NcIiBhcmd1bWVudCcsIHJ1bGVzKTtcblxuICAgICAgICAgICAgcmV0dXJuIGFyci5jb25jYXQocnVsZXMuc3BsaXQoJywnKSk7XG4gICAgICAgIH0sIFtdKTtcblxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24ubWVyZ2VPcHRpb25zKHsgcHJveHlCeXBhc3MgfSk7XG4gICAgfVxuXG4gICAgX2dldFNjcmVlbnNob3RPcHRpb25zICgpIHtcbiAgICAgICAgbGV0IHsgcGF0aCwgcGF0aFBhdHRlcm4gfSA9IHRoaXMuY29uZmlndXJhdGlvbi5nZXRPcHRpb24oT1BUSU9OX05BTUVTLnNjcmVlbnNob3RzKSB8fCB7fTtcblxuICAgICAgICBpZiAoIXBhdGgpXG4gICAgICAgICAgICBwYXRoID0gdGhpcy5jb25maWd1cmF0aW9uLmdldE9wdGlvbihPUFRJT05fTkFNRVMuc2NyZWVuc2hvdFBhdGgpO1xuXG4gICAgICAgIGlmICghcGF0aFBhdHRlcm4pXG4gICAgICAgICAgICBwYXRoUGF0dGVybiA9IHRoaXMuY29uZmlndXJhdGlvbi5nZXRPcHRpb24oT1BUSU9OX05BTUVTLnNjcmVlbnNob3RQYXRoUGF0dGVybik7XG5cbiAgICAgICAgcmV0dXJuIHsgcGF0aCwgcGF0aFBhdHRlcm4gfTtcbiAgICB9XG5cbiAgICBfdmFsaWRhdGVTY3JlZW5zaG90T3B0aW9ucyAoKSB7XG4gICAgICAgIGNvbnN0IHsgcGF0aCwgcGF0aFBhdHRlcm4gfSA9IHRoaXMuX2dldFNjcmVlbnNob3RPcHRpb25zKCk7XG5cbiAgICAgICAgY29uc3QgZGlzYWJsZVNjcmVlbnNob3RzID0gdGhpcy5jb25maWd1cmF0aW9uLmdldE9wdGlvbihPUFRJT05fTkFNRVMuZGlzYWJsZVNjcmVlbnNob3RzKSB8fCAhcGF0aDtcblxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24ubWVyZ2VPcHRpb25zKHsgW09QVElPTl9OQU1FUy5kaXNhYmxlU2NyZWVuc2hvdHNdOiBkaXNhYmxlU2NyZWVuc2hvdHMgfSk7XG5cbiAgICAgICAgaWYgKGRpc2FibGVTY3JlZW5zaG90cylcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBpZiAocGF0aCkge1xuICAgICAgICAgICAgdGhpcy5fdmFsaWRhdGVTY3JlZW5zaG90UGF0aChwYXRoLCAnc2NyZWVuc2hvdHMgYmFzZSBkaXJlY3RvcnkgcGF0aCcpO1xuXG4gICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24ubWVyZ2VPcHRpb25zKHsgW09QVElPTl9OQU1FUy5zY3JlZW5zaG90c106IHsgcGF0aDogcmVzb2x2ZVBhdGgocGF0aCkgfSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYXRoUGF0dGVybikge1xuICAgICAgICAgICAgdGhpcy5fdmFsaWRhdGVTY3JlZW5zaG90UGF0aChwYXRoUGF0dGVybiwgJ3NjcmVlbnNob3RzIHBhdGggcGF0dGVybicpO1xuXG4gICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24ubWVyZ2VPcHRpb25zKHsgW09QVElPTl9OQU1FUy5zY3JlZW5zaG90c106IHsgcGF0aFBhdHRlcm4gfSB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIF92YWxpZGF0ZVZpZGVvT3B0aW9ucyAoKSB7XG4gICAgICAgIGNvbnN0IHZpZGVvUGF0aCAgICAgICAgICAgID0gdGhpcy5jb25maWd1cmF0aW9uLmdldE9wdGlvbihPUFRJT05fTkFNRVMudmlkZW9QYXRoKTtcbiAgICAgICAgY29uc3QgdmlkZW9FbmNvZGluZ09wdGlvbnMgPSB0aGlzLmNvbmZpZ3VyYXRpb24uZ2V0T3B0aW9uKE9QVElPTl9OQU1FUy52aWRlb0VuY29kaW5nT3B0aW9ucyk7XG5cbiAgICAgICAgbGV0IHZpZGVvT3B0aW9ucyA9IHRoaXMuY29uZmlndXJhdGlvbi5nZXRPcHRpb24oT1BUSU9OX05BTUVTLnZpZGVvT3B0aW9ucyk7XG5cbiAgICAgICAgaWYgKCF2aWRlb1BhdGgpIHtcbiAgICAgICAgICAgIGlmICh2aWRlb09wdGlvbnMgfHwgdmlkZW9FbmNvZGluZ09wdGlvbnMpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEdlbmVyYWxFcnJvcihSVU5USU1FX0VSUk9SUy5jYW5ub3RTZXRWaWRlb09wdGlvbnNXaXRob3V0QmFzZVZpZGVvUGF0aFNwZWNpZmllZCk7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tZXJnZU9wdGlvbnMoeyBbT1BUSU9OX05BTUVTLnZpZGVvUGF0aF06IHJlc29sdmVQYXRoKHZpZGVvUGF0aCkgfSk7XG5cbiAgICAgICAgaWYgKCF2aWRlb09wdGlvbnMpIHtcbiAgICAgICAgICAgIHZpZGVvT3B0aW9ucyA9IHt9O1xuXG4gICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24ubWVyZ2VPcHRpb25zKHsgW09QVElPTl9OQU1FUy52aWRlb09wdGlvbnNdOiB2aWRlb09wdGlvbnMgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmlkZW9PcHRpb25zLmZmbXBlZ1BhdGgpXG4gICAgICAgICAgICB2aWRlb09wdGlvbnMuZmZtcGVnUGF0aCA9IHJlc29sdmVQYXRoKHZpZGVvT3B0aW9ucy5mZm1wZWdQYXRoKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdmlkZW9PcHRpb25zLmZmbXBlZ1BhdGggPSBhd2FpdCBkZXRlY3RGRk1QRUcoKTtcblxuICAgICAgICBpZiAoIXZpZGVvT3B0aW9ucy5mZm1wZWdQYXRoKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEdlbmVyYWxFcnJvcihSVU5USU1FX0VSUk9SUy5jYW5ub3RGaW5kRkZNUEVHKTtcbiAgICB9XG5cbiAgICBfdmFsaWRhdGVDb21waWxlck9wdGlvbnMgKCkge1xuICAgICAgICBjb25zdCBjb21waWxlck9wdGlvbnMgPSB0aGlzLmNvbmZpZ3VyYXRpb24uZ2V0T3B0aW9uKE9QVElPTl9OQU1FUy5jb21waWxlck9wdGlvbnMpO1xuXG4gICAgICAgIGlmICghY29tcGlsZXJPcHRpb25zKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHNwZWNpZmllZENvbXBpbGVycyAgPSBPYmplY3Qua2V5cyhjb21waWxlck9wdGlvbnMpO1xuICAgICAgICBjb25zdCBjdXN0b21pemVkQ29tcGlsZXJzID0gT2JqZWN0LmtleXMoQ3VzdG9taXphYmxlQ29tcGlsZXJzKTtcbiAgICAgICAgY29uc3Qgd3JvbmdDb21waWxlcnMgICAgICA9IHNwZWNpZmllZENvbXBpbGVycy5maWx0ZXIoY29tcGlsZXIgPT4gIWN1c3RvbWl6ZWRDb21waWxlcnMuaW5jbHVkZXMoY29tcGlsZXIpKTtcblxuICAgICAgICBpZiAoIXdyb25nQ29tcGlsZXJzLmxlbmd0aClcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBjb25zdCBjb21waWxlckxpc3RTdHIgPSBnZXRDb25jYXRlbmF0ZWRWYWx1ZXNTdHJpbmcod3JvbmdDb21waWxlcnMsIHZvaWQgMCwgXCInXCIpO1xuICAgICAgICBjb25zdCBwbHVyYWxTdWZmaXggICAgPSBnZXRQbHVyYWxTdWZmaXgod3JvbmdDb21waWxlcnMpO1xuXG4gICAgICAgIHRocm93IG5ldyBHZW5lcmFsRXJyb3IoUlVOVElNRV9FUlJPUlMuY2Fubm90Q3VzdG9taXplU3BlY2lmaWVkQ29tcGlsZXJzLCBjb21waWxlckxpc3RTdHIsIHBsdXJhbFN1ZmZpeCk7XG4gICAgfVxuXG4gICAgX3ZhbGlkYXRlUmV0cnlUZXN0UGFnZXNPcHRpb24gKCkge1xuICAgICAgICBjb25zdCByZXRyeVRlc3RQYWdlc09wdGlvbiA9IHRoaXMuY29uZmlndXJhdGlvbi5nZXRPcHRpb24oT1BUSU9OX05BTUVTLnJldHJ5VGVzdFBhZ2VzKTtcblxuICAgICAgICBpZiAoIXJldHJ5VGVzdFBhZ2VzT3B0aW9uKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHNzbCA9IHRoaXMuY29uZmlndXJhdGlvbi5nZXRPcHRpb24oT1BUSU9OX05BTUVTLnNzbCk7XG5cbiAgICAgICAgaWYgKHNzbClcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBjb25zdCBob3N0bmFtZSA9IHRoaXMuY29uZmlndXJhdGlvbi5nZXRPcHRpb24oT1BUSU9OX05BTUVTLmhvc3RuYW1lKTtcblxuICAgICAgICBpZiAoaXNMb2NhbGhvc3QoaG9zdG5hbWUpKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHRocm93IG5ldyBHZW5lcmFsRXJyb3IoUlVOVElNRV9FUlJPUlMuY2Fubm90RW5hYmxlUmV0cnlUZXN0UGFnZXNPcHRpb24pO1xuICAgIH1cblxuICAgIGFzeW5jIF92YWxpZGF0ZVJ1bk9wdGlvbnMgKCkge1xuICAgICAgICB0aGlzLl92YWxpZGF0ZURlYnVnTG9nZ2VyKCk7XG4gICAgICAgIHRoaXMuX3ZhbGlkYXRlU2NyZWVuc2hvdE9wdGlvbnMoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5fdmFsaWRhdGVWaWRlb09wdGlvbnMoKTtcbiAgICAgICAgdGhpcy5fdmFsaWRhdGVTcGVlZE9wdGlvbigpO1xuICAgICAgICB0aGlzLl92YWxpZGF0ZUNvbmN1cnJlbmN5T3B0aW9uKCk7XG4gICAgICAgIHRoaXMuX3ZhbGlkYXRlUHJveHlCeXBhc3NPcHRpb24oKTtcbiAgICAgICAgdGhpcy5fdmFsaWRhdGVDb21waWxlck9wdGlvbnMoKTtcbiAgICAgICAgdGhpcy5fdmFsaWRhdGVSZXRyeVRlc3RQYWdlc09wdGlvbigpO1xuICAgICAgICB0aGlzLl92YWxpZGF0ZVJlcXVlc3RUaW1lb3V0T3B0aW9uKE9QVElPTl9OQU1FUy5wYWdlUmVxdWVzdFRpbWVvdXQpO1xuICAgICAgICB0aGlzLl92YWxpZGF0ZVJlcXVlc3RUaW1lb3V0T3B0aW9uKE9QVElPTl9OQU1FUy5hamF4UmVxdWVzdFRpbWVvdXQpO1xuICAgIH1cblxuICAgIF9jcmVhdGVSdW5uYWJsZUNvbmZpZ3VyYXRpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ib290c3RyYXBwZXJcbiAgICAgICAgICAgIC5jcmVhdGVSdW5uYWJsZUNvbmZpZ3VyYXRpb24oKVxuICAgICAgICAgICAgLnRoZW4ocnVubmFibGVDb25maWd1cmF0aW9uID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2RvbmUtYm9vdHN0cmFwcGluZycpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bm5hYmxlQ29uZmlndXJhdGlvbjtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIF92YWxpZGF0ZVNjcmVlbnNob3RQYXRoIChzY3JlZW5zaG90UGF0aCwgcGF0aFR5cGUpIHtcbiAgICAgICAgY29uc3QgZm9yYmlkZGVuQ2hhcnNMaXN0ID0gY2hlY2tGaWxlUGF0aChzY3JlZW5zaG90UGF0aCk7XG5cbiAgICAgICAgaWYgKGZvcmJpZGRlbkNoYXJzTGlzdC5sZW5ndGgpXG4gICAgICAgICAgICB0aHJvdyBuZXcgR2VuZXJhbEVycm9yKFJVTlRJTUVfRVJST1JTLmZvcmJpZGRlbkNoYXJhdGVyc0luU2NyZWVuc2hvdFBhdGgsIHNjcmVlbnNob3RQYXRoLCBwYXRoVHlwZSwgcmVuZGVyRm9yYmlkZGVuQ2hhcnNMaXN0KGZvcmJpZGRlbkNoYXJzTGlzdCkpO1xuICAgIH1cblxuICAgIF9zZXRCb290c3RyYXBwZXJPcHRpb25zICgpIHtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLnByZXBhcmUoKTtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLm5vdGlmeUFib3V0T3ZlcnJpZGRlbk9wdGlvbnMoKTtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLm5vdGlmeUFib3V0RGVwcmVjYXRlZE9wdGlvbnMoKTtcblxuICAgICAgICB0aGlzLmJvb3RzdHJhcHBlci5zb3VyY2VzICAgICAgICAgICAgICAgID0gdGhpcy5jb25maWd1cmF0aW9uLmdldE9wdGlvbihPUFRJT05fTkFNRVMuc3JjKSB8fCB0aGlzLmJvb3RzdHJhcHBlci5zb3VyY2VzO1xuICAgICAgICB0aGlzLmJvb3RzdHJhcHBlci5icm93c2VycyAgICAgICAgICAgICAgID0gdGhpcy5jb25maWd1cmF0aW9uLmdldE9wdGlvbihPUFRJT05fTkFNRVMuYnJvd3NlcnMpIHx8IHRoaXMuYm9vdHN0cmFwcGVyLmJyb3dzZXJzO1xuICAgICAgICB0aGlzLmJvb3RzdHJhcHBlci5jb25jdXJyZW5jeSAgICAgICAgICAgID0gdGhpcy5jb25maWd1cmF0aW9uLmdldE9wdGlvbihPUFRJT05fTkFNRVMuY29uY3VycmVuY3kpO1xuICAgICAgICB0aGlzLmJvb3RzdHJhcHBlci5hcHBDb21tYW5kICAgICAgICAgICAgID0gdGhpcy5jb25maWd1cmF0aW9uLmdldE9wdGlvbihPUFRJT05fTkFNRVMuYXBwQ29tbWFuZCkgfHwgdGhpcy5ib290c3RyYXBwZXIuYXBwQ29tbWFuZDtcbiAgICAgICAgdGhpcy5ib290c3RyYXBwZXIuYXBwSW5pdERlbGF5ICAgICAgICAgICA9IHRoaXMuY29uZmlndXJhdGlvbi5nZXRPcHRpb24oT1BUSU9OX05BTUVTLmFwcEluaXREZWxheSk7XG4gICAgICAgIHRoaXMuYm9vdHN0cmFwcGVyLmZpbHRlciAgICAgICAgICAgICAgICAgPSB0aGlzLmNvbmZpZ3VyYXRpb24uZ2V0T3B0aW9uKE9QVElPTl9OQU1FUy5maWx0ZXIpIHx8IHRoaXMuYm9vdHN0cmFwcGVyLmZpbHRlcjtcbiAgICAgICAgdGhpcy5ib290c3RyYXBwZXIucmVwb3J0ZXJzICAgICAgICAgICAgICA9IHRoaXMuY29uZmlndXJhdGlvbi5nZXRPcHRpb24oT1BUSU9OX05BTUVTLnJlcG9ydGVyKSB8fCB0aGlzLmJvb3RzdHJhcHBlci5yZXBvcnRlcnM7XG4gICAgICAgIHRoaXMuYm9vdHN0cmFwcGVyLnRzQ29uZmlnUGF0aCAgICAgICAgICAgPSB0aGlzLmNvbmZpZ3VyYXRpb24uZ2V0T3B0aW9uKE9QVElPTl9OQU1FUy50c0NvbmZpZ1BhdGgpO1xuICAgICAgICB0aGlzLmJvb3RzdHJhcHBlci5jbGllbnRTY3JpcHRzICAgICAgICAgID0gdGhpcy5jb25maWd1cmF0aW9uLmdldE9wdGlvbihPUFRJT05fTkFNRVMuY2xpZW50U2NyaXB0cykgfHwgdGhpcy5ib290c3RyYXBwZXIuY2xpZW50U2NyaXB0cztcbiAgICAgICAgdGhpcy5ib290c3RyYXBwZXIuZGlzYWJsZU11bHRpcGxlV2luZG93cyA9IHRoaXMuY29uZmlndXJhdGlvbi5nZXRPcHRpb24oT1BUSU9OX05BTUVTLmRpc2FibGVNdWx0aXBsZVdpbmRvd3MpO1xuICAgICAgICB0aGlzLmJvb3RzdHJhcHBlci5jb21waWxlck9wdGlvbnMgICAgICAgID0gdGhpcy5jb25maWd1cmF0aW9uLmdldE9wdGlvbihPUFRJT05fTkFNRVMuY29tcGlsZXJPcHRpb25zKTtcbiAgICAgICAgdGhpcy5ib290c3RyYXBwZXIuYnJvd3NlckluaXRUaW1lb3V0ICAgICA9IHRoaXMuY29uZmlndXJhdGlvbi5nZXRPcHRpb24oT1BUSU9OX05BTUVTLmJyb3dzZXJJbml0VGltZW91dCk7XG4gICAgfVxuXG4gICAgYXN5bmMgX3ByZXBhcmVDbGllbnRTY3JpcHRzICh0ZXN0cywgY2xpZW50U2NyaXB0cykge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwodGVzdHMubWFwKGFzeW5jIHRlc3QgPT4ge1xuICAgICAgICAgICAgaWYgKHRlc3QuaXNMZWdhY3kpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICBsZXQgbG9hZGVkVGVzdENsaWVudFNjcmlwdHMgPSBhd2FpdCBsb2FkQ2xpZW50U2NyaXB0cyh0ZXN0LmNsaWVudFNjcmlwdHMsIGRpcm5hbWUodGVzdC50ZXN0RmlsZS5maWxlbmFtZSkpO1xuXG4gICAgICAgICAgICBsb2FkZWRUZXN0Q2xpZW50U2NyaXB0cyA9IGNsaWVudFNjcmlwdHMuY29uY2F0KGxvYWRlZFRlc3RDbGllbnRTY3JpcHRzKTtcblxuICAgICAgICAgICAgdGVzdC5jbGllbnRTY3JpcHRzID0gc2V0VW5pcXVlVXJscyhsb2FkZWRUZXN0Q2xpZW50U2NyaXB0cyk7XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICAvLyBBUElcbiAgICBlbWJlZGRpbmdPcHRpb25zIChvcHRzKSB7XG4gICAgICAgIGNvbnN0IHsgYXNzZXRzLCBUZXN0UnVuQ3RvciB9ID0gb3B0cztcblxuICAgICAgICB0aGlzLl9yZWdpc3RlckFzc2V0cyhhc3NldHMpO1xuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24ubWVyZ2VPcHRpb25zKHsgVGVzdFJ1bkN0b3IgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc3JjICguLi5zb3VyY2VzKSB7XG4gICAgICAgIGlmICh0aGlzLmFwaU1ldGhvZFdhc0NhbGxlZC5zcmMpXG4gICAgICAgICAgICB0aHJvdyBuZXcgR2VuZXJhbEVycm9yKFJVTlRJTUVfRVJST1JTLm11bHRpcGxlQVBJTWV0aG9kQ2FsbEZvcmJpZGRlbiwgT1BUSU9OX05BTUVTLnNyYyk7XG5cbiAgICAgICAgc291cmNlcyA9IHRoaXMuX3ByZXBhcmVBcnJheVBhcmFtZXRlcihzb3VyY2VzKTtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLm1lcmdlT3B0aW9ucyh7IFtPUFRJT05fTkFNRVMuc3JjXTogc291cmNlcyB9KTtcblxuICAgICAgICB0aGlzLmFwaU1ldGhvZFdhc0NhbGxlZC5zcmMgPSB0cnVlO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGJyb3dzZXJzICguLi5icm93c2Vycykge1xuICAgICAgICBpZiAodGhpcy5hcGlNZXRob2RXYXNDYWxsZWQuYnJvd3NlcnMpXG4gICAgICAgICAgICB0aHJvdyBuZXcgR2VuZXJhbEVycm9yKFJVTlRJTUVfRVJST1JTLm11bHRpcGxlQVBJTWV0aG9kQ2FsbEZvcmJpZGRlbiwgT1BUSU9OX05BTUVTLmJyb3dzZXJzKTtcblxuICAgICAgICBicm93c2VycyA9IHRoaXMuX3ByZXBhcmVBcnJheVBhcmFtZXRlcihicm93c2Vycyk7XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tZXJnZU9wdGlvbnMoeyBicm93c2VycyB9KTtcblxuICAgICAgICB0aGlzLmFwaU1ldGhvZFdhc0NhbGxlZC5icm93c2VycyA9IHRydWU7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY29uY3VycmVuY3kgKGNvbmN1cnJlbmN5KSB7XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tZXJnZU9wdGlvbnMoeyBjb25jdXJyZW5jeSB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICByZXBvcnRlciAobmFtZSwgb3V0cHV0KSB7XG4gICAgICAgIGlmICh0aGlzLmFwaU1ldGhvZFdhc0NhbGxlZC5yZXBvcnRlcilcbiAgICAgICAgICAgIHRocm93IG5ldyBHZW5lcmFsRXJyb3IoUlVOVElNRV9FUlJPUlMubXVsdGlwbGVBUElNZXRob2RDYWxsRm9yYmlkZGVuLCBPUFRJT05fTkFNRVMucmVwb3J0ZXIpO1xuXG4gICAgICAgIGxldCByZXBvcnRlcnMgPSBwcmVwYXJlUmVwb3J0ZXJzKG5hbWUsIG91dHB1dCk7XG5cbiAgICAgICAgcmVwb3J0ZXJzID0gdGhpcy5fcHJlcGFyZUFycmF5UGFyYW1ldGVyKHJlcG9ydGVycyk7XG5cbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLm1lcmdlT3B0aW9ucyh7IFtPUFRJT05fTkFNRVMucmVwb3J0ZXJdOiByZXBvcnRlcnMgfSk7XG5cbiAgICAgICAgdGhpcy5hcGlNZXRob2RXYXNDYWxsZWQucmVwb3J0ZXIgPSB0cnVlO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGZpbHRlciAoZmlsdGVyKSB7XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tZXJnZU9wdGlvbnMoeyBmaWx0ZXIgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdXNlUHJveHkgKHByb3h5LCBwcm94eUJ5cGFzcykge1xuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24ubWVyZ2VPcHRpb25zKHsgcHJveHksIHByb3h5QnlwYXNzIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNjcmVlbnNob3RzICguLi5vcHRpb25zKSB7XG4gICAgICAgIGxldCBmdWxsUGFnZTtcbiAgICAgICAgbGV0IFtwYXRoLCB0YWtlT25GYWlscywgcGF0aFBhdHRlcm5dID0gb3B0aW9ucztcblxuICAgICAgICBpZiAob3B0aW9ucy5sZW5ndGggPT09IDEgJiYgb3B0aW9uc1swXSAmJiB0eXBlb2Ygb3B0aW9uc1swXSA9PT0gJ29iamVjdCcpXG4gICAgICAgICAgICAoeyBwYXRoLCB0YWtlT25GYWlscywgcGF0aFBhdHRlcm4sIGZ1bGxQYWdlIH0gPSBvcHRpb25zWzBdKTtcblxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24ubWVyZ2VPcHRpb25zKHsgc2NyZWVuc2hvdHM6IHsgcGF0aCwgdGFrZU9uRmFpbHMsIHBhdGhQYXR0ZXJuLCBmdWxsUGFnZSB9IH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHZpZGVvIChwYXRoLCBvcHRpb25zLCBlbmNvZGluZ09wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLm1lcmdlT3B0aW9ucyh7XG4gICAgICAgICAgICBbT1BUSU9OX05BTUVTLnZpZGVvUGF0aF06ICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgIFtPUFRJT05fTkFNRVMudmlkZW9PcHRpb25zXTogICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgW09QVElPTl9OQU1FUy52aWRlb0VuY29kaW5nT3B0aW9uc106IGVuY29kaW5nT3B0aW9uc1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzdGFydEFwcCAoY29tbWFuZCwgaW5pdERlbGF5KSB7XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tZXJnZU9wdGlvbnMoe1xuICAgICAgICAgICAgW09QVElPTl9OQU1FUy5hcHBDb21tYW5kXTogICBjb21tYW5kLFxuICAgICAgICAgICAgW09QVElPTl9OQU1FUy5hcHBJbml0RGVsYXldOiBpbml0RGVsYXlcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdHNDb25maWdQYXRoIChwYXRoKSB7XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tZXJnZU9wdGlvbnMoe1xuICAgICAgICAgICAgW09QVElPTl9OQU1FUy50c0NvbmZpZ1BhdGhdOiBwYXRoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNsaWVudFNjcmlwdHMgKC4uLnNjcmlwdHMpIHtcbiAgICAgICAgaWYgKHRoaXMuYXBpTWV0aG9kV2FzQ2FsbGVkLmNsaWVudFNjcmlwdHMpXG4gICAgICAgICAgICB0aHJvdyBuZXcgR2VuZXJhbEVycm9yKFJVTlRJTUVfRVJST1JTLm11bHRpcGxlQVBJTWV0aG9kQ2FsbEZvcmJpZGRlbiwgT1BUSU9OX05BTUVTLmNsaWVudFNjcmlwdHMpO1xuXG4gICAgICAgIHNjcmlwdHMgPSB0aGlzLl9wcmVwYXJlQXJyYXlQYXJhbWV0ZXIoc2NyaXB0cyk7XG5cbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLm1lcmdlT3B0aW9ucyh7IFtPUFRJT05fTkFNRVMuY2xpZW50U2NyaXB0c106IHNjcmlwdHMgfSk7XG5cbiAgICAgICAgdGhpcy5hcGlNZXRob2RXYXNDYWxsZWQuY2xpZW50U2NyaXB0cyA9IHRydWU7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY29tcGlsZXJPcHRpb25zIChvcHRzKSB7XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tZXJnZU9wdGlvbnMoe1xuICAgICAgICAgICAgW09QVElPTl9OQU1FUy5jb21waWxlck9wdGlvbnNdOiBvcHRzXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJ1biAob3B0aW9ucyA9IHt9KSB7XG4gICAgICAgIHRoaXMuYXBpTWV0aG9kV2FzQ2FsbGVkLnJlc2V0KCk7XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tZXJnZU9wdGlvbnMob3B0aW9ucyk7XG4gICAgICAgIHRoaXMuX3NldEJvb3RzdHJhcHBlck9wdGlvbnMoKTtcblxuICAgICAgICBjb25zdCBydW5UYXNrUHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLl92YWxpZGF0ZVJ1bk9wdGlvbnMoKSlcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuX2NyZWF0ZVJ1bm5hYmxlQ29uZmlndXJhdGlvbigpKVxuICAgICAgICAgICAgLnRoZW4oYXN5bmMgKHsgcmVwb3J0ZXJQbHVnaW5zLCBicm93c2VyU2V0LCB0ZXN0cywgdGVzdGVkQXBwLCBjb21tb25DbGllbnRTY3JpcHRzIH0pID0+IHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9wcmVwYXJlQ2xpZW50U2NyaXB0cyh0ZXN0cywgY29tbW9uQ2xpZW50U2NyaXB0cyk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcnVuVGFzayhyZXBvcnRlclBsdWdpbnMsIGJyb3dzZXJTZXQsIHRlc3RzLCB0ZXN0ZWRBcHApO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2NyZWF0ZUNhbmNlbGFibGVQcm9taXNlKHJ1blRhc2tQcm9taXNlKTtcbiAgICB9XG5cbiAgICBhc3luYyBzdG9wICgpIHtcbiAgICAgICAgLy8gTk9URTogV2hlbiB0YXNrUHJvbWlzZSBpcyBjYW5jZWxsZWQsIGl0IGlzIHJlbW92ZWQgZnJvbVxuICAgICAgICAvLyB0aGUgcGVuZGluZ1Rhc2tQcm9taXNlcyBhcnJheSwgd2hpY2ggbGVhZHMgdG8gc2hpZnRpbmcgaW5kZXhlc1xuICAgICAgICAvLyB0b3dhcmRzIHRoZSBiZWdpbm5pbmcuIFNvLCB3ZSBtdXN0IGNvcHkgdGhlIGFycmF5IGluIG9yZGVyIHRvIGl0ZXJhdGUgaXQsXG4gICAgICAgIC8vIG9yIHdlIGNhbiBwZXJmb3JtIGl0ZXJhdGlvbiBmcm9tIHRoZSBlbmQgdG8gdGhlIGJlZ2lubmluZy5cbiAgICAgICAgY29uc3QgY2FuY2VsbGF0aW9uUHJvbWlzZXMgPSBtYXBSZXZlcnNlKHRoaXMucGVuZGluZ1Rhc2tQcm9taXNlcywgdGFza1Byb21pc2UgPT4gdGFza1Byb21pc2UuY2FuY2VsKCkpO1xuXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKGNhbmNlbGxhdGlvblByb21pc2VzKTtcbiAgICB9XG59XG4iXX0=