"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const commander_1 = require("commander");
const dedent_1 = __importDefault(require("dedent"));
const read_file_relative_1 = require("read-file-relative");
const runtime_1 = require("../errors/runtime");
const types_1 = require("../errors/types");
const type_assertions_1 = require("../errors/runtime/type-assertions");
const get_viewport_width_1 = __importDefault(require("../utils/get-viewport-width"));
const string_1 = require("../utils/string");
const get_options_1 = require("../utils/get-options");
const get_filter_fn_1 = __importDefault(require("../utils/get-filter-fn"));
const screenshot_option_names_1 = __importDefault(require("../configuration/screenshot-option-names"));
const run_option_names_1 = __importDefault(require("../configuration/run-option-names"));
const REMOTE_ALIAS_RE = /^remote(?::(\d*))?$/;
const DESCRIPTION = dedent_1.default(`
    In the browser list, you can use browser names (e.g. "ie", "chrome", etc.) as well as paths to executables.

    To run tests against all installed browsers, use the "all" alias.

    To use a remote browser connection (e.g., to connect a mobile device), specify "remote" as the browser alias.
    If you need to connect multiple devices, add a colon and the number of browsers you want to connect (e.g., "remote:3").

    To run tests in a browser accessed through a browser provider plugin, specify a browser alias that consists of two parts - the browser provider name prefix and the name of the browser itself; for example, "saucelabs:chrome@51".

    You can use one or more file paths or glob patterns to specify which tests to run.

    More info: https://devexpress.github.io/testcafe/documentation
`);
class CLIArgumentParser {
    constructor(cwd) {
        this.program = new commander_1.Command('testcafe');
        this.experimental = new commander_1.Command('testcafe-experimental');
        this.cwd = cwd || process.cwd();
        this.remoteCount = 0;
        this.opts = {};
        this.args = [];
        this._describeProgram();
    }
    static _parsePortNumber(value) {
        type_assertions_1.assertType(type_assertions_1.is.nonNegativeNumberString, null, 'Port number', value);
        return parseInt(value, 10);
    }
    static _getDescription() {
        // NOTE: add empty line to workaround commander-forced indentation on the first line.
        return '\n' + string_1.wordWrap(DESCRIPTION, 2, get_viewport_width_1.default(process.stdout));
    }
    _describeProgram() {
        const version = JSON.parse(read_file_relative_1.readSync('../../package.json')).version;
        this.program
            .version(version, '-v, --version')
            .usage('[options] <comma-separated-browser-list> <file-or-glob ...>')
            .description(CLIArgumentParser._getDescription())
            .option('-b, --list-browsers [provider]', 'output the aliases for local browsers or browsers available through the specified browser provider')
            .option('-r, --reporter <name[:outputFile][,...]>', 'specify the reporters and optionally files where reports are saved')
            .option('-s, --screenshots <option=value[,...]>', 'specify screenshot options')
            .option('-S, --screenshots-on-fails', 'take a screenshot whenever a test fails')
            .option('-p, --screenshot-path-pattern <pattern>', 'use patterns to compose screenshot file names and paths: ${BROWSER}, ${BROWSER_VERSION}, ${OS}, etc.')
            .option('-q, --quarantine-mode', 'enable the quarantine mode')
            .option('-d, --debug-mode', 'execute test steps one by one pausing the test after each step')
            .option('-e, --skip-js-errors', 'make tests not fail when a JS error happens on a page')
            .option('-u, --skip-uncaught-errors', 'ignore uncaught errors and unhandled promise rejections, which occur during test execution')
            .option('-t, --test <name>', 'run only tests with the specified name')
            .option('-T, --test-grep <pattern>', 'run only tests matching the specified pattern')
            .option('-f, --fixture <name>', 'run only fixtures with the specified name')
            .option('-F, --fixture-grep <pattern>', 'run only fixtures matching the specified pattern')
            .option('-a, --app <command>', 'launch the tested app using the specified command before running tests')
            .option('-c, --concurrency <number>', 'run tests concurrently')
            .option('-L, --live', 'enable live mode. In this mode, TestCafe watches for changes you make in the test files. These changes immediately restart the tests so that you can see the effect.')
            .option('--test-meta <key=value[,key2=value2,...]>', 'run only tests with matching metadata')
            .option('--fixture-meta <key=value[,key2=value2,...]>', 'run only fixtures with matching metadata')
            .option('--debug-on-fail', 'pause the test if it fails')
            .option('--app-init-delay <ms>', 'specify how much time it takes for the tested app to initialize')
            .option('--selector-timeout <ms>', 'specify the time within which selectors make attempts to obtain a node to be returned')
            .option('--assertion-timeout <ms>', 'specify the time within which assertion should pass')
            .option('--page-load-timeout <ms>', 'specify the time within which TestCafe waits for the `window.load` event to fire on page load before proceeding to the next test action')
            .option('--page-request-timeout <ms>', "specifies the timeout in milliseconds to complete the request for the page's HTML")
            .option('--ajax-request-timeout <ms>', 'specifies the timeout in milliseconds to complete the AJAX requests (XHR or fetch)')
            .option('--browser-init-timeout <ms>', 'specify the time (in milliseconds) TestCafe waits for the browser to start')
            .option('--speed <factor>', 'set the speed of test execution (0.01 ... 1)')
            .option('--ports <port1,port2>', 'specify custom port numbers')
            .option('--hostname <name>', 'specify the hostname')
            .option('--proxy <host>', 'specify the host of the proxy server')
            .option('--proxy-bypass <rules>', 'specify a comma-separated list of rules that define URLs accessed bypassing the proxy server')
            .option('--ssl <options>', 'specify SSL options to run TestCafe proxy server over the HTTPS protocol')
            .option('--video <path>', 'record videos of test runs')
            .option('--video-options <option=value[,...]>', 'specify video recording options')
            .option('--video-encoding-options <option=value[,...]>', 'specify encoding options')
            .option('--dev', 'enables mechanisms to log and diagnose errors')
            .option('--qr-code', 'outputs QR-code that repeats URLs used to connect the remote browsers')
            .option('--sf, --stop-on-first-fail', 'stop an entire test run if any test fails')
            .option('--ts-config-path <path>', 'use a custom TypeScript configuration file and specify its location')
            .option('--cs, --client-scripts <paths>', 'inject scripts into tested pages', this._parseList, [])
            .option('--disable-page-caching', 'disable page caching during test execution')
            .option('--disable-page-reloads', 'disable page reloads between tests')
            .option('--retry-test-pages', 'retry network requests to test pages during test execution')
            .option('--disable-screenshots', 'disable screenshots')
            .option('--screenshots-full-page', 'enable full-page screenshots')
            .option('--compiler-options <option=value[,...]>', 'specify test file compiler options')
            // NOTE: these options will be handled by chalk internally
            .option('--color', 'force colors in command line')
            .option('--no-color', 'disable colors in command line');
        // NOTE: temporary hide experimental options from --help command
        this.experimental
            .allowUnknownOption()
            .option('--disable-multiple-windows', 'disable multiple windows mode')
            .option('--experimental-compiler-service', 'run compiler in a separate process')
            .option('--cache', 'cache web assets between test runs');
    }
    _parseList(val) {
        return val.split(',');
    }
    _checkAndCountRemotes(browser) {
        const remoteMatch = browser.match(REMOTE_ALIAS_RE);
        if (remoteMatch) {
            this.remoteCount += parseInt(remoteMatch[1], 10) || 1;
            return false;
        }
        return true;
    }
    async _parseFilteringOptions() {
        if (this.opts.testGrep)
            this.opts.testGrep = get_options_1.getGrepOptions('--test-grep', this.opts.testGrep);
        if (this.opts.fixtureGrep)
            this.opts.fixtureGrep = get_options_1.getGrepOptions('--fixture-grep', this.opts.fixtureGrep);
        if (this.opts.testMeta)
            this.opts.testMeta = await get_options_1.getMetaOptions('--test-meta', this.opts.testMeta);
        if (this.opts.fixtureMeta)
            this.opts.fixtureMeta = await get_options_1.getMetaOptions('--fixture-meta', this.opts.fixtureMeta);
        this.opts.filter = get_filter_fn_1.default(this.opts);
    }
    _parseAppInitDelay() {
        if (this.opts.appInitDelay) {
            type_assertions_1.assertType(type_assertions_1.is.nonNegativeNumberString, null, 'Tested app initialization delay', this.opts.appInitDelay);
            this.opts.appInitDelay = parseInt(this.opts.appInitDelay, 10);
        }
    }
    _parseSelectorTimeout() {
        if (this.opts.selectorTimeout) {
            type_assertions_1.assertType(type_assertions_1.is.nonNegativeNumberString, null, 'Selector timeout', this.opts.selectorTimeout);
            this.opts.selectorTimeout = parseInt(this.opts.selectorTimeout, 10);
        }
    }
    _parseAssertionTimeout() {
        if (this.opts.assertionTimeout) {
            type_assertions_1.assertType(type_assertions_1.is.nonNegativeNumberString, null, 'Assertion timeout', this.opts.assertionTimeout);
            this.opts.assertionTimeout = parseInt(this.opts.assertionTimeout, 10);
        }
    }
    _parsePageLoadTimeout() {
        if (this.opts.pageLoadTimeout) {
            type_assertions_1.assertType(type_assertions_1.is.nonNegativeNumberString, null, 'Page load timeout', this.opts.pageLoadTimeout);
            this.opts.pageLoadTimeout = parseInt(this.opts.pageLoadTimeout, 10);
        }
    }
    _parsePageRequestTimeout() {
        if (!this.opts.pageRequestTimeout)
            return;
        type_assertions_1.assertType(type_assertions_1.is.nonNegativeNumberString, null, 'Page request timeout', this.opts.pageRequestTimeout);
        this.opts.pageRequestTimeout = parseInt(this.opts.pageRequestTimeout, 10);
    }
    _parseAjaxRequestTimeout() {
        if (!this.opts.ajaxRequestTimeout)
            return;
        type_assertions_1.assertType(type_assertions_1.is.nonNegativeNumberString, null, 'Ajax request timeout', this.opts.ajaxRequestTimeout);
        this.opts.ajaxRequestTimeout = parseInt(this.opts.ajaxRequestTimeout, 10);
    }
    _parseBrowserInitTimeout() {
        if (!this.opts.browserInitTimeout)
            return;
        type_assertions_1.assertType(type_assertions_1.is.nonNegativeNumberString, null, 'Browser initialization timeout', this.opts.browserInitTimeout);
        this.opts.browserInitTimeout = parseInt(this.opts.browserInitTimeout, 10);
    }
    _parseSpeed() {
        if (this.opts.speed)
            this.opts.speed = parseFloat(this.opts.speed);
    }
    _parseConcurrency() {
        if (this.opts.concurrency)
            this.opts.concurrency = parseInt(this.opts.concurrency, 10);
    }
    _parsePorts() {
        if (this.opts.ports) {
            const parsedPorts = this.opts.ports /* eslint-disable-line no-extra-parens */
                .split(',')
                .map(CLIArgumentParser._parsePortNumber);
            if (parsedPorts.length < 2)
                throw new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.portsOptionRequiresTwoNumbers);
            this.opts.ports = parsedPorts;
        }
    }
    _parseBrowsersFromArgs() {
        const browsersArg = this.program.args[0] || '';
        this.opts.browsers = string_1.splitQuotedText(browsersArg, ',')
            .filter(browser => browser && this._checkAndCountRemotes(browser));
    }
    async _parseSslOptions() {
        if (this.opts.ssl)
            this.opts.ssl = await get_options_1.getSSLOptions(this.opts.ssl);
    }
    async _parseReporters() {
        const reporters = this.opts.reporter ? this.opts.reporter.split(',') : []; /* eslint-disable-line no-extra-parens*/
        this.opts.reporter = reporters.map((reporter) => {
            const separatorIndex = reporter.indexOf(':');
            if (separatorIndex < 0)
                return { name: reporter };
            const name = reporter.substring(0, separatorIndex);
            const output = reporter.substring(separatorIndex + 1);
            return { name, output };
        });
    }
    _parseFileList() {
        this.opts.src = this.program.args.slice(1);
    }
    async _parseScreenshotOptions() {
        if (this.opts.screenshots)
            this.opts.screenshots = await get_options_1.getScreenshotOptions(this.opts.screenshots);
        else
            this.opts.screenshots = {};
        if (!lodash_1.has(this.opts.screenshots, screenshot_option_names_1.default.pathPattern) && this.opts.screenshotPathPattern)
            this.opts.screenshots[screenshot_option_names_1.default.pathPattern] = this.opts.screenshotPathPattern;
        if (!lodash_1.has(this.opts.screenshots, screenshot_option_names_1.default.takeOnFails) && this.opts.screenshotsOnFails)
            this.opts.screenshots[screenshot_option_names_1.default.takeOnFails] = this.opts.screenshotsOnFails;
    }
    async _parseVideoOptions() {
        if (this.opts.videoOptions)
            this.opts.videoOptions = await get_options_1.getVideoOptions(this.opts.videoOptions);
        if (this.opts.videoEncodingOptions)
            this.opts.videoEncodingOptions = await get_options_1.getVideoOptions(this.opts.videoEncodingOptions);
    }
    async _parseCompilerOptions() {
        if (!this.opts.compilerOptions)
            return;
        const parsedCompilerOptions = await get_options_1.getCompilerOptions(this.opts.compilerOptions);
        const resultCompilerOptions = Object.create(null);
        for (const [key, value] of Object.entries(parsedCompilerOptions))
            lodash_1.set(resultCompilerOptions, key, value);
        this.opts.compilerOptions = resultCompilerOptions;
    }
    _parseListBrowsers() {
        const listBrowserOption = this.opts.listBrowsers;
        this.opts.listBrowsers = !!this.opts.listBrowsers;
        if (!this.opts.listBrowsers)
            return;
        this.opts.providerName = typeof listBrowserOption === 'string' ? listBrowserOption : 'locally-installed';
    }
    async parse(argv) {
        this.program.parse(argv);
        this.experimental.parse(argv);
        this.args = this.program.args;
        this.opts = Object.assign(Object.assign({}, this.experimental.opts()), this.program.opts());
        this._parseListBrowsers();
        // NOTE: the '--list-browsers' option only lists browsers and immediately exits the app.
        // Therefore, we don't need to process other arguments.
        if (this.opts.listBrowsers)
            return;
        this._parseSelectorTimeout();
        this._parseAssertionTimeout();
        this._parsePageLoadTimeout();
        this._parsePageRequestTimeout();
        this._parseAjaxRequestTimeout();
        this._parseBrowserInitTimeout();
        this._parseAppInitDelay();
        this._parseSpeed();
        this._parsePorts();
        this._parseBrowsersFromArgs();
        this._parseConcurrency();
        this._parseFileList();
        await this._parseFilteringOptions();
        await this._parseScreenshotOptions();
        await this._parseVideoOptions();
        await this._parseCompilerOptions();
        await this._parseSslOptions();
        await this._parseReporters();
    }
    getRunOptions() {
        const result = Object.create(null);
        run_option_names_1.default.forEach(optionName => {
            if (optionName in this.opts)
                // @ts-ignore a hack to add an index signature to interface
                result[optionName] = this.opts[optionName];
        });
        return result;
    }
}
exports.default = CLIArgumentParser;
module.exports = exports.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJndW1lbnQtcGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NsaS9hcmd1bWVudC1wYXJzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxtQ0FBa0M7QUFDbEMseUNBQW9DO0FBQ3BDLG9EQUE0QjtBQUM1QiwyREFBc0Q7QUFDdEQsK0NBQWlEO0FBQ2pELDJDQUFpRDtBQUNqRCx1RUFBbUU7QUFDbkUscUZBQTJEO0FBQzNELDRDQUE0RDtBQUM1RCxzREFPOEI7QUFFOUIsMkVBQWlEO0FBQ2pELHVHQUErRTtBQUMvRSx5RkFBaUU7QUFRakUsTUFBTSxlQUFlLEdBQUcscUJBQXFCLENBQUM7QUFFOUMsTUFBTSxXQUFXLEdBQUcsZ0JBQU0sQ0FBQzs7Ozs7Ozs7Ozs7OztDQWExQixDQUFDLENBQUM7QUFnQ0gsTUFBcUIsaUJBQWlCO0lBUWxDLFlBQW9CLEdBQVc7UUFDM0IsSUFBSSxDQUFDLE9BQU8sR0FBUSxJQUFJLG1CQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDNUMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLG1CQUFPLENBQUMsdUJBQXVCLENBQUMsQ0FBQztRQUN6RCxJQUFJLENBQUMsR0FBRyxHQUFZLEdBQUcsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDekMsSUFBSSxDQUFDLFdBQVcsR0FBSSxDQUFDLENBQUM7UUFDdEIsSUFBSSxDQUFDLElBQUksR0FBVyxFQUFFLENBQUM7UUFDdkIsSUFBSSxDQUFDLElBQUksR0FBVyxFQUFFLENBQUM7UUFFdkIsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUVPLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBRSxLQUFhO1FBQzFDLDRCQUFVLENBQUMsb0JBQUUsQ0FBQyx1QkFBdUIsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRW5FLE9BQU8sUUFBUSxDQUFDLEtBQUssRUFBRSxFQUFF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QztRQUNuRCxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sTUFBMEIsQ0FBQztJQUN0QyxDQUFDO0NBQ0o7QUEvVUQsb0NBK1VDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaGFzLCBzZXQgfSBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHsgQ29tbWFuZCB9IGZyb20gJ2NvbW1hbmRlcic7XG5pbXBvcnQgZGVkZW50IGZyb20gJ2RlZGVudCc7XG5pbXBvcnQgeyByZWFkU3luYyBhcyByZWFkIH0gZnJvbSAncmVhZC1maWxlLXJlbGF0aXZlJztcbmltcG9ydCB7IEdlbmVyYWxFcnJvciB9IGZyb20gJy4uL2Vycm9ycy9ydW50aW1lJztcbmltcG9ydCB7IFJVTlRJTUVfRVJST1JTIH0gZnJvbSAnLi4vZXJyb3JzL3R5cGVzJztcbmltcG9ydCB7IGFzc2VydFR5cGUsIGlzIH0gZnJvbSAnLi4vZXJyb3JzL3J1bnRpbWUvdHlwZS1hc3NlcnRpb25zJztcbmltcG9ydCBnZXRWaWV3UG9ydFdpZHRoIGZyb20gJy4uL3V0aWxzL2dldC12aWV3cG9ydC13aWR0aCc7XG5pbXBvcnQgeyB3b3JkV3JhcCwgc3BsaXRRdW90ZWRUZXh0IH0gZnJvbSAnLi4vdXRpbHMvc3RyaW5nJztcbmltcG9ydCB7XG4gICAgZ2V0U1NMT3B0aW9ucyxcbiAgICBnZXRTY3JlZW5zaG90T3B0aW9ucyxcbiAgICBnZXRWaWRlb09wdGlvbnMsXG4gICAgZ2V0TWV0YU9wdGlvbnMsXG4gICAgZ2V0R3JlcE9wdGlvbnMsXG4gICAgZ2V0Q29tcGlsZXJPcHRpb25zXG59IGZyb20gJy4uL3V0aWxzL2dldC1vcHRpb25zJztcblxuaW1wb3J0IGdldEZpbHRlckZuIGZyb20gJy4uL3V0aWxzL2dldC1maWx0ZXItZm4nO1xuaW1wb3J0IFNDUkVFTlNIT1RfT1BUSU9OX05BTUVTIGZyb20gJy4uL2NvbmZpZ3VyYXRpb24vc2NyZWVuc2hvdC1vcHRpb24tbmFtZXMnO1xuaW1wb3J0IFJVTl9PUFRJT05fTkFNRVMgZnJvbSAnLi4vY29uZmlndXJhdGlvbi9ydW4tb3B0aW9uLW5hbWVzJztcbmltcG9ydCB7XG4gICAgRGljdGlvbmFyeSxcbiAgICBSZXBvcnRlck9wdGlvbixcbiAgICBSdW5uZXJSdW5PcHRpb25zXG59IGZyb20gJy4uL2NvbmZpZ3VyYXRpb24vaW50ZXJmYWNlcyc7XG5cblxuY29uc3QgUkVNT1RFX0FMSUFTX1JFID0gL15yZW1vdGUoPzo6KFxcZCopKT8kLztcblxuY29uc3QgREVTQ1JJUFRJT04gPSBkZWRlbnQoYFxuICAgIEluIHRoZSBicm93c2VyIGxpc3QsIHlvdSBjYW4gdXNlIGJyb3dzZXIgbmFtZXMgKGUuZy4gXCJpZVwiLCBcImNocm9tZVwiLCBldGMuKSBhcyB3ZWxsIGFzIHBhdGhzIHRvIGV4ZWN1dGFibGVzLlxuXG4gICAgVG8gcnVuIHRlc3RzIGFnYWluc3QgYWxsIGluc3RhbGxlZCBicm93c2VycywgdXNlIHRoZSBcImFsbFwiIGFsaWFzLlxuXG4gICAgVG8gdXNlIGEgcmVtb3RlIGJyb3dzZXIgY29ubmVjdGlvbiAoZS5nLiwgdG8gY29ubmVjdCBhIG1vYmlsZSBkZXZpY2UpLCBzcGVjaWZ5IFwicmVtb3RlXCIgYXMgdGhlIGJyb3dzZXIgYWxpYXMuXG4gICAgSWYgeW91IG5lZWQgdG8gY29ubmVjdCBtdWx0aXBsZSBkZXZpY2VzLCBhZGQgYSBjb2xvbiBhbmQgdGhlIG51bWJlciBvZiBicm93c2VycyB5b3Ugd2FudCB0byBjb25uZWN0IChlLmcuLCBcInJlbW90ZTozXCIpLlxuXG4gICAgVG8gcnVuIHRlc3RzIGluIGEgYnJvd3NlciBhY2Nlc3NlZCB0aHJvdWdoIGEgYnJvd3NlciBwcm92aWRlciBwbHVnaW4sIHNwZWNpZnkgYSBicm93c2VyIGFsaWFzIHRoYXQgY29uc2lzdHMgb2YgdHdvIHBhcnRzIC0gdGhlIGJyb3dzZXIgcHJvdmlkZXIgbmFtZSBwcmVmaXggYW5kIHRoZSBuYW1lIG9mIHRoZSBicm93c2VyIGl0c2VsZjsgZm9yIGV4YW1wbGUsIFwic2F1Y2VsYWJzOmNocm9tZUA1MVwiLlxuXG4gICAgWW91IGNhbiB1c2Ugb25lIG9yIG1vcmUgZmlsZSBwYXRocyBvciBnbG9iIHBhdHRlcm5zIHRvIHNwZWNpZnkgd2hpY2ggdGVzdHMgdG8gcnVuLlxuXG4gICAgTW9yZSBpbmZvOiBodHRwczovL2RldmV4cHJlc3MuZ2l0aHViLmlvL3Rlc3RjYWZlL2RvY3VtZW50YXRpb25cbmApO1xuXG5pbnRlcmZhY2UgQ29tbWFuZExpbmVPcHRpb25zIHtcbiAgICB0ZXN0R3JlcD86IHN0cmluZyB8IFJlZ0V4cDtcbiAgICBmaXh0dXJlR3JlcD86IHN0cmluZyB8IFJlZ0V4cDtcbiAgICBzcmM/OiBzdHJpbmdbXTtcbiAgICBicm93c2Vycz86IHN0cmluZ1tdO1xuICAgIGxpc3RCcm93c2Vycz86IGJvb2xlYW4gfCBzdHJpbmc7XG4gICAgdGVzdE1ldGE/OiBzdHJpbmcgfCBEaWN0aW9uYXJ5PHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4+O1xuICAgIGZpeHR1cmVNZXRhPzogc3RyaW5nIHwgRGljdGlvbmFyeTxzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuPjtcbiAgICBmaWx0ZXI/OiBGdW5jdGlvbjtcbiAgICBhcHBJbml0RGVsYXk/OiBzdHJpbmcgfCBudW1iZXI7XG4gICAgYXNzZXJ0aW9uVGltZW91dD86IHN0cmluZyB8IG51bWJlcjtcbiAgICBzZWxlY3RvclRpbWVvdXQ/OiBzdHJpbmcgfCBudW1iZXI7XG4gICAgc3BlZWQ/OiBzdHJpbmcgfCBudW1iZXI7XG4gICAgcGFnZUxvYWRUaW1lb3V0Pzogc3RyaW5nIHwgbnVtYmVyO1xuICAgIHBhZ2VSZXF1ZXN0VGltZW91dD86IHN0cmluZyB8IG51bWJlcjtcbiAgICBhamF4UmVxdWVzdFRpbWVvdXQ/OiBzdHJpbmcgfCBudW1iZXI7XG4gICAgYnJvd3NlckluaXRUaW1lb3V0Pzogc3RyaW5nIHwgbnVtYmVyO1xuICAgIGNvbmN1cnJlbmN5Pzogc3RyaW5nIHwgbnVtYmVyO1xuICAgIHBvcnRzPzogc3RyaW5nIHwgbnVtYmVyW107XG4gICAgcHJvdmlkZXJOYW1lPzogc3RyaW5nO1xuICAgIHNzbD86IHN0cmluZyB8IERpY3Rpb25hcnk8c3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbiA+O1xuICAgIHJlcG9ydGVyPzogc3RyaW5nIHwgUmVwb3J0ZXJPcHRpb25bXTtcbiAgICBzY3JlZW5zaG90cz86IERpY3Rpb25hcnk8c3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbj4gfCBzdHJpbmc7XG4gICAgc2NyZWVuc2hvdFBhdGhQYXR0ZXJuPzogc3RyaW5nO1xuICAgIHNjcmVlbnNob3RzT25GYWlscz86IGJvb2xlYW47XG4gICAgdmlkZW9PcHRpb25zPzogc3RyaW5nIHwgRGljdGlvbmFyeTxudW1iZXIgfCBzdHJpbmcgfCBib29sZWFuPjtcbiAgICB2aWRlb0VuY29kaW5nT3B0aW9ucz86IHN0cmluZyB8IERpY3Rpb25hcnk8bnVtYmVyIHwgc3RyaW5nIHwgYm9vbGVhbj47XG4gICAgY29tcGlsZXJPcHRpb25zPzogc3RyaW5nIHwgRGljdGlvbmFyeTxudW1iZXIgfCBzdHJpbmcgfCBib29sZWFuPjtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ0xJQXJndW1lbnRQYXJzZXIge1xuICAgIHByaXZhdGUgcmVhZG9ubHkgcHJvZ3JhbTogQ29tbWFuZDtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGV4cGVyaW1lbnRhbDogQ29tbWFuZDtcbiAgICBwcml2YXRlIGN3ZDogc3RyaW5nO1xuICAgIHByaXZhdGUgcmVtb3RlQ291bnQ6IG51bWJlcjtcbiAgICBwdWJsaWMgb3B0czogQ29tbWFuZExpbmVPcHRpb25zO1xuICAgIHB1YmxpYyBhcmdzOiBzdHJpbmdbXTtcblxuICAgIHB1YmxpYyBjb25zdHJ1Y3RvciAoY3dkOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5wcm9ncmFtICAgICAgPSBuZXcgQ29tbWFuZCgndGVzdGNhZmUnKTtcbiAgICAgICAgdGhpcy5leHBlcmltZW50YWwgPSBuZXcgQ29tbWFuZCgndGVzdGNhZmUtZXhwZXJpbWVudGFsJyk7XG4gICAgICAgIHRoaXMuY3dkICAgICAgICAgID0gY3dkIHx8IHByb2Nlc3MuY3dkKCk7XG4gICAgICAgIHRoaXMucmVtb3RlQ291bnQgID0gMDtcbiAgICAgICAgdGhpcy5vcHRzICAgICAgICAgPSB7fTtcbiAgICAgICAgdGhpcy5hcmdzICAgICAgICAgPSBbXTtcblxuICAgICAgICB0aGlzLl9kZXNjcmliZVByb2dyYW0oKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN0YXRpYyBfcGFyc2VQb3J0TnVtYmVyICh2YWx1ZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgICAgICAgYXNzZXJ0VHlwZShpcy5ub25OZWdhdGl2ZU51bWJlclN0cmluZywgbnVsbCwgJ1BvcnQgbnVtYmVyJywgdmFsdWUpO1xuXG4gICAgICAgIHJldHVybiBwYXJzZUludCh2YWx1ZSwgMTApO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RhdGljIF9nZXREZXNjcmlwdGlvbiAoKTogc3RyaW5nIHtcbiAgICAgICAgLy8gTk9URTogYWRkIGVtcHR5IGxpbmUgdG8gd29ya2Fyb3VuZCBjb21tYW5kZXItZm9yY2VkIGluZGVudGF0aW9uIG9uIHRoZSBmaXJzdCBsaW5lLlxuICAgICAgICByZXR1cm4gJ1xcbicgKyB3b3JkV3JhcChERVNDUklQVElPTiwgMiwgZ2V0Vmlld1BvcnRXaWR0aChwcm9jZXNzLnN0ZG91dCkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2Rlc2NyaWJlUHJvZ3JhbSAoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHZlcnNpb24gPSBKU09OLnBhcnNlKHJlYWQoJy4uLy4uL3BhY2thZ2UuanNvbicpIGFzIHN0cmluZykudmVyc2lvbjtcblxuICAgICAgICB0aGlzLnByb2dyYW1cbiAgICAgICAgICAgIC52ZXJzaW9uKHZlcnNpb24sICctdiwgLS12ZXJzaW9uJylcbiAgICAgICAgICAgIC51c2FnZSgnW29wdGlvbnNdIDxjb21tYS1zZXBhcmF0ZWQtYnJvd3Nlci1saXN0PiA8ZmlsZS1vci1nbG9iIC4uLj4nKVxuICAgICAgICAgICAgLmRlc2NyaXB0aW9uKENMSUFyZ3VtZW50UGFyc2VyLl9nZXREZXNjcmlwdGlvbigpKVxuXG4gICAgICAgICAgICAub3B0aW9uKCctYiwgLS1saXN0LWJyb3dzZXJzIFtwcm92aWRlcl0nLCAnb3V0cHV0IHRoZSBhbGlhc2VzIGZvciBsb2NhbCBicm93c2VycyBvciBicm93c2VycyBhdmFpbGFibGUgdGhyb3VnaCB0aGUgc3BlY2lmaWVkIGJyb3dzZXIgcHJvdmlkZXInKVxuICAgICAgICAgICAgLm9wdGlvbignLXIsIC0tcmVwb3J0ZXIgPG5hbWVbOm91dHB1dEZpbGVdWywuLi5dPicsICdzcGVjaWZ5IHRoZSByZXBvcnRlcnMgYW5kIG9wdGlvbmFsbHkgZmlsZXMgd2hlcmUgcmVwb3J0cyBhcmUgc2F2ZWQnKVxuICAgICAgICAgICAgLm9wdGlvbignLXMsIC0tc2NyZWVuc2hvdHMgPG9wdGlvbj12YWx1ZVssLi4uXT4nLCAnc3BlY2lmeSBzY3JlZW5zaG90IG9wdGlvbnMnKVxuICAgICAgICAgICAgLm9wdGlvbignLVMsIC0tc2NyZWVuc2hvdHMtb24tZmFpbHMnLCAndGFrZSBhIHNjcmVlbnNob3Qgd2hlbmV2ZXIgYSB0ZXN0IGZhaWxzJylcbiAgICAgICAgICAgIC5vcHRpb24oJy1wLCAtLXNjcmVlbnNob3QtcGF0aC1wYXR0ZXJuIDxwYXR0ZXJuPicsICd1c2UgcGF0dGVybnMgdG8gY29tcG9zZSBzY3JlZW5zaG90IGZpbGUgbmFtZXMgYW5kIHBhdGhzOiAke0JST1dTRVJ9LCAke0JST1dTRVJfVkVSU0lPTn0sICR7T1N9LCBldGMuJylcbiAgICAgICAgICAgIC5vcHRpb24oJy1xLCAtLXF1YXJhbnRpbmUtbW9kZScsICdlbmFibGUgdGhlIHF1YXJhbnRpbmUgbW9kZScpXG4gICAgICAgICAgICAub3B0aW9uKCctZCwgLS1kZWJ1Zy1tb2RlJywgJ2V4ZWN1dGUgdGVzdCBzdGVwcyBvbmUgYnkgb25lIHBhdXNpbmcgdGhlIHRlc3QgYWZ0ZXIgZWFjaCBzdGVwJylcbiAgICAgICAgICAgIC5vcHRpb24oJy1lLCAtLXNraXAtanMtZXJyb3JzJywgJ21ha2UgdGVzdHMgbm90IGZhaWwgd2hlbiBhIEpTIGVycm9yIGhhcHBlbnMgb24gYSBwYWdlJylcbiAgICAgICAgICAgIC5vcHRpb24oJy11LCAtLXNraXAtdW5jYXVnaHQtZXJyb3JzJywgJ2lnbm9yZSB1bmNhdWdodCBlcnJvcnMgYW5kIHVuaGFuZGxlZCBwcm9taXNlIHJlamVjdGlvbnMsIHdoaWNoIG9jY3VyIGR1cmluZyB0ZXN0IGV4ZWN1dGlvbicpXG4gICAgICAgICAgICAub3B0aW9uKCctdCwgLS10ZXN0IDxuYW1lPicsICdydW4gb25seSB0ZXN0cyB3aXRoIHRoZSBzcGVjaWZpZWQgbmFtZScpXG4gICAgICAgICAgICAub3B0aW9uKCctVCwgLS10ZXN0LWdyZXAgPHBhdHRlcm4+JywgJ3J1biBvbmx5IHRlc3RzIG1hdGNoaW5nIHRoZSBzcGVjaWZpZWQgcGF0dGVybicpXG4gICAgICAgICAgICAub3B0aW9uKCctZiwgLS1maXh0dXJlIDxuYW1lPicsICdydW4gb25seSBmaXh0dXJlcyB3aXRoIHRoZSBzcGVjaWZpZWQgbmFtZScpXG4gICAgICAgICAgICAub3B0aW9uKCctRiwgLS1maXh0dXJlLWdyZXAgPHBhdHRlcm4+JywgJ3J1biBvbmx5IGZpeHR1cmVzIG1hdGNoaW5nIHRoZSBzcGVjaWZpZWQgcGF0dGVybicpXG4gICAgICAgICAgICAub3B0aW9uKCctYSwgLS1hcHAgPGNvbW1hbmQ+JywgJ2xhdW5jaCB0aGUgdGVzdGVkIGFwcCB1c2luZyB0aGUgc3BlY2lmaWVkIGNvbW1hbmQgYmVmb3JlIHJ1bm5pbmcgdGVzdHMnKVxuICAgICAgICAgICAgLm9wdGlvbignLWMsIC0tY29uY3VycmVuY3kgPG51bWJlcj4nLCAncnVuIHRlc3RzIGNvbmN1cnJlbnRseScpXG4gICAgICAgICAgICAub3B0aW9uKCctTCwgLS1saXZlJywgJ2VuYWJsZSBsaXZlIG1vZGUuIEluIHRoaXMgbW9kZSwgVGVzdENhZmUgd2F0Y2hlcyBmb3IgY2hhbmdlcyB5b3UgbWFrZSBpbiB0aGUgdGVzdCBmaWxlcy4gVGhlc2UgY2hhbmdlcyBpbW1lZGlhdGVseSByZXN0YXJ0IHRoZSB0ZXN0cyBzbyB0aGF0IHlvdSBjYW4gc2VlIHRoZSBlZmZlY3QuJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tdGVzdC1tZXRhIDxrZXk9dmFsdWVbLGtleTI9dmFsdWUyLC4uLl0+JywgJ3J1biBvbmx5IHRlc3RzIHdpdGggbWF0Y2hpbmcgbWV0YWRhdGEnKVxuICAgICAgICAgICAgLm9wdGlvbignLS1maXh0dXJlLW1ldGEgPGtleT12YWx1ZVssa2V5Mj12YWx1ZTIsLi4uXT4nLCAncnVuIG9ubHkgZml4dHVyZXMgd2l0aCBtYXRjaGluZyBtZXRhZGF0YScpXG4gICAgICAgICAgICAub3B0aW9uKCctLWRlYnVnLW9uLWZhaWwnLCAncGF1c2UgdGhlIHRlc3QgaWYgaXQgZmFpbHMnKVxuICAgICAgICAgICAgLm9wdGlvbignLS1hcHAtaW5pdC1kZWxheSA8bXM+JywgJ3NwZWNpZnkgaG93IG11Y2ggdGltZSBpdCB0YWtlcyBmb3IgdGhlIHRlc3RlZCBhcHAgdG8gaW5pdGlhbGl6ZScpXG4gICAgICAgICAgICAub3B0aW9uKCctLXNlbGVjdG9yLXRpbWVvdXQgPG1zPicsICdzcGVjaWZ5IHRoZSB0aW1lIHdpdGhpbiB3aGljaCBzZWxlY3RvcnMgbWFrZSBhdHRlbXB0cyB0byBvYnRhaW4gYSBub2RlIHRvIGJlIHJldHVybmVkJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tYXNzZXJ0aW9uLXRpbWVvdXQgPG1zPicsICdzcGVjaWZ5IHRoZSB0aW1lIHdpdGhpbiB3aGljaCBhc3NlcnRpb24gc2hvdWxkIHBhc3MnKVxuICAgICAgICAgICAgLm9wdGlvbignLS1wYWdlLWxvYWQtdGltZW91dCA8bXM+JywgJ3NwZWNpZnkgdGhlIHRpbWUgd2l0aGluIHdoaWNoIFRlc3RDYWZlIHdhaXRzIGZvciB0aGUgYHdpbmRvdy5sb2FkYCBldmVudCB0byBmaXJlIG9uIHBhZ2UgbG9hZCBiZWZvcmUgcHJvY2VlZGluZyB0byB0aGUgbmV4dCB0ZXN0IGFjdGlvbicpXG4gICAgICAgICAgICAub3B0aW9uKCctLXBhZ2UtcmVxdWVzdC10aW1lb3V0IDxtcz4nLCBcInNwZWNpZmllcyB0aGUgdGltZW91dCBpbiBtaWxsaXNlY29uZHMgdG8gY29tcGxldGUgdGhlIHJlcXVlc3QgZm9yIHRoZSBwYWdlJ3MgSFRNTFwiKVxuICAgICAgICAgICAgLm9wdGlvbignLS1hamF4LXJlcXVlc3QtdGltZW91dCA8bXM+JywgJ3NwZWNpZmllcyB0aGUgdGltZW91dCBpbiBtaWxsaXNlY29uZHMgdG8gY29tcGxldGUgdGhlIEFKQVggcmVxdWVzdHMgKFhIUiBvciBmZXRjaCknKVxuICAgICAgICAgICAgLm9wdGlvbignLS1icm93c2VyLWluaXQtdGltZW91dCA8bXM+JywgJ3NwZWNpZnkgdGhlIHRpbWUgKGluIG1pbGxpc2Vjb25kcykgVGVzdENhZmUgd2FpdHMgZm9yIHRoZSBicm93c2VyIHRvIHN0YXJ0JylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tc3BlZWQgPGZhY3Rvcj4nLCAnc2V0IHRoZSBzcGVlZCBvZiB0ZXN0IGV4ZWN1dGlvbiAoMC4wMSAuLi4gMSknKVxuICAgICAgICAgICAgLm9wdGlvbignLS1wb3J0cyA8cG9ydDEscG9ydDI+JywgJ3NwZWNpZnkgY3VzdG9tIHBvcnQgbnVtYmVycycpXG4gICAgICAgICAgICAub3B0aW9uKCctLWhvc3RuYW1lIDxuYW1lPicsICdzcGVjaWZ5IHRoZSBob3N0bmFtZScpXG4gICAgICAgICAgICAub3B0aW9uKCctLXByb3h5IDxob3N0PicsICdzcGVjaWZ5IHRoZSBob3N0IG9mIHRoZSBwcm94eSBzZXJ2ZXInKVxuICAgICAgICAgICAgLm9wdGlvbignLS1wcm94eS1ieXBhc3MgPHJ1bGVzPicsICdzcGVjaWZ5IGEgY29tbWEtc2VwYXJhdGVkIGxpc3Qgb2YgcnVsZXMgdGhhdCBkZWZpbmUgVVJMcyBhY2Nlc3NlZCBieXBhc3NpbmcgdGhlIHByb3h5IHNlcnZlcicpXG4gICAgICAgICAgICAub3B0aW9uKCctLXNzbCA8b3B0aW9ucz4nLCAnc3BlY2lmeSBTU0wgb3B0aW9ucyB0byBydW4gVGVzdENhZmUgcHJveHkgc2VydmVyIG92ZXIgdGhlIEhUVFBTIHByb3RvY29sJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tdmlkZW8gPHBhdGg+JywgJ3JlY29yZCB2aWRlb3Mgb2YgdGVzdCBydW5zJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tdmlkZW8tb3B0aW9ucyA8b3B0aW9uPXZhbHVlWywuLi5dPicsICdzcGVjaWZ5IHZpZGVvIHJlY29yZGluZyBvcHRpb25zJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tdmlkZW8tZW5jb2Rpbmctb3B0aW9ucyA8b3B0aW9uPXZhbHVlWywuLi5dPicsICdzcGVjaWZ5IGVuY29kaW5nIG9wdGlvbnMnKVxuICAgICAgICAgICAgLm9wdGlvbignLS1kZXYnLCAnZW5hYmxlcyBtZWNoYW5pc21zIHRvIGxvZyBhbmQgZGlhZ25vc2UgZXJyb3JzJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tcXItY29kZScsICdvdXRwdXRzIFFSLWNvZGUgdGhhdCByZXBlYXRzIFVSTHMgdXNlZCB0byBjb25uZWN0IHRoZSByZW1vdGUgYnJvd3NlcnMnKVxuICAgICAgICAgICAgLm9wdGlvbignLS1zZiwgLS1zdG9wLW9uLWZpcnN0LWZhaWwnLCAnc3RvcCBhbiBlbnRpcmUgdGVzdCBydW4gaWYgYW55IHRlc3QgZmFpbHMnKVxuICAgICAgICAgICAgLm9wdGlvbignLS10cy1jb25maWctcGF0aCA8cGF0aD4nLCAndXNlIGEgY3VzdG9tIFR5cGVTY3JpcHQgY29uZmlndXJhdGlvbiBmaWxlIGFuZCBzcGVjaWZ5IGl0cyBsb2NhdGlvbicpXG4gICAgICAgICAgICAub3B0aW9uKCctLWNzLCAtLWNsaWVudC1zY3JpcHRzIDxwYXRocz4nLCAnaW5qZWN0IHNjcmlwdHMgaW50byB0ZXN0ZWQgcGFnZXMnLCB0aGlzLl9wYXJzZUxpc3QsIFtdKVxuICAgICAgICAgICAgLm9wdGlvbignLS1kaXNhYmxlLXBhZ2UtY2FjaGluZycsICdkaXNhYmxlIHBhZ2UgY2FjaGluZyBkdXJpbmcgdGVzdCBleGVjdXRpb24nKVxuICAgICAgICAgICAgLm9wdGlvbignLS1kaXNhYmxlLXBhZ2UtcmVsb2FkcycsICdkaXNhYmxlIHBhZ2UgcmVsb2FkcyBiZXR3ZWVuIHRlc3RzJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tcmV0cnktdGVzdC1wYWdlcycsICdyZXRyeSBuZXR3b3JrIHJlcXVlc3RzIHRvIHRlc3QgcGFnZXMgZHVyaW5nIHRlc3QgZXhlY3V0aW9uJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tZGlzYWJsZS1zY3JlZW5zaG90cycsICdkaXNhYmxlIHNjcmVlbnNob3RzJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tc2NyZWVuc2hvdHMtZnVsbC1wYWdlJywgJ2VuYWJsZSBmdWxsLXBhZ2Ugc2NyZWVuc2hvdHMnKVxuICAgICAgICAgICAgLm9wdGlvbignLS1jb21waWxlci1vcHRpb25zIDxvcHRpb249dmFsdWVbLC4uLl0+JywgJ3NwZWNpZnkgdGVzdCBmaWxlIGNvbXBpbGVyIG9wdGlvbnMnKVxuXG4gICAgICAgICAgICAvLyBOT1RFOiB0aGVzZSBvcHRpb25zIHdpbGwgYmUgaGFuZGxlZCBieSBjaGFsayBpbnRlcm5hbGx5XG4gICAgICAgICAgICAub3B0aW9uKCctLWNvbG9yJywgJ2ZvcmNlIGNvbG9ycyBpbiBjb21tYW5kIGxpbmUnKVxuICAgICAgICAgICAgLm9wdGlvbignLS1uby1jb2xvcicsICdkaXNhYmxlIGNvbG9ycyBpbiBjb21tYW5kIGxpbmUnKTtcblxuICAgICAgICAvLyBOT1RFOiB0ZW1wb3JhcnkgaGlkZSBleHBlcmltZW50YWwgb3B0aW9ucyBmcm9tIC0taGVscCBjb21tYW5kXG4gICAgICAgIHRoaXMuZXhwZXJpbWVudGFsXG4gICAgICAgICAgICAuYWxsb3dVbmtub3duT3B0aW9uKClcbiAgICAgICAgICAgIC5vcHRpb24oJy0tZGlzYWJsZS1tdWx0aXBsZS13aW5kb3dzJywgJ2Rpc2FibGUgbXVsdGlwbGUgd2luZG93cyBtb2RlJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tZXhwZXJpbWVudGFsLWNvbXBpbGVyLXNlcnZpY2UnLCAncnVuIGNvbXBpbGVyIGluIGEgc2VwYXJhdGUgcHJvY2VzcycpXG4gICAgICAgICAgICAub3B0aW9uKCctLWNhY2hlJywgJ2NhY2hlIHdlYiBhc3NldHMgYmV0d2VlbiB0ZXN0IHJ1bnMnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9wYXJzZUxpc3QgKHZhbDogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgICAgICByZXR1cm4gdmFsLnNwbGl0KCcsJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfY2hlY2tBbmRDb3VudFJlbW90ZXMgKGJyb3dzZXI6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCByZW1vdGVNYXRjaCA9IGJyb3dzZXIubWF0Y2goUkVNT1RFX0FMSUFTX1JFKTtcblxuICAgICAgICBpZiAocmVtb3RlTWF0Y2gpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3RlQ291bnQgKz0gcGFyc2VJbnQocmVtb3RlTWF0Y2hbMV0sIDEwKSB8fCAxO1xuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgX3BhcnNlRmlsdGVyaW5nT3B0aW9ucyAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0aGlzLm9wdHMudGVzdEdyZXApXG4gICAgICAgICAgICB0aGlzLm9wdHMudGVzdEdyZXAgPSBnZXRHcmVwT3B0aW9ucygnLS10ZXN0LWdyZXAnLCB0aGlzLm9wdHMudGVzdEdyZXAgYXMgc3RyaW5nKTtcblxuICAgICAgICBpZiAodGhpcy5vcHRzLmZpeHR1cmVHcmVwKVxuICAgICAgICAgICAgdGhpcy5vcHRzLmZpeHR1cmVHcmVwID0gZ2V0R3JlcE9wdGlvbnMoJy0tZml4dHVyZS1ncmVwJywgdGhpcy5vcHRzLmZpeHR1cmVHcmVwIGFzIHN0cmluZyk7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0cy50ZXN0TWV0YSlcbiAgICAgICAgICAgIHRoaXMub3B0cy50ZXN0TWV0YSA9IGF3YWl0IGdldE1ldGFPcHRpb25zKCctLXRlc3QtbWV0YScsIHRoaXMub3B0cy50ZXN0TWV0YSBhcyBzdHJpbmcpO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdHMuZml4dHVyZU1ldGEpXG4gICAgICAgICAgICB0aGlzLm9wdHMuZml4dHVyZU1ldGEgPSBhd2FpdCBnZXRNZXRhT3B0aW9ucygnLS1maXh0dXJlLW1ldGEnLCB0aGlzLm9wdHMuZml4dHVyZU1ldGEgYXMgc3RyaW5nKTtcblxuICAgICAgICB0aGlzLm9wdHMuZmlsdGVyID0gZ2V0RmlsdGVyRm4odGhpcy5vcHRzKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9wYXJzZUFwcEluaXREZWxheSAoKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLm9wdHMuYXBwSW5pdERlbGF5KSB7XG4gICAgICAgICAgICBhc3NlcnRUeXBlKGlzLm5vbk5lZ2F0aXZlTnVtYmVyU3RyaW5nLCBudWxsLCAnVGVzdGVkIGFwcCBpbml0aWFsaXphdGlvbiBkZWxheScsIHRoaXMub3B0cy5hcHBJbml0RGVsYXkpO1xuXG4gICAgICAgICAgICB0aGlzLm9wdHMuYXBwSW5pdERlbGF5ID0gcGFyc2VJbnQodGhpcy5vcHRzLmFwcEluaXREZWxheSBhcyBzdHJpbmcsIDEwKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX3BhcnNlU2VsZWN0b3JUaW1lb3V0ICgpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMub3B0cy5zZWxlY3RvclRpbWVvdXQpIHtcbiAgICAgICAgICAgIGFzc2VydFR5cGUoaXMubm9uTmVnYXRpdmVOdW1iZXJTdHJpbmcsIG51bGwsICdTZWxlY3RvciB0aW1lb3V0JywgdGhpcy5vcHRzLnNlbGVjdG9yVGltZW91dCk7XG5cbiAgICAgICAgICAgIHRoaXMub3B0cy5zZWxlY3RvclRpbWVvdXQgPSBwYXJzZUludCh0aGlzLm9wdHMuc2VsZWN0b3JUaW1lb3V0IGFzIHN0cmluZywgMTApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfcGFyc2VBc3NlcnRpb25UaW1lb3V0ICgpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMub3B0cy5hc3NlcnRpb25UaW1lb3V0KSB7XG4gICAgICAgICAgICBhc3NlcnRUeXBlKGlzLm5vbk5lZ2F0aXZlTnVtYmVyU3RyaW5nLCBudWxsLCAnQXNzZXJ0aW9uIHRpbWVvdXQnLCB0aGlzLm9wdHMuYXNzZXJ0aW9uVGltZW91dCk7XG5cbiAgICAgICAgICAgIHRoaXMub3B0cy5hc3NlcnRpb25UaW1lb3V0ID0gcGFyc2VJbnQodGhpcy5vcHRzLmFzc2VydGlvblRpbWVvdXQgYXMgc3RyaW5nLCAxMCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9wYXJzZVBhZ2VMb2FkVGltZW91dCAoKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLm9wdHMucGFnZUxvYWRUaW1lb3V0KSB7XG4gICAgICAgICAgICBhc3NlcnRUeXBlKGlzLm5vbk5lZ2F0aXZlTnVtYmVyU3RyaW5nLCBudWxsLCAnUGFnZSBsb2FkIHRpbWVvdXQnLCB0aGlzLm9wdHMucGFnZUxvYWRUaW1lb3V0KTtcblxuICAgICAgICAgICAgdGhpcy5vcHRzLnBhZ2VMb2FkVGltZW91dCA9IHBhcnNlSW50KHRoaXMub3B0cy5wYWdlTG9hZFRpbWVvdXQgYXMgc3RyaW5nLCAxMCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9wYXJzZVBhZ2VSZXF1ZXN0VGltZW91dCAoKTogdm9pZCB7XG4gICAgICAgIGlmICghdGhpcy5vcHRzLnBhZ2VSZXF1ZXN0VGltZW91dClcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBhc3NlcnRUeXBlKGlzLm5vbk5lZ2F0aXZlTnVtYmVyU3RyaW5nLCBudWxsLCAnUGFnZSByZXF1ZXN0IHRpbWVvdXQnLCB0aGlzLm9wdHMucGFnZVJlcXVlc3RUaW1lb3V0KTtcblxuICAgICAgICB0aGlzLm9wdHMucGFnZVJlcXVlc3RUaW1lb3V0ID0gcGFyc2VJbnQodGhpcy5vcHRzLnBhZ2VSZXF1ZXN0VGltZW91dCBhcyBzdHJpbmcsIDEwKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9wYXJzZUFqYXhSZXF1ZXN0VGltZW91dCAoKTogdm9pZCB7XG4gICAgICAgIGlmICghdGhpcy5vcHRzLmFqYXhSZXF1ZXN0VGltZW91dClcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBhc3NlcnRUeXBlKGlzLm5vbk5lZ2F0aXZlTnVtYmVyU3RyaW5nLCBudWxsLCAnQWpheCByZXF1ZXN0IHRpbWVvdXQnLCB0aGlzLm9wdHMuYWpheFJlcXVlc3RUaW1lb3V0KTtcblxuICAgICAgICB0aGlzLm9wdHMuYWpheFJlcXVlc3RUaW1lb3V0ID0gcGFyc2VJbnQodGhpcy5vcHRzLmFqYXhSZXF1ZXN0VGltZW91dCBhcyBzdHJpbmcsIDEwKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9wYXJzZUJyb3dzZXJJbml0VGltZW91dCAoKTogdm9pZCB7XG4gICAgICAgIGlmICghdGhpcy5vcHRzLmJyb3dzZXJJbml0VGltZW91dClcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBhc3NlcnRUeXBlKGlzLm5vbk5lZ2F0aXZlTnVtYmVyU3RyaW5nLCBudWxsLCAnQnJvd3NlciBpbml0aWFsaXphdGlvbiB0aW1lb3V0JywgdGhpcy5vcHRzLmJyb3dzZXJJbml0VGltZW91dCk7XG5cbiAgICAgICAgdGhpcy5vcHRzLmJyb3dzZXJJbml0VGltZW91dCA9IHBhcnNlSW50KHRoaXMub3B0cy5icm93c2VySW5pdFRpbWVvdXQgYXMgc3RyaW5nLCAxMCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfcGFyc2VTcGVlZCAoKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLm9wdHMuc3BlZWQpXG4gICAgICAgICAgICB0aGlzLm9wdHMuc3BlZWQgPSBwYXJzZUZsb2F0KHRoaXMub3B0cy5zcGVlZCBhcyBzdHJpbmcpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3BhcnNlQ29uY3VycmVuY3kgKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5vcHRzLmNvbmN1cnJlbmN5KVxuICAgICAgICAgICAgdGhpcy5vcHRzLmNvbmN1cnJlbmN5ID0gcGFyc2VJbnQodGhpcy5vcHRzLmNvbmN1cnJlbmN5IGFzIHN0cmluZywgMTApO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3BhcnNlUG9ydHMgKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5vcHRzLnBvcnRzKSB7XG4gICAgICAgICAgICBjb25zdCBwYXJzZWRQb3J0cyA9ICh0aGlzLm9wdHMucG9ydHMgYXMgc3RyaW5nKSAvKiBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWV4dHJhLXBhcmVucyAqL1xuICAgICAgICAgICAgICAgIC5zcGxpdCgnLCcpXG4gICAgICAgICAgICAgICAgLm1hcChDTElBcmd1bWVudFBhcnNlci5fcGFyc2VQb3J0TnVtYmVyKTtcblxuICAgICAgICAgICAgaWYgKHBhcnNlZFBvcnRzLmxlbmd0aCA8IDIpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEdlbmVyYWxFcnJvcihSVU5USU1FX0VSUk9SUy5wb3J0c09wdGlvblJlcXVpcmVzVHdvTnVtYmVycyk7XG5cbiAgICAgICAgICAgIHRoaXMub3B0cy5wb3J0cyA9IHBhcnNlZFBvcnRzIGFzIG51bWJlcltdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfcGFyc2VCcm93c2Vyc0Zyb21BcmdzICgpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgYnJvd3NlcnNBcmcgPSB0aGlzLnByb2dyYW0uYXJnc1swXSB8fCAnJztcblxuICAgICAgICB0aGlzLm9wdHMuYnJvd3NlcnMgPSBzcGxpdFF1b3RlZFRleHQoYnJvd3NlcnNBcmcsICcsJylcbiAgICAgICAgICAgIC5maWx0ZXIoYnJvd3NlciA9PiBicm93c2VyICYmIHRoaXMuX2NoZWNrQW5kQ291bnRSZW1vdGVzKGJyb3dzZXIpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgX3BhcnNlU3NsT3B0aW9ucyAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0aGlzLm9wdHMuc3NsKVxuICAgICAgICAgICAgdGhpcy5vcHRzLnNzbCA9IGF3YWl0IGdldFNTTE9wdGlvbnModGhpcy5vcHRzLnNzbCBhcyBzdHJpbmcpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX3BhcnNlUmVwb3J0ZXJzICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgcmVwb3J0ZXJzID0gdGhpcy5vcHRzLnJlcG9ydGVyID8gKHRoaXMub3B0cy5yZXBvcnRlciBhcyBzdHJpbmcpLnNwbGl0KCcsJykgOiBbXTsgLyogZXNsaW50LWRpc2FibGUtbGluZSBuby1leHRyYS1wYXJlbnMqL1xuXG4gICAgICAgIHRoaXMub3B0cy5yZXBvcnRlciA9IHJlcG9ydGVycy5tYXAoKHJlcG9ydGVyOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNlcGFyYXRvckluZGV4ID0gcmVwb3J0ZXIuaW5kZXhPZignOicpO1xuXG4gICAgICAgICAgICBpZiAoc2VwYXJhdG9ySW5kZXggPCAwKVxuICAgICAgICAgICAgICAgIHJldHVybiB7IG5hbWU6IHJlcG9ydGVyIH07XG5cbiAgICAgICAgICAgIGNvbnN0IG5hbWUgICA9IHJlcG9ydGVyLnN1YnN0cmluZygwLCBzZXBhcmF0b3JJbmRleCk7XG4gICAgICAgICAgICBjb25zdCBvdXRwdXQgPSByZXBvcnRlci5zdWJzdHJpbmcoc2VwYXJhdG9ySW5kZXggKyAxKTtcblxuICAgICAgICAgICAgcmV0dXJuIHsgbmFtZSwgb3V0cHV0IH07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3BhcnNlRmlsZUxpc3QgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLm9wdHMuc3JjID0gdGhpcy5wcm9ncmFtLmFyZ3Muc2xpY2UoMSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfcGFyc2VTY3JlZW5zaG90T3B0aW9ucyAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0aGlzLm9wdHMuc2NyZWVuc2hvdHMpXG4gICAgICAgICAgICB0aGlzLm9wdHMuc2NyZWVuc2hvdHMgPSBhd2FpdCBnZXRTY3JlZW5zaG90T3B0aW9ucyh0aGlzLm9wdHMuc2NyZWVuc2hvdHMpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLm9wdHMuc2NyZWVuc2hvdHMgPSB7fTtcblxuICAgICAgICBpZiAoIWhhcyh0aGlzLm9wdHMuc2NyZWVuc2hvdHMsIFNDUkVFTlNIT1RfT1BUSU9OX05BTUVTLnBhdGhQYXR0ZXJuKSAmJiB0aGlzLm9wdHMuc2NyZWVuc2hvdFBhdGhQYXR0ZXJuKVxuICAgICAgICAgICAgdGhpcy5vcHRzLnNjcmVlbnNob3RzW1NDUkVFTlNIT1RfT1BUSU9OX05BTUVTLnBhdGhQYXR0ZXJuXSA9IHRoaXMub3B0cy5zY3JlZW5zaG90UGF0aFBhdHRlcm47XG5cbiAgICAgICAgaWYgKCFoYXModGhpcy5vcHRzLnNjcmVlbnNob3RzLCBTQ1JFRU5TSE9UX09QVElPTl9OQU1FUy50YWtlT25GYWlscykgJiYgdGhpcy5vcHRzLnNjcmVlbnNob3RzT25GYWlscylcbiAgICAgICAgICAgIHRoaXMub3B0cy5zY3JlZW5zaG90c1tTQ1JFRU5TSE9UX09QVElPTl9OQU1FUy50YWtlT25GYWlsc10gPSB0aGlzLm9wdHMuc2NyZWVuc2hvdHNPbkZhaWxzO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX3BhcnNlVmlkZW9PcHRpb25zICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKHRoaXMub3B0cy52aWRlb09wdGlvbnMpXG4gICAgICAgICAgICB0aGlzLm9wdHMudmlkZW9PcHRpb25zID0gYXdhaXQgZ2V0VmlkZW9PcHRpb25zKHRoaXMub3B0cy52aWRlb09wdGlvbnMgYXMgc3RyaW5nKTtcblxuICAgICAgICBpZiAodGhpcy5vcHRzLnZpZGVvRW5jb2RpbmdPcHRpb25zKVxuICAgICAgICAgICAgdGhpcy5vcHRzLnZpZGVvRW5jb2RpbmdPcHRpb25zID0gYXdhaXQgZ2V0VmlkZW9PcHRpb25zKHRoaXMub3B0cy52aWRlb0VuY29kaW5nT3B0aW9ucyBhcyBzdHJpbmcpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX3BhcnNlQ29tcGlsZXJPcHRpb25zICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKCF0aGlzLm9wdHMuY29tcGlsZXJPcHRpb25zKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHBhcnNlZENvbXBpbGVyT3B0aW9ucyA9IGF3YWl0IGdldENvbXBpbGVyT3B0aW9ucyh0aGlzLm9wdHMuY29tcGlsZXJPcHRpb25zIGFzIHN0cmluZyk7XG4gICAgICAgIGNvbnN0IHJlc3VsdENvbXBpbGVyT3B0aW9ucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMocGFyc2VkQ29tcGlsZXJPcHRpb25zKSlcbiAgICAgICAgICAgIHNldChyZXN1bHRDb21waWxlck9wdGlvbnMsIGtleSwgdmFsdWUpO1xuXG4gICAgICAgIHRoaXMub3B0cy5jb21waWxlck9wdGlvbnMgPSByZXN1bHRDb21waWxlck9wdGlvbnM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfcGFyc2VMaXN0QnJvd3NlcnMgKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBsaXN0QnJvd3Nlck9wdGlvbiA9IHRoaXMub3B0cy5saXN0QnJvd3NlcnM7XG5cbiAgICAgICAgdGhpcy5vcHRzLmxpc3RCcm93c2VycyA9ICEhdGhpcy5vcHRzLmxpc3RCcm93c2VycztcblxuICAgICAgICBpZiAoIXRoaXMub3B0cy5saXN0QnJvd3NlcnMpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgdGhpcy5vcHRzLnByb3ZpZGVyTmFtZSA9IHR5cGVvZiBsaXN0QnJvd3Nlck9wdGlvbiA9PT0gJ3N0cmluZycgPyBsaXN0QnJvd3Nlck9wdGlvbiA6ICdsb2NhbGx5LWluc3RhbGxlZCc7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIHBhcnNlIChhcmd2OiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0aGlzLnByb2dyYW0ucGFyc2UoYXJndik7XG4gICAgICAgIHRoaXMuZXhwZXJpbWVudGFsLnBhcnNlKGFyZ3YpO1xuXG4gICAgICAgIHRoaXMuYXJncyA9IHRoaXMucHJvZ3JhbS5hcmdzO1xuXG4gICAgICAgIHRoaXMub3B0cyA9IHsgLi4udGhpcy5leHBlcmltZW50YWwub3B0cygpLCAuLi50aGlzLnByb2dyYW0ub3B0cygpIH07XG5cbiAgICAgICAgdGhpcy5fcGFyc2VMaXN0QnJvd3NlcnMoKTtcblxuICAgICAgICAvLyBOT1RFOiB0aGUgJy0tbGlzdC1icm93c2Vycycgb3B0aW9uIG9ubHkgbGlzdHMgYnJvd3NlcnMgYW5kIGltbWVkaWF0ZWx5IGV4aXRzIHRoZSBhcHAuXG4gICAgICAgIC8vIFRoZXJlZm9yZSwgd2UgZG9uJ3QgbmVlZCB0byBwcm9jZXNzIG90aGVyIGFyZ3VtZW50cy5cbiAgICAgICAgaWYgKHRoaXMub3B0cy5saXN0QnJvd3NlcnMpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgdGhpcy5fcGFyc2VTZWxlY3RvclRpbWVvdXQoKTtcbiAgICAgICAgdGhpcy5fcGFyc2VBc3NlcnRpb25UaW1lb3V0KCk7XG4gICAgICAgIHRoaXMuX3BhcnNlUGFnZUxvYWRUaW1lb3V0KCk7XG4gICAgICAgIHRoaXMuX3BhcnNlUGFnZVJlcXVlc3RUaW1lb3V0KCk7XG4gICAgICAgIHRoaXMuX3BhcnNlQWpheFJlcXVlc3RUaW1lb3V0KCk7XG4gICAgICAgIHRoaXMuX3BhcnNlQnJvd3NlckluaXRUaW1lb3V0KCk7XG4gICAgICAgIHRoaXMuX3BhcnNlQXBwSW5pdERlbGF5KCk7XG4gICAgICAgIHRoaXMuX3BhcnNlU3BlZWQoKTtcbiAgICAgICAgdGhpcy5fcGFyc2VQb3J0cygpO1xuICAgICAgICB0aGlzLl9wYXJzZUJyb3dzZXJzRnJvbUFyZ3MoKTtcbiAgICAgICAgdGhpcy5fcGFyc2VDb25jdXJyZW5jeSgpO1xuICAgICAgICB0aGlzLl9wYXJzZUZpbGVMaXN0KCk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5fcGFyc2VGaWx0ZXJpbmdPcHRpb25zKCk7XG4gICAgICAgIGF3YWl0IHRoaXMuX3BhcnNlU2NyZWVuc2hvdE9wdGlvbnMoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5fcGFyc2VWaWRlb09wdGlvbnMoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5fcGFyc2VDb21waWxlck9wdGlvbnMoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5fcGFyc2VTc2xPcHRpb25zKCk7XG4gICAgICAgIGF3YWl0IHRoaXMuX3BhcnNlUmVwb3J0ZXJzKCk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFJ1bk9wdGlvbnMgKCk6IFJ1bm5lclJ1bk9wdGlvbnMge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gICAgICAgIFJVTl9PUFRJT05fTkFNRVMuZm9yRWFjaChvcHRpb25OYW1lID0+IHtcbiAgICAgICAgICAgIGlmIChvcHRpb25OYW1lIGluIHRoaXMub3B0cylcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIGEgaGFjayB0byBhZGQgYW4gaW5kZXggc2lnbmF0dXJlIHRvIGludGVyZmFjZVxuICAgICAgICAgICAgICAgIHJlc3VsdFtvcHRpb25OYW1lXSA9IHRoaXMub3B0c1tvcHRpb25OYW1lXTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdCBhcyBSdW5uZXJSdW5PcHRpb25zO1xuICAgIH1cbn1cbiJdfQ==