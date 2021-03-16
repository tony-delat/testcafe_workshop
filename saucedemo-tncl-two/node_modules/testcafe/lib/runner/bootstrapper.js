"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const is_ci_1 = __importDefault(require("is-ci"));
const lodash_1 = require("lodash");
const make_dir_1 = __importDefault(require("make-dir"));
const os_family_1 = __importDefault(require("os-family"));
const debug_1 = __importDefault(require("debug"));
const pretty_hrtime_1 = __importDefault(require("pretty-hrtime"));
const testcafe_browser_tools_1 = require("testcafe-browser-tools");
const authentication_helper_1 = __importDefault(require("../cli/authentication-helper"));
const compiler_1 = __importDefault(require("../compiler"));
const connection_1 = __importDefault(require("../browser/connection"));
const pool_1 = __importDefault(require("../browser/provider/pool"));
const browser_set_1 = __importDefault(require("./browser-set"));
const remote_1 = __importDefault(require("../browser/provider/built-in/remote"));
const runtime_1 = require("../errors/runtime");
const types_1 = require("../errors/types");
const tested_app_1 = __importDefault(require("./tested-app"));
const parse_file_list_1 = __importDefault(require("../utils/parse-file-list"));
const resolve_path_relatively_cwd_1 = __importDefault(require("../utils/resolve-path-relatively-cwd"));
const load_1 = __importDefault(require("../custom-client-scripts/load"));
const string_1 = require("../utils/string");
const detect_display_1 = __importDefault(require("../utils/detect-display"));
const reporter_1 = require("../utils/reporter");
const warning_log_1 = __importDefault(require("../notifications/warning-log"));
const warning_message_1 = __importDefault(require("../notifications/warning-message"));
const guard_time_execution_1 = __importDefault(require("../utils/guard-time-execution"));
const DEBUG_SCOPE = 'testcafe:bootstrapper';
function isPromiseError(value) {
    return value.error !== void 0;
}
class Bootstrapper {
    constructor(browserConnectionGateway, compilerService) {
        this.browserConnectionGateway = browserConnectionGateway;
        this.concurrency = 1;
        this.sources = [];
        this.browsers = [];
        this.reporters = [];
        this.filter = void 0;
        this.appCommand = void 0;
        this.appInitDelay = void 0;
        this.tsConfigPath = void 0;
        this.clientScripts = [];
        this.disableMultipleWindows = false;
        this.compilerOptions = void 0;
        this.debugLogger = debug_1.default(DEBUG_SCOPE);
        this.warningLog = new warning_log_1.default();
        this.TESTS_COMPILATION_UPPERBOUND = 60;
        this.compilerService = compilerService;
    }
    static _getBrowserName(browser) {
        if (browser instanceof connection_1.default)
            return browser.browserInfo.browserName;
        return browser.browserName;
    }
    static _splitBrowserInfo(browserInfo) {
        const remotes = [];
        const automated = [];
        browserInfo.forEach(browser => {
            if (browser instanceof connection_1.default)
                remotes.push(browser);
            else
                automated.push(browser);
        });
        return { remotes, automated };
    }
    static async _hasLocalBrowsers(browserInfo) {
        for (const browser of browserInfo) {
            if (browser instanceof connection_1.default)
                continue;
            if (await browser.provider.isLocalBrowser(void 0, browser.browserName))
                return true;
        }
        return false;
    }
    static async _checkRequiredPermissions(browserInfo) {
        const hasLocalBrowsers = await Bootstrapper._hasLocalBrowsers(browserInfo);
        const { error } = await authentication_helper_1.default(() => testcafe_browser_tools_1.findWindow(''), testcafe_browser_tools_1.errors.UnableToAccessScreenRecordingAPIError, {
            interactive: hasLocalBrowsers && !is_ci_1.default
        });
        if (!error)
            return;
        if (hasLocalBrowsers)
            throw error;
        remote_1.default.canDetectLocalBrowsers = false;
    }
    static async _checkThatTestsCanRunWithoutDisplay(browserInfoSource) {
        for (let browserInfo of browserInfoSource) {
            if (browserInfo instanceof connection_1.default)
                browserInfo = browserInfo.browserInfo;
            const isLocalBrowser = await browserInfo.provider.isLocalBrowser(void 0, browserInfo.browserName);
            const isHeadlessBrowser = await browserInfo.provider.isHeadlessBrowser(void 0, browserInfo.browserName);
            if (isLocalBrowser && !isHeadlessBrowser) {
                throw new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.cannotRunLocalNonHeadlessBrowserWithoutDisplay, browserInfo.alias);
            }
        }
    }
    async _getBrowserInfo() {
        if (!this.browsers.length)
            throw new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.browserNotSet);
        const browserInfo = await Promise.all(this.browsers.map(browser => pool_1.default.getBrowserInfo(browser)));
        return lodash_1.flatten(browserInfo);
    }
    _createAutomatedConnections(browserInfo) {
        if (!browserInfo)
            return [];
        return browserInfo
            .map(browser => lodash_1.times(this.concurrency, () => new connection_1.default(this.browserConnectionGateway, browser, false, this.disableMultipleWindows)));
    }
    _getBrowserSetOptions() {
        return {
            concurrency: this.concurrency,
            browserInitTimeout: this.browserInitTimeout,
            warningLog: this.warningLog
        };
    }
    async _getBrowserConnections(browserInfo) {
        const { automated, remotes } = Bootstrapper._splitBrowserInfo(browserInfo);
        if (remotes && remotes.length % this.concurrency)
            throw new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.cannotDivideRemotesCountByConcurrency);
        let browserConnections = this._createAutomatedConnections(automated);
        browserConnections = browserConnections.concat(lodash_1.chunk(remotes, this.concurrency));
        return browser_set_1.default.from(browserConnections, this._getBrowserSetOptions());
    }
    _filterTests(tests, predicate) {
        return tests.filter(test => predicate(test.name, test.fixture.name, test.fixture.path, test.meta, test.fixture.meta));
    }
    async _compileTests({ sourceList, compilerOptions }) {
        if (this.compilerService) {
            await this.compilerService.init();
            return this.compilerService.getTests({ sourceList, compilerOptions });
        }
        const compiler = new compiler_1.default(sourceList, compilerOptions);
        return compiler.getTests();
    }
    async _getTests() {
        const cwd = process.cwd();
        const sourceList = await parse_file_list_1.default(this.sources, cwd);
        if (!sourceList.length)
            throw new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.testFilesNotFound, string_1.getConcatenatedValuesString(this.sources, '\n', ''), cwd);
        let tests = await guard_time_execution_1.default(async () => await this._compileTests({ sourceList, compilerOptions: this.compilerOptions }), elapsedTime => {
            this.debugLogger(`tests compilation took ${pretty_hrtime_1.default(elapsedTime)}`);
            const [elapsedSeconds] = elapsedTime;
            if (elapsedSeconds > this.TESTS_COMPILATION_UPPERBOUND)
                this.warningLog.addWarning(warning_message_1.default.testsCompilationTakesTooLong, pretty_hrtime_1.default(elapsedTime));
        });
        const testsWithOnlyFlag = tests.filter(test => test.only);
        if (testsWithOnlyFlag.length)
            tests = testsWithOnlyFlag;
        if (!tests.length)
            throw new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.noTestsToRun);
        if (this.filter)
            tests = this._filterTests(tests, this.filter);
        if (!tests.length)
            throw new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.noTestsToRunDueFiltering);
        return tests;
    }
    async _ensureOutStream(outStream) {
        if (typeof outStream !== 'string')
            return outStream;
        const fullReporterOutputPath = resolve_path_relatively_cwd_1.default(outStream);
        await make_dir_1.default(path_1.default.dirname(fullReporterOutputPath));
        return fs_1.default.createWriteStream(fullReporterOutputPath);
    }
    static _addDefaultReporter(reporters) {
        reporters.push({
            name: 'spec',
            output: process.stdout
        });
    }
    async _getReporterPlugins() {
        if (!this.reporters.length)
            Bootstrapper._addDefaultReporter(this.reporters);
        return Promise.all(this.reporters.map(async ({ name, output }) => {
            const pluginFactory = reporter_1.getPluginFactory(name);
            const processedName = reporter_1.processReporterName(name);
            const outStream = output ? await this._ensureOutStream(output) : void 0;
            return {
                plugin: pluginFactory(),
                name: processedName,
                outStream
            };
        }));
    }
    async _startTestedApp() {
        if (!this.appCommand)
            return void 0;
        const testedApp = new tested_app_1.default();
        await testedApp.start(this.appCommand, this.appInitDelay);
        return testedApp;
    }
    async _canUseParallelBootstrapping(browserInfo) {
        const isLocalPromises = browserInfo.map(browser => browser.provider.isLocalBrowser(void 0, Bootstrapper._getBrowserName(browser)));
        const isLocalBrowsers = await Promise.all(isLocalPromises);
        return isLocalBrowsers.every(result => result);
    }
    async _bootstrapSequence(browserInfo) {
        const tests = await this._getTests();
        const testedApp = await this._startTestedApp();
        const browserSet = await this._getBrowserConnections(browserInfo);
        return { tests, testedApp, browserSet };
    }
    _wrapBootstrappingPromise(promise) {
        return promise
            .then(result => ({ error: void 0, result }))
            .catch(error => ({ result: void 0, error }));
    }
    async _getBootstrappingError(browserSetStatus, testsStatus, testedAppStatus) {
        if (!isPromiseError(browserSetStatus))
            await browserSetStatus.result.dispose();
        if (!isPromiseError(browserSetStatus) && !isPromiseError(testedAppStatus) && testedAppStatus.result)
            await testedAppStatus.result.kill();
        if (isPromiseError(testsStatus))
            return testsStatus.error;
        if (isPromiseError(testedAppStatus))
            return testedAppStatus.error;
        if (isPromiseError(browserSetStatus))
            return browserSetStatus.error;
        return new Error('Unexpected call');
    }
    _getBootstrappingPromises(arg) {
        const result = {};
        for (const k in arg)
            result[k] = this._wrapBootstrappingPromise(arg[k]);
        return result;
    }
    async _bootstrapParallel(browserInfo) {
        const bootstrappingPromises = {
            browserSet: this._getBrowserConnections(browserInfo),
            tests: this._getTests(),
            app: this._startTestedApp()
        };
        const bootstrappingResultPromises = this._getBootstrappingPromises(bootstrappingPromises);
        const bootstrappingResults = await Promise.all([
            bootstrappingResultPromises.browserSet,
            bootstrappingResultPromises.tests,
            bootstrappingResultPromises.app
        ]);
        const [browserSetResults, testResults, appResults] = bootstrappingResults;
        if (isPromiseError(browserSetResults) || isPromiseError(testResults) || isPromiseError(appResults))
            throw await this._getBootstrappingError(...bootstrappingResults);
        return {
            browserSet: browserSetResults.result,
            tests: testResults.result,
            testedApp: appResults.result
        };
    }
    // API
    async createRunnableConfiguration() {
        const reporterPlugins = await this._getReporterPlugins();
        const commonClientScripts = await load_1.default(this.clientScripts);
        // NOTE: If a user forgot to specify a browser, but has specified a path to tests, the specified path will be
        // considered as the browser argument, and the tests path argument will have the predefined default value.
        // It's very ambiguous for the user, who might be confused by compilation errors from an unexpected test.
        // So, we need to retrieve the browser aliases and paths before tests compilation.
        const browserInfo = await this._getBrowserInfo();
        if (os_family_1.default.mac)
            await Bootstrapper._checkRequiredPermissions(browserInfo);
        if (os_family_1.default.linux && !detect_display_1.default())
            await Bootstrapper._checkThatTestsCanRunWithoutDisplay(browserInfo);
        if (await this._canUseParallelBootstrapping(browserInfo))
            return Object.assign(Object.assign({ reporterPlugins }, await this._bootstrapParallel(browserInfo)), { commonClientScripts });
        return Object.assign(Object.assign({ reporterPlugins }, await this._bootstrapSequence(browserInfo)), { commonClientScripts });
    }
}
exports.default = Bootstrapper;
module.exports = exports.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYm9vdHN0cmFwcGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3J1bm5lci9ib290c3RyYXBwZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxnREFBd0I7QUFDeEIsNENBQW9CO0FBQ3BCLGtEQUF5QjtBQUN6QixtQ0FJZ0I7QUFFaEIsd0RBQStCO0FBQy9CLDBEQUEyQjtBQUMzQixrREFBMEI7QUFDMUIsa0VBQXVDO0FBQ3ZDLG1FQUE0RDtBQUM1RCx5RkFBZ0U7QUFDaEUsMkRBQW1DO0FBQ25DLHVFQUF1RTtBQUN2RSxvRUFBMkQ7QUFDM0QsZ0VBQXVDO0FBQ3ZDLGlGQUF3RTtBQUN4RSwrQ0FBaUQ7QUFDakQsMkNBQWlEO0FBQ2pELDhEQUFxQztBQUNyQywrRUFBcUQ7QUFDckQsdUdBQTRFO0FBQzVFLHlFQUE4RDtBQUM5RCw0Q0FBOEQ7QUFXOUQsNkVBQW9EO0FBQ3BELGdEQUEwRTtBQUUxRSwrRUFBc0Q7QUFDdEQsdUZBQWdFO0FBQ2hFLHlGQUErRDtBQUUvRCxNQUFNLFdBQVcsR0FBRyx1QkFBdUIsQ0FBQztBQWlDNUMsU0FBUyxjQUFjLENBQThCLEtBQTBCO0lBQzNFLE9BQVEsS0FBeUIsQ0FBQyxLQUFLLEtBQUssS0FBSyxDQUFDLENBQUM7QUFDdkQsQ0FBQztBQWFELE1BQXFCLFlBQVk7SUFxQjdCLFlBQW9CLHdCQUFrRCxFQUFFLGVBQWlDO1FBQ3JHLElBQUksQ0FBQyx3QkFBd0IsR0FBRyx3QkFBd0IsQ0FBQztRQUN6RCxJQUFJLENBQUMsV0FBVyxHQUFnQixDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLE9BQU8sR0FBb0IsRUFBRSxDQUFDO1FBQ25DLElBQUksQ0FBQyxRQUFRLEdBQW1CLEVBQUUsQ0FBQztRQUNuQyxJQUFJLENBQUMsU0FBUyxHQUFrQixFQUFFLENBQUM7UUFDbkMsSUFBSSxDQUFDLE1BQU0sR0FBcUIsS0FBSyxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLFVBQVUsR0FB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bSAnZnMnO1xuaW1wb3J0IGlzQ0kgZnJvbSAnaXMtY2knO1xuaW1wb3J0IHtcbiAgICBmbGF0dGVuLFxuICAgIGNodW5rLFxuICAgIHRpbWVzXG59IGZyb20gJ2xvZGFzaCc7XG5cbmltcG9ydCBtYWtlRGlyIGZyb20gJ21ha2UtZGlyJztcbmltcG9ydCBPUyBmcm9tICdvcy1mYW1pbHknO1xuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbmltcG9ydCBwcmV0dHlUaW1lIGZyb20gJ3ByZXR0eS1ocnRpbWUnO1xuaW1wb3J0IHsgZXJyb3JzLCBmaW5kV2luZG93IH0gZnJvbSAndGVzdGNhZmUtYnJvd3Nlci10b29scyc7XG5pbXBvcnQgYXV0aGVudGljYXRpb25IZWxwZXIgZnJvbSAnLi4vY2xpL2F1dGhlbnRpY2F0aW9uLWhlbHBlcic7XG5pbXBvcnQgQ29tcGlsZXIgZnJvbSAnLi4vY29tcGlsZXInO1xuaW1wb3J0IEJyb3dzZXJDb25uZWN0aW9uLCB7IEJyb3dzZXJJbmZvIH0gZnJvbSAnLi4vYnJvd3Nlci9jb25uZWN0aW9uJztcbmltcG9ydCBicm93c2VyUHJvdmlkZXJQb29sIGZyb20gJy4uL2Jyb3dzZXIvcHJvdmlkZXIvcG9vbCc7XG5pbXBvcnQgQnJvd3NlclNldCBmcm9tICcuL2Jyb3dzZXItc2V0JztcbmltcG9ydCBSZW1vdGVCcm93c2VyUHJvdmlkZXIgZnJvbSAnLi4vYnJvd3Nlci9wcm92aWRlci9idWlsdC1pbi9yZW1vdGUnO1xuaW1wb3J0IHsgR2VuZXJhbEVycm9yIH0gZnJvbSAnLi4vZXJyb3JzL3J1bnRpbWUnO1xuaW1wb3J0IHsgUlVOVElNRV9FUlJPUlMgfSBmcm9tICcuLi9lcnJvcnMvdHlwZXMnO1xuaW1wb3J0IFRlc3RlZEFwcCBmcm9tICcuL3Rlc3RlZC1hcHAnO1xuaW1wb3J0IHBhcnNlRmlsZUxpc3QgZnJvbSAnLi4vdXRpbHMvcGFyc2UtZmlsZS1saXN0JztcbmltcG9ydCByZXNvbHZlUGF0aFJlbGF0aXZlbHlDd2QgZnJvbSAnLi4vdXRpbHMvcmVzb2x2ZS1wYXRoLXJlbGF0aXZlbHktY3dkJztcbmltcG9ydCBsb2FkQ2xpZW50U2NyaXB0cyBmcm9tICcuLi9jdXN0b20tY2xpZW50LXNjcmlwdHMvbG9hZCc7XG5pbXBvcnQgeyBnZXRDb25jYXRlbmF0ZWRWYWx1ZXNTdHJpbmcgfSBmcm9tICcuLi91dGlscy9zdHJpbmcnO1xuXG5pbXBvcnQgeyBXcml0YWJsZSBhcyBXcml0YWJsZVN0cmVhbSB9IGZyb20gJ3N0cmVhbSc7XG5pbXBvcnQgeyBSZXBvcnRlclNvdXJjZSwgUmVwb3J0ZXJQbHVnaW5Tb3VyY2UgfSBmcm9tICcuLi9yZXBvcnRlci9pbnRlcmZhY2VzJztcbmltcG9ydCBDbGllbnRTY3JpcHQgZnJvbSAnLi4vY3VzdG9tLWNsaWVudC1zY3JpcHRzL2NsaWVudC1zY3JpcHQnO1xuaW1wb3J0IENsaWVudFNjcmlwdEluaXQgZnJvbSAnLi4vY3VzdG9tLWNsaWVudC1zY3JpcHRzL2NsaWVudC1zY3JpcHQtaW5pdCc7XG5pbXBvcnQgQnJvd3NlckNvbm5lY3Rpb25HYXRld2F5IGZyb20gJy4uL2Jyb3dzZXIvY29ubmVjdGlvbi9nYXRld2F5JztcbmltcG9ydCB7IENvbXBpbGVyQXJndW1lbnRzIH0gZnJvbSAnLi4vY29tcGlsZXIvaW50ZXJmYWNlcyc7XG5pbXBvcnQgQ29tcGlsZXJTZXJ2aWNlIGZyb20gJy4uL3NlcnZpY2VzL2NvbXBpbGVyL2hvc3QnO1xuaW1wb3J0IHsgTWV0YWRhdGEgfSBmcm9tICcuLi9hcGkvc3RydWN0dXJlL2ludGVyZmFjZXMnO1xuaW1wb3J0IFRlc3QgZnJvbSAnLi4vYXBpL3N0cnVjdHVyZS90ZXN0JztcbmltcG9ydCBkZXRlY3REaXNwbGF5IGZyb20gJy4uL3V0aWxzL2RldGVjdC1kaXNwbGF5JztcbmltcG9ydCB7IGdldFBsdWdpbkZhY3RvcnksIHByb2Nlc3NSZXBvcnRlck5hbWUgfSBmcm9tICcuLi91dGlscy9yZXBvcnRlcic7XG5pbXBvcnQgeyBCcm93c2VyU2V0T3B0aW9ucyB9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5pbXBvcnQgV2FybmluZ0xvZyBmcm9tICcuLi9ub3RpZmljYXRpb25zL3dhcm5pbmctbG9nJztcbmltcG9ydCBXQVJOSU5HX01FU1NBR0VTIGZyb20gJy4uL25vdGlmaWNhdGlvbnMvd2FybmluZy1tZXNzYWdlJztcbmltcG9ydCBndWFyZFRpbWVFeGVjdXRpb24gZnJvbSAnLi4vdXRpbHMvZ3VhcmQtdGltZS1leGVjdXRpb24nO1xuXG5jb25zdCBERUJVR19TQ09QRSA9ICd0ZXN0Y2FmZTpib290c3RyYXBwZXInO1xuXG50eXBlIFRlc3RTb3VyY2UgPSB1bmtub3duO1xuXG50eXBlIEJyb3dzZXJTb3VyY2UgPSBCcm93c2VyQ29ubmVjdGlvbiB8IHN0cmluZztcblxuaW50ZXJmYWNlIEZpbHRlciB7XG4gICAgKHRlc3ROYW1lOiBzdHJpbmcsIGZpeHR1cmVOYW1lOiBzdHJpbmcsIGZpeHR1cmVQYXRoOiBzdHJpbmcsIHRlc3RNZXRhOiBNZXRhZGF0YSwgZml4dHVyZU1ldGE6IE1ldGFkYXRhKTogYm9vbGVhbjtcbn1cblxudHlwZSBCcm93c2VySW5mb1NvdXJjZSA9IEJyb3dzZXJJbmZvIHwgQnJvd3NlckNvbm5lY3Rpb247XG5cbmludGVyZmFjZSBQcm9taXNlU3VjY2VzczxUPiB7XG4gICAgcmVzdWx0OiBUO1xufVxuXG5pbnRlcmZhY2UgUHJvbWlzZUVycm9yPEUgZXh0ZW5kcyBFcnJvciA9IEVycm9yPiB7XG4gICAgZXJyb3I6IEU7XG59XG5cbmludGVyZmFjZSBCYXNpY1J1bnRpbWVSZXNvdXJjZXMge1xuICAgIGJyb3dzZXJTZXQ6IEJyb3dzZXJTZXQ7XG4gICAgdGVzdHM6IFRlc3RbXTtcbiAgICB0ZXN0ZWRBcHA/OiBUZXN0ZWRBcHA7XG59XG5cbmludGVyZmFjZSBSdW50aW1lUmVzb3VyY2VzIGV4dGVuZHMgQmFzaWNSdW50aW1lUmVzb3VyY2VzIHtcbiAgICByZXBvcnRlclBsdWdpbnM6IFJlcG9ydGVyUGx1Z2luU291cmNlW107XG4gICAgY29tbW9uQ2xpZW50U2NyaXB0czogQ2xpZW50U2NyaXB0W107XG59XG5cbnR5cGUgUHJvbWlzZVJlc3VsdDxULCBFIGV4dGVuZHMgRXJyb3IgPSBFcnJvcj4gPSBQcm9taXNlU3VjY2VzczxUPiB8IFByb21pc2VFcnJvcjxFPjtcblxuZnVuY3Rpb24gaXNQcm9taXNlRXJyb3I8VCwgRSBleHRlbmRzIEVycm9yID0gRXJyb3I+ICh2YWx1ZTogUHJvbWlzZVJlc3VsdDxULCBFPik6IHZhbHVlIGlzIFByb21pc2VFcnJvcjxFPiB7XG4gICAgcmV0dXJuICh2YWx1ZSBhcyBQcm9taXNlRXJyb3I8RT4pLmVycm9yICE9PSB2b2lkIDA7XG59XG5cbmludGVyZmFjZSBTZXBhcmF0ZWRCcm93c2VySW5mbyB7XG4gICAgcmVtb3RlczogQnJvd3NlckNvbm5lY3Rpb25bXTtcbiAgICBhdXRvbWF0ZWQ6IEJyb3dzZXJJbmZvW107XG59XG5cbnR5cGUgUHJvbWlzZUNvbGxlY3Rpb248VD4gPSB7XG4gICAgW0sgaW4ga2V5b2YgVF06IFByb21pc2U8VFtLXT5cbn1cblxudHlwZSBSZXN1bHRDb2xsZWN0aW9uPFQ+ID0geyBbUCBpbiBrZXlvZiBUXTogUHJvbWlzZVJlc3VsdDxUW1BdPiB9O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCb290c3RyYXBwZXIge1xuICAgIHByaXZhdGUgcmVhZG9ubHkgYnJvd3NlckNvbm5lY3Rpb25HYXRld2F5OiBCcm93c2VyQ29ubmVjdGlvbkdhdGV3YXk7XG4gICAgcHVibGljIGNvbmN1cnJlbmN5OiBudW1iZXI7XG4gICAgcHVibGljIHNvdXJjZXM6IFRlc3RTb3VyY2VbXTtcbiAgICBwdWJsaWMgYnJvd3NlcnM6IEJyb3dzZXJTb3VyY2VbXTtcbiAgICBwdWJsaWMgcmVwb3J0ZXJzOiBSZXBvcnRlclNvdXJjZVtdO1xuICAgIHB1YmxpYyBmaWx0ZXI/OiBGaWx0ZXI7XG4gICAgcHVibGljIGFwcENvbW1hbmQ/OiBzdHJpbmc7XG4gICAgcHVibGljIGFwcEluaXREZWxheT86IG51bWJlcjtcbiAgICBwdWJsaWMgdHNDb25maWdQYXRoPzogc3RyaW5nO1xuICAgIHB1YmxpYyBjbGllbnRTY3JpcHRzOiBDbGllbnRTY3JpcHRJbml0W107XG4gICAgcHVibGljIGRpc2FibGVNdWx0aXBsZVdpbmRvd3M6IGJvb2xlYW47XG4gICAgcHVibGljIGNvbXBpbGVyT3B0aW9ucz86IENvbXBpbGVyT3B0aW9ucztcbiAgICBwdWJsaWMgYnJvd3NlckluaXRUaW1lb3V0PzogbnVtYmVyO1xuXG4gICAgcHJpdmF0ZSByZWFkb25seSBjb21waWxlclNlcnZpY2U/OiBDb21waWxlclNlcnZpY2U7XG4gICAgcHJpdmF0ZSByZWFkb25seSBkZWJ1Z0xvZ2dlcjogZGVidWcuRGVidWdnZXI7XG4gICAgcHJpdmF0ZSByZWFkb25seSB3YXJuaW5nTG9nOiBXYXJuaW5nTG9nO1xuXG4gICAgcHJpdmF0ZSBURVNUU19DT01QSUxBVElPTl9VUFBFUkJPVU5EOiBudW1iZXI7XG5cbiAgICBwdWJsaWMgY29uc3RydWN0b3IgKGJyb3dzZXJDb25uZWN0aW9uR2F0ZXdheTogQnJvd3NlckNvbm5lY3Rpb25HYXRld2F5LCBjb21waWxlclNlcnZpY2U/OiBDb21waWxlclNlcnZpY2UpIHtcbiAgICAgICAgdGhpcy5icm93c2VyQ29ubmVjdGlvbkdhdGV3YXkgPSBicm93c2VyQ29ubmVjdGlvbkdhdGV3YXk7XG4gICAgICAgIHRoaXMuY29uY3VycmVuY3kgICAgICAgICAgICAgID0gMTtcbiAgICAgICAgdGhpcy5zb3VyY2VzICAgICAgICAgICAgICAgICAgPSBbXTtcbiAgICAgICAgdGhpcy5icm93c2VycyAgICAgICAgICAgICAgICAgPSBbXTtcbiAgICAgICAgdGhpcy5yZXBvcnRlcnMgICAgICAgICAgICAgICAgPSBbXTtcbiAgICAgICAgdGhpcy5maWx0ZXIgICAgICAgICAgICAgICAgICAgPSB2b2lkIDA7XG4gICAgICAgIHRoaXMuYXBwQ29tbWFuZCAgICAgICAgICAgICAgID0gdm9pZCAwO1xuICAgICAgICB0aGlzLmFwcEluaXREZWxheSAgICAgICAgICAgICA9IHZvaWQgMDtcbiAgICAgICAgdGhpcy50c0NvbmZpZ1BhdGggICAgICAgICAgICAgPSB2b2lkIDA7XG4gICAgICAgIHRoaXMuY2xpZW50U2NyaXB0cyAgICAgICAgICAgID0gW107XG4gICAgICAgIHRoaXMuZGlzYWJsZU11bHRpcGxlV2luZG93cyAgID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY29tcGlsZXJPcHRpb25zICAgICAgICAgID0gdm9pZCAwO1xuICAgICAgICB0aGlzLmRlYnVnTG9nZ2VyICAgICAgICAgICAgICA9IGRlYnVnKERFQlVHX1NDT1BFKTtcbiAgICAgICAgdGhpcy53YXJuaW5nTG9nICAgICAgICAgICAgICAgPSBuZXcgV2FybmluZ0xvZygpO1xuXG4gICAgICAgIHRoaXMuVEVTVFNfQ09NUElMQVRJT05fVVBQRVJCT1VORCA9IDYwO1xuXG4gICAgICAgIHRoaXMuY29tcGlsZXJTZXJ2aWNlID0gY29tcGlsZXJTZXJ2aWNlO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RhdGljIF9nZXRCcm93c2VyTmFtZSAoYnJvd3NlcjogQnJvd3NlckluZm9Tb3VyY2UpOiBzdHJpbmcge1xuICAgICAgICBpZiAoYnJvd3NlciBpbnN0YW5jZW9mIEJyb3dzZXJDb25uZWN0aW9uKVxuICAgICAgICAgICAgcmV0dXJuIGJyb3dzZXIuYnJvd3NlckluZm8uYnJvd3Nlck5hbWU7XG5cbiAgICAgICAgcmV0dXJuIGJyb3dzZXIuYnJvd3Nlck5hbWU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdGF0aWMgX3NwbGl0QnJvd3NlckluZm8gKGJyb3dzZXJJbmZvOiBCcm93c2VySW5mb1NvdXJjZVtdKTogU2VwYXJhdGVkQnJvd3NlckluZm8ge1xuICAgICAgICBjb25zdCByZW1vdGVzOiBCcm93c2VyQ29ubmVjdGlvbltdICA9IFtdO1xuICAgICAgICBjb25zdCBhdXRvbWF0ZWQ6IEJyb3dzZXJJbmZvW10gICAgICA9IFtdO1xuXG4gICAgICAgIGJyb3dzZXJJbmZvLmZvckVhY2goYnJvd3NlciA9PiB7XG4gICAgICAgICAgICBpZiAoYnJvd3NlciBpbnN0YW5jZW9mIEJyb3dzZXJDb25uZWN0aW9uKVxuICAgICAgICAgICAgICAgIHJlbW90ZXMucHVzaChicm93c2VyKTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBhdXRvbWF0ZWQucHVzaChicm93c2VyKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHsgcmVtb3RlcywgYXV0b21hdGVkIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdGF0aWMgYXN5bmMgX2hhc0xvY2FsQnJvd3NlcnMgKGJyb3dzZXJJbmZvOiBCcm93c2VySW5mb1NvdXJjZVtdKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGZvciAoY29uc3QgYnJvd3NlciBvZiBicm93c2VySW5mbykge1xuICAgICAgICAgICAgaWYgKGJyb3dzZXIgaW5zdGFuY2VvZiBCcm93c2VyQ29ubmVjdGlvbilcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgaWYgKGF3YWl0IGJyb3dzZXIucHJvdmlkZXIuaXNMb2NhbEJyb3dzZXIodm9pZCAwLCBicm93c2VyLmJyb3dzZXJOYW1lKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN0YXRpYyBhc3luYyBfY2hlY2tSZXF1aXJlZFBlcm1pc3Npb25zIChicm93c2VySW5mbzogQnJvd3NlckluZm9Tb3VyY2VbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBoYXNMb2NhbEJyb3dzZXJzID0gYXdhaXQgQm9vdHN0cmFwcGVyLl9oYXNMb2NhbEJyb3dzZXJzKGJyb3dzZXJJbmZvKTtcblxuICAgICAgICBjb25zdCB7IGVycm9yIH0gPSBhd2FpdCBhdXRoZW50aWNhdGlvbkhlbHBlcihcbiAgICAgICAgICAgICgpID0+IGZpbmRXaW5kb3coJycpLFxuICAgICAgICAgICAgZXJyb3JzLlVuYWJsZVRvQWNjZXNzU2NyZWVuUmVjb3JkaW5nQVBJRXJyb3IsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaW50ZXJhY3RpdmU6IGhhc0xvY2FsQnJvd3NlcnMgJiYgIWlzQ0lcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoIWVycm9yKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIGlmIChoYXNMb2NhbEJyb3dzZXJzKVxuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG5cbiAgICAgICAgUmVtb3RlQnJvd3NlclByb3ZpZGVyLmNhbkRldGVjdExvY2FsQnJvd3NlcnMgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN0YXRpYyBhc3luYyBfY2hlY2tUaGF0VGVzdHNDYW5SdW5XaXRob3V0RGlzcGxheSAoYnJvd3NlckluZm9Tb3VyY2U6IEJyb3dzZXJJbmZvU291cmNlW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgZm9yIChsZXQgYnJvd3NlckluZm8gb2YgYnJvd3NlckluZm9Tb3VyY2UpIHtcbiAgICAgICAgICAgIGlmIChicm93c2VySW5mbyBpbnN0YW5jZW9mIEJyb3dzZXJDb25uZWN0aW9uKVxuICAgICAgICAgICAgICAgIGJyb3dzZXJJbmZvID0gYnJvd3NlckluZm8uYnJvd3NlckluZm87XG5cbiAgICAgICAgICAgIGNvbnN0IGlzTG9jYWxCcm93c2VyICAgID0gYXdhaXQgYnJvd3NlckluZm8ucHJvdmlkZXIuaXNMb2NhbEJyb3dzZXIodm9pZCAwLCBicm93c2VySW5mby5icm93c2VyTmFtZSk7XG4gICAgICAgICAgICBjb25zdCBpc0hlYWRsZXNzQnJvd3NlciA9IGF3YWl0IGJyb3dzZXJJbmZvLnByb3ZpZGVyLmlzSGVhZGxlc3NCcm93c2VyKHZvaWQgMCwgYnJvd3NlckluZm8uYnJvd3Nlck5hbWUpO1xuXG4gICAgICAgICAgICBpZiAoaXNMb2NhbEJyb3dzZXIgJiYgIWlzSGVhZGxlc3NCcm93c2VyKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEdlbmVyYWxFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgUlVOVElNRV9FUlJPUlMuY2Fubm90UnVuTG9jYWxOb25IZWFkbGVzc0Jyb3dzZXJXaXRob3V0RGlzcGxheSxcbiAgICAgICAgICAgICAgICAgICAgYnJvd3NlckluZm8uYWxpYXNcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfZ2V0QnJvd3NlckluZm8gKCk6IFByb21pc2U8QnJvd3NlckluZm9Tb3VyY2VbXT4ge1xuICAgICAgICBpZiAoIXRoaXMuYnJvd3NlcnMubGVuZ3RoKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEdlbmVyYWxFcnJvcihSVU5USU1FX0VSUk9SUy5icm93c2VyTm90U2V0KTtcblxuICAgICAgICBjb25zdCBicm93c2VySW5mbyA9IGF3YWl0IFByb21pc2UuYWxsKHRoaXMuYnJvd3NlcnMubWFwKGJyb3dzZXIgPT4gYnJvd3NlclByb3ZpZGVyUG9vbC5nZXRCcm93c2VySW5mbyhicm93c2VyKSkpO1xuXG4gICAgICAgIHJldHVybiBmbGF0dGVuKGJyb3dzZXJJbmZvKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jcmVhdGVBdXRvbWF0ZWRDb25uZWN0aW9ucyAoYnJvd3NlckluZm86IEJyb3dzZXJJbmZvW10pOiBCcm93c2VyQ29ubmVjdGlvbltdW10ge1xuICAgICAgICBpZiAoIWJyb3dzZXJJbmZvKVxuICAgICAgICAgICAgcmV0dXJuIFtdO1xuXG4gICAgICAgIHJldHVybiBicm93c2VySW5mb1xuICAgICAgICAgICAgLm1hcChicm93c2VyID0+IHRpbWVzKHRoaXMuY29uY3VycmVuY3ksICgpID0+IG5ldyBCcm93c2VyQ29ubmVjdGlvbih0aGlzLmJyb3dzZXJDb25uZWN0aW9uR2F0ZXdheSwgYnJvd3NlciwgZmFsc2UsIHRoaXMuZGlzYWJsZU11bHRpcGxlV2luZG93cykpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9nZXRCcm93c2VyU2V0T3B0aW9ucyAoKTogQnJvd3NlclNldE9wdGlvbnMge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29uY3VycmVuY3k6ICAgICAgICB0aGlzLmNvbmN1cnJlbmN5LFxuICAgICAgICAgICAgYnJvd3NlckluaXRUaW1lb3V0OiB0aGlzLmJyb3dzZXJJbml0VGltZW91dCxcbiAgICAgICAgICAgIHdhcm5pbmdMb2c6ICAgICAgICAgdGhpcy53YXJuaW5nTG9nXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfZ2V0QnJvd3NlckNvbm5lY3Rpb25zIChicm93c2VySW5mbzogQnJvd3NlckluZm9Tb3VyY2VbXSk6IFByb21pc2U8QnJvd3NlclNldD4ge1xuICAgICAgICBjb25zdCB7IGF1dG9tYXRlZCwgcmVtb3RlcyB9ID0gQm9vdHN0cmFwcGVyLl9zcGxpdEJyb3dzZXJJbmZvKGJyb3dzZXJJbmZvKTtcblxuICAgICAgICBpZiAocmVtb3RlcyAmJiByZW1vdGVzLmxlbmd0aCAlIHRoaXMuY29uY3VycmVuY3kpXG4gICAgICAgICAgICB0aHJvdyBuZXcgR2VuZXJhbEVycm9yKFJVTlRJTUVfRVJST1JTLmNhbm5vdERpdmlkZVJlbW90ZXNDb3VudEJ5Q29uY3VycmVuY3kpO1xuXG4gICAgICAgIGxldCBicm93c2VyQ29ubmVjdGlvbnMgPSB0aGlzLl9jcmVhdGVBdXRvbWF0ZWRDb25uZWN0aW9ucyhhdXRvbWF0ZWQpO1xuXG4gICAgICAgIGJyb3dzZXJDb25uZWN0aW9ucyA9IGJyb3dzZXJDb25uZWN0aW9ucy5jb25jYXQoY2h1bmsocmVtb3RlcywgdGhpcy5jb25jdXJyZW5jeSkpO1xuXG4gICAgICAgIHJldHVybiBCcm93c2VyU2V0LmZyb20oYnJvd3NlckNvbm5lY3Rpb25zLCB0aGlzLl9nZXRCcm93c2VyU2V0T3B0aW9ucygpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9maWx0ZXJUZXN0cyAodGVzdHM6IFRlc3RbXSwgcHJlZGljYXRlOiBGaWx0ZXIpOiBUZXN0W10ge1xuICAgICAgICByZXR1cm4gdGVzdHMuZmlsdGVyKHRlc3QgPT4gcHJlZGljYXRlKHRlc3QubmFtZSBhcyBzdHJpbmcsIHRlc3QuZml4dHVyZS5uYW1lIGFzIHN0cmluZywgdGVzdC5maXh0dXJlLnBhdGgsIHRlc3QubWV0YSwgdGVzdC5maXh0dXJlLm1ldGEpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9jb21waWxlVGVzdHMgKHsgc291cmNlTGlzdCwgY29tcGlsZXJPcHRpb25zIH06IENvbXBpbGVyQXJndW1lbnRzKTogUHJvbWlzZTxUZXN0W10+IHtcbiAgICAgICAgaWYgKHRoaXMuY29tcGlsZXJTZXJ2aWNlKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyU2VydmljZS5pbml0KCk7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbXBpbGVyU2VydmljZS5nZXRUZXN0cyh7IHNvdXJjZUxpc3QsIGNvbXBpbGVyT3B0aW9ucyB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKHNvdXJjZUxpc3QsIGNvbXBpbGVyT3B0aW9ucyk7XG5cbiAgICAgICAgcmV0dXJuIGNvbXBpbGVyLmdldFRlc3RzKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfZ2V0VGVzdHMgKCk6IFByb21pc2U8VGVzdFtdPiB7XG4gICAgICAgIGNvbnN0IGN3ZCAgICAgICAgPSBwcm9jZXNzLmN3ZCgpO1xuICAgICAgICBjb25zdCBzb3VyY2VMaXN0ID0gYXdhaXQgcGFyc2VGaWxlTGlzdCh0aGlzLnNvdXJjZXMsIGN3ZCk7XG5cbiAgICAgICAgaWYgKCFzb3VyY2VMaXN0Lmxlbmd0aClcbiAgICAgICAgICAgIHRocm93IG5ldyBHZW5lcmFsRXJyb3IoUlVOVElNRV9FUlJPUlMudGVzdEZpbGVzTm90Rm91bmQsIGdldENvbmNhdGVuYXRlZFZhbHVlc1N0cmluZyh0aGlzLnNvdXJjZXMsICdcXG4nLCAnJyksIGN3ZCk7XG5cbiAgICAgICAgbGV0IHRlc3RzID0gYXdhaXQgZ3VhcmRUaW1lRXhlY3V0aW9uKFxuICAgICAgICAgICAgYXN5bmMgKCkgPT4gYXdhaXQgdGhpcy5fY29tcGlsZVRlc3RzKHsgc291cmNlTGlzdCwgY29tcGlsZXJPcHRpb25zOiB0aGlzLmNvbXBpbGVyT3B0aW9ucyB9KSxcbiAgICAgICAgICAgIGVsYXBzZWRUaW1lID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmRlYnVnTG9nZ2VyKGB0ZXN0cyBjb21waWxhdGlvbiB0b29rICR7cHJldHR5VGltZShlbGFwc2VkVGltZSl9YCk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBbIGVsYXBzZWRTZWNvbmRzIF0gPSBlbGFwc2VkVGltZTtcblxuICAgICAgICAgICAgICAgIGlmIChlbGFwc2VkU2Vjb25kcyA+IHRoaXMuVEVTVFNfQ09NUElMQVRJT05fVVBQRVJCT1VORClcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YXJuaW5nTG9nLmFkZFdhcm5pbmcoV0FSTklOR19NRVNTQUdFUy50ZXN0c0NvbXBpbGF0aW9uVGFrZXNUb29Mb25nLCBwcmV0dHlUaW1lKGVsYXBzZWRUaW1lKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgdGVzdHNXaXRoT25seUZsYWcgPSB0ZXN0cy5maWx0ZXIodGVzdCA9PiB0ZXN0Lm9ubHkpO1xuXG4gICAgICAgIGlmICh0ZXN0c1dpdGhPbmx5RmxhZy5sZW5ndGgpXG4gICAgICAgICAgICB0ZXN0cyA9IHRlc3RzV2l0aE9ubHlGbGFnO1xuXG4gICAgICAgIGlmICghdGVzdHMubGVuZ3RoKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEdlbmVyYWxFcnJvcihSVU5USU1FX0VSUk9SUy5ub1Rlc3RzVG9SdW4pO1xuXG4gICAgICAgIGlmICh0aGlzLmZpbHRlcilcbiAgICAgICAgICAgIHRlc3RzID0gdGhpcy5fZmlsdGVyVGVzdHModGVzdHMsIHRoaXMuZmlsdGVyKTtcblxuICAgICAgICBpZiAoIXRlc3RzLmxlbmd0aClcbiAgICAgICAgICAgIHRocm93IG5ldyBHZW5lcmFsRXJyb3IoUlVOVElNRV9FUlJPUlMubm9UZXN0c1RvUnVuRHVlRmlsdGVyaW5nKTtcblxuICAgICAgICByZXR1cm4gdGVzdHM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfZW5zdXJlT3V0U3RyZWFtIChvdXRTdHJlYW06IHN0cmluZyB8IFdyaXRhYmxlU3RyZWFtKTogUHJvbWlzZTxXcml0YWJsZVN0cmVhbT4ge1xuICAgICAgICBpZiAodHlwZW9mIG91dFN0cmVhbSAhPT0gJ3N0cmluZycpXG4gICAgICAgICAgICByZXR1cm4gb3V0U3RyZWFtO1xuXG4gICAgICAgIGNvbnN0IGZ1bGxSZXBvcnRlck91dHB1dFBhdGggPSByZXNvbHZlUGF0aFJlbGF0aXZlbHlDd2Qob3V0U3RyZWFtKTtcblxuICAgICAgICBhd2FpdCBtYWtlRGlyKHBhdGguZGlybmFtZShmdWxsUmVwb3J0ZXJPdXRwdXRQYXRoKSk7XG5cbiAgICAgICAgcmV0dXJuIGZzLmNyZWF0ZVdyaXRlU3RyZWFtKGZ1bGxSZXBvcnRlck91dHB1dFBhdGgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RhdGljIF9hZGREZWZhdWx0UmVwb3J0ZXIgKHJlcG9ydGVyczogUmVwb3J0ZXJTb3VyY2VbXSk6IHZvaWQge1xuICAgICAgICByZXBvcnRlcnMucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiAgICdzcGVjJyxcbiAgICAgICAgICAgIG91dHB1dDogcHJvY2Vzcy5zdGRvdXRcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfZ2V0UmVwb3J0ZXJQbHVnaW5zICgpOiBQcm9taXNlPFJlcG9ydGVyUGx1Z2luU291cmNlW10+IHtcbiAgICAgICAgaWYgKCF0aGlzLnJlcG9ydGVycy5sZW5ndGgpXG4gICAgICAgICAgICBCb290c3RyYXBwZXIuX2FkZERlZmF1bHRSZXBvcnRlcih0aGlzLnJlcG9ydGVycyk7XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHRoaXMucmVwb3J0ZXJzLm1hcChhc3luYyAoeyBuYW1lLCBvdXRwdXQgfSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGx1Z2luRmFjdG9yeSA9IGdldFBsdWdpbkZhY3RvcnkobmFtZSk7XG4gICAgICAgICAgICBjb25zdCBwcm9jZXNzZWROYW1lID0gcHJvY2Vzc1JlcG9ydGVyTmFtZShuYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IG91dFN0cmVhbSAgICAgPSBvdXRwdXQgPyBhd2FpdCB0aGlzLl9lbnN1cmVPdXRTdHJlYW0ob3V0cHV0KSA6IHZvaWQgMDtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBwbHVnaW46IHBsdWdpbkZhY3RvcnkoKSxcbiAgICAgICAgICAgICAgICBuYW1lOiAgIHByb2Nlc3NlZE5hbWUsXG4gICAgICAgICAgICAgICAgb3V0U3RyZWFtXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfc3RhcnRUZXN0ZWRBcHAgKCk6IFByb21pc2U8VGVzdGVkQXBwfHVuZGVmaW5lZD4ge1xuICAgICAgICBpZiAoIXRoaXMuYXBwQ29tbWFuZClcbiAgICAgICAgICAgIHJldHVybiB2b2lkIDA7XG5cbiAgICAgICAgY29uc3QgdGVzdGVkQXBwID0gbmV3IFRlc3RlZEFwcCgpO1xuXG4gICAgICAgIGF3YWl0IHRlc3RlZEFwcC5zdGFydCh0aGlzLmFwcENvbW1hbmQsIHRoaXMuYXBwSW5pdERlbGF5IGFzIG51bWJlcik7XG5cbiAgICAgICAgcmV0dXJuIHRlc3RlZEFwcDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9jYW5Vc2VQYXJhbGxlbEJvb3RzdHJhcHBpbmcgKGJyb3dzZXJJbmZvOiBCcm93c2VySW5mb1NvdXJjZVtdKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGNvbnN0IGlzTG9jYWxQcm9taXNlcyA9IGJyb3dzZXJJbmZvLm1hcChicm93c2VyID0+IGJyb3dzZXIucHJvdmlkZXIuaXNMb2NhbEJyb3dzZXIodm9pZCAwLCBCb290c3RyYXBwZXIuX2dldEJyb3dzZXJOYW1lKGJyb3dzZXIpKSk7XG4gICAgICAgIGNvbnN0IGlzTG9jYWxCcm93c2VycyA9IGF3YWl0IFByb21pc2UuYWxsKGlzTG9jYWxQcm9taXNlcyk7XG5cbiAgICAgICAgcmV0dXJuIGlzTG9jYWxCcm93c2Vycy5ldmVyeShyZXN1bHQgPT4gcmVzdWx0KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9ib290c3RyYXBTZXF1ZW5jZSAoYnJvd3NlckluZm86IEJyb3dzZXJJbmZvU291cmNlW10pOiBQcm9taXNlPEJhc2ljUnVudGltZVJlc291cmNlcz4ge1xuICAgICAgICBjb25zdCB0ZXN0cyAgICAgICA9IGF3YWl0IHRoaXMuX2dldFRlc3RzKCk7XG4gICAgICAgIGNvbnN0IHRlc3RlZEFwcCAgID0gYXdhaXQgdGhpcy5fc3RhcnRUZXN0ZWRBcHAoKTtcbiAgICAgICAgY29uc3QgYnJvd3NlclNldCAgPSBhd2FpdCB0aGlzLl9nZXRCcm93c2VyQ29ubmVjdGlvbnMoYnJvd3NlckluZm8pO1xuXG4gICAgICAgIHJldHVybiB7IHRlc3RzLCB0ZXN0ZWRBcHAsIGJyb3dzZXJTZXQgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF93cmFwQm9vdHN0cmFwcGluZ1Byb21pc2U8VD4gKHByb21pc2U6IFByb21pc2U8VD4pOiBQcm9taXNlPFByb21pc2VSZXN1bHQ8VD4+IHtcbiAgICAgICAgcmV0dXJuIHByb21pc2VcbiAgICAgICAgICAgIC50aGVuKHJlc3VsdCA9PiAoeyBlcnJvcjogdm9pZCAwLCByZXN1bHQgfSkpXG4gICAgICAgICAgICAuY2F0Y2goZXJyb3IgPT4gKHsgcmVzdWx0OiB2b2lkIDAsIGVycm9yIH0pKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9nZXRCb290c3RyYXBwaW5nRXJyb3IgKGJyb3dzZXJTZXRTdGF0dXM6IFByb21pc2VSZXN1bHQ8QnJvd3NlclNldD4sIHRlc3RzU3RhdHVzOiBQcm9taXNlUmVzdWx0PFRlc3RbXT4sIHRlc3RlZEFwcFN0YXR1czogUHJvbWlzZVJlc3VsdDxUZXN0ZWRBcHB8dW5kZWZpbmVkPik6IFByb21pc2U8RXJyb3I+IHtcbiAgICAgICAgaWYgKCFpc1Byb21pc2VFcnJvcihicm93c2VyU2V0U3RhdHVzKSlcbiAgICAgICAgICAgIGF3YWl0IGJyb3dzZXJTZXRTdGF0dXMucmVzdWx0LmRpc3Bvc2UoKTtcblxuICAgICAgICBpZiAoIWlzUHJvbWlzZUVycm9yKGJyb3dzZXJTZXRTdGF0dXMpICYmICFpc1Byb21pc2VFcnJvcih0ZXN0ZWRBcHBTdGF0dXMpICYmIHRlc3RlZEFwcFN0YXR1cy5yZXN1bHQpXG4gICAgICAgICAgICBhd2FpdCB0ZXN0ZWRBcHBTdGF0dXMucmVzdWx0LmtpbGwoKTtcblxuICAgICAgICBpZiAoaXNQcm9taXNlRXJyb3IodGVzdHNTdGF0dXMpKVxuICAgICAgICAgICAgcmV0dXJuIHRlc3RzU3RhdHVzLmVycm9yO1xuXG4gICAgICAgIGlmIChpc1Byb21pc2VFcnJvcih0ZXN0ZWRBcHBTdGF0dXMpKVxuICAgICAgICAgICAgcmV0dXJuIHRlc3RlZEFwcFN0YXR1cy5lcnJvcjtcblxuICAgICAgICBpZiAoaXNQcm9taXNlRXJyb3IoYnJvd3NlclNldFN0YXR1cykpXG4gICAgICAgICAgICByZXR1cm4gYnJvd3NlclNldFN0YXR1cy5lcnJvcjtcblxuICAgICAgICByZXR1cm4gbmV3IEVycm9yKCdVbmV4cGVjdGVkIGNhbGwnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9nZXRCb290c3RyYXBwaW5nUHJvbWlzZXM8VD4gKGFyZzogUHJvbWlzZUNvbGxlY3Rpb248VD4pOiBQcm9taXNlQ29sbGVjdGlvbjxSZXN1bHRDb2xsZWN0aW9uPFQ+PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9IGFzIHVua25vd24gYXMgUHJvbWlzZUNvbGxlY3Rpb248UmVzdWx0Q29sbGVjdGlvbjxUPj47XG5cbiAgICAgICAgZm9yIChjb25zdCBrIGluIGFyZylcbiAgICAgICAgICAgIHJlc3VsdFtrXSA9IHRoaXMuX3dyYXBCb290c3RyYXBwaW5nUHJvbWlzZShhcmdba10pO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfYm9vdHN0cmFwUGFyYWxsZWwgKGJyb3dzZXJJbmZvOiBCcm93c2VySW5mb1NvdXJjZVtdKTogUHJvbWlzZTxCYXNpY1J1bnRpbWVSZXNvdXJjZXM+IHtcbiAgICAgICAgY29uc3QgYm9vdHN0cmFwcGluZ1Byb21pc2VzID0ge1xuICAgICAgICAgICAgYnJvd3NlclNldDogdGhpcy5fZ2V0QnJvd3NlckNvbm5lY3Rpb25zKGJyb3dzZXJJbmZvKSxcbiAgICAgICAgICAgIHRlc3RzOiAgICAgIHRoaXMuX2dldFRlc3RzKCksXG4gICAgICAgICAgICBhcHA6ICAgICAgICB0aGlzLl9zdGFydFRlc3RlZEFwcCgpXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgYm9vdHN0cmFwcGluZ1Jlc3VsdFByb21pc2VzID0gdGhpcy5fZ2V0Qm9vdHN0cmFwcGluZ1Byb21pc2VzKGJvb3RzdHJhcHBpbmdQcm9taXNlcyk7XG5cbiAgICAgICAgY29uc3QgYm9vdHN0cmFwcGluZ1Jlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICBib290c3RyYXBwaW5nUmVzdWx0UHJvbWlzZXMuYnJvd3NlclNldCxcbiAgICAgICAgICAgIGJvb3RzdHJhcHBpbmdSZXN1bHRQcm9taXNlcy50ZXN0cyxcbiAgICAgICAgICAgIGJvb3RzdHJhcHBpbmdSZXN1bHRQcm9taXNlcy5hcHBcbiAgICAgICAgXSk7XG5cbiAgICAgICAgY29uc3QgW2Jyb3dzZXJTZXRSZXN1bHRzLCB0ZXN0UmVzdWx0cywgYXBwUmVzdWx0c10gPSBib290c3RyYXBwaW5nUmVzdWx0cztcblxuICAgICAgICBpZiAoaXNQcm9taXNlRXJyb3IoYnJvd3NlclNldFJlc3VsdHMpIHx8IGlzUHJvbWlzZUVycm9yKHRlc3RSZXN1bHRzKSB8fCBpc1Byb21pc2VFcnJvcihhcHBSZXN1bHRzKSlcbiAgICAgICAgICAgIHRocm93IGF3YWl0IHRoaXMuX2dldEJvb3RzdHJhcHBpbmdFcnJvciguLi5ib290c3RyYXBwaW5nUmVzdWx0cyk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGJyb3dzZXJTZXQ6IGJyb3dzZXJTZXRSZXN1bHRzLnJlc3VsdCxcbiAgICAgICAgICAgIHRlc3RzOiAgICAgIHRlc3RSZXN1bHRzLnJlc3VsdCxcbiAgICAgICAgICAgIHRlc3RlZEFwcDogIGFwcFJlc3VsdHMucmVzdWx0XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gQVBJXG4gICAgcHVibGljIGFzeW5jIGNyZWF0ZVJ1bm5hYmxlQ29uZmlndXJhdGlvbiAoKTogUHJvbWlzZTxSdW50aW1lUmVzb3VyY2VzPiB7XG4gICAgICAgIGNvbnN0IHJlcG9ydGVyUGx1Z2lucyAgICAgPSBhd2FpdCB0aGlzLl9nZXRSZXBvcnRlclBsdWdpbnMoKTtcbiAgICAgICAgY29uc3QgY29tbW9uQ2xpZW50U2NyaXB0cyA9IGF3YWl0IGxvYWRDbGllbnRTY3JpcHRzKHRoaXMuY2xpZW50U2NyaXB0cyk7XG5cbiAgICAgICAgLy8gTk9URTogSWYgYSB1c2VyIGZvcmdvdCB0byBzcGVjaWZ5IGEgYnJvd3NlciwgYnV0IGhhcyBzcGVjaWZpZWQgYSBwYXRoIHRvIHRlc3RzLCB0aGUgc3BlY2lmaWVkIHBhdGggd2lsbCBiZVxuICAgICAgICAvLyBjb25zaWRlcmVkIGFzIHRoZSBicm93c2VyIGFyZ3VtZW50LCBhbmQgdGhlIHRlc3RzIHBhdGggYXJndW1lbnQgd2lsbCBoYXZlIHRoZSBwcmVkZWZpbmVkIGRlZmF1bHQgdmFsdWUuXG4gICAgICAgIC8vIEl0J3MgdmVyeSBhbWJpZ3VvdXMgZm9yIHRoZSB1c2VyLCB3aG8gbWlnaHQgYmUgY29uZnVzZWQgYnkgY29tcGlsYXRpb24gZXJyb3JzIGZyb20gYW4gdW5leHBlY3RlZCB0ZXN0LlxuICAgICAgICAvLyBTbywgd2UgbmVlZCB0byByZXRyaWV2ZSB0aGUgYnJvd3NlciBhbGlhc2VzIGFuZCBwYXRocyBiZWZvcmUgdGVzdHMgY29tcGlsYXRpb24uXG4gICAgICAgIGNvbnN0IGJyb3dzZXJJbmZvID0gYXdhaXQgdGhpcy5fZ2V0QnJvd3NlckluZm8oKTtcblxuICAgICAgICBpZiAoT1MubWFjKVxuICAgICAgICAgICAgYXdhaXQgQm9vdHN0cmFwcGVyLl9jaGVja1JlcXVpcmVkUGVybWlzc2lvbnMoYnJvd3NlckluZm8pO1xuXG4gICAgICAgIGlmIChPUy5saW51eCAmJiAhZGV0ZWN0RGlzcGxheSgpKVxuICAgICAgICAgICAgYXdhaXQgQm9vdHN0cmFwcGVyLl9jaGVja1RoYXRUZXN0c0NhblJ1bldpdGhvdXREaXNwbGF5KGJyb3dzZXJJbmZvKTtcblxuICAgICAgICBpZiAoYXdhaXQgdGhpcy5fY2FuVXNlUGFyYWxsZWxCb290c3RyYXBwaW5nKGJyb3dzZXJJbmZvKSlcbiAgICAgICAgICAgIHJldHVybiB7IHJlcG9ydGVyUGx1Z2lucywgLi4uYXdhaXQgdGhpcy5fYm9vdHN0cmFwUGFyYWxsZWwoYnJvd3NlckluZm8pLCBjb21tb25DbGllbnRTY3JpcHRzIH07XG5cbiAgICAgICAgcmV0dXJuIHsgcmVwb3J0ZXJQbHVnaW5zLCAuLi5hd2FpdCB0aGlzLl9ib290c3RyYXBTZXF1ZW5jZShicm93c2VySW5mbyksIGNvbW1vbkNsaWVudFNjcmlwdHMgfTtcbiAgICB9XG59XG4iXX0=