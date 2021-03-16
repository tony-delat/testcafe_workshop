"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const types_1 = require("../types");
const utils_1 = require("./utils");
const EXTERNAL_LINKS = {
    createNewIssue: 'https://github.com/DevExpress/testcafe/issues/new?template=bug-report.md',
    troubleshootNetwork: 'https://go.devexpress.com/TestCafe_FAQ_ARequestHasFailed.aspx',
    viewportSizes: 'https://github.com/DevExpress/device-specs/blob/master/viewport-sizes.json'
};
exports.default = {
    [types_1.TEST_RUN_ERRORS.actionIntegerOptionError]: err => `
        The "${err.optionName}" option is expected to be an integer, but it was ${err.actualValue}.
    `,
    [types_1.TEST_RUN_ERRORS.actionPositiveIntegerOptionError]: err => `
        The "${err.optionName}" option is expected to be a positive integer, but it was ${err.actualValue}.
    `,
    [types_1.TEST_RUN_ERRORS.actionBooleanOptionError]: err => `
        The "${err.optionName}" option is expected to be a boolean value, but it was ${err.actualValue}.
    `,
    [types_1.TEST_RUN_ERRORS.actionSpeedOptionError]: err => `
        The "${err.optionName}" option is expected to be a number between 0.01 and 1, but it was ${err.actualValue}.
    `,
    [types_1.TEST_RUN_ERRORS.pageLoadError]: err => `
        A request to ${utils_1.formatUrl(err.url)} has failed.
        Use quarantine mode to perform additional attempts to execute this test.
        You can find troubleshooting information for this issue at ${utils_1.formatUrl(EXTERNAL_LINKS.troubleshootNetwork)}.

        Error details:
        ${err.errMsg}
    `,
    [types_1.TEST_RUN_ERRORS.uncaughtErrorOnPage]: err => `
        A JavaScript error occurred on ${utils_1.formatUrl(err.pageDestUrl)}.
        Repeat test actions in the browser and check the console for errors.
        If you see this error, it means that the tested website caused it. You can fix it or disable tracking JavaScript errors in TestCafe. To do the latter, enable the "--skip-js-errors" option.
        If this error does not occur, please write a new issue at:
        ${utils_1.formatUrl(EXTERNAL_LINKS.createNewIssue)}.

        JavaScript error details:
        ${utils_1.replaceLeadingSpacesWithNbsp(lodash_1.escape(err.errStack))}
    `,
    [types_1.TEST_RUN_ERRORS.uncaughtErrorInTestCode]: err => `
        ${lodash_1.escape(err.errMsg)}
    `,
    [types_1.TEST_RUN_ERRORS.nativeDialogNotHandledError]: err => `
        A native ${err.dialogType} dialog was invoked on page ${utils_1.formatUrl(err.pageUrl)}, but no handler was set for it. Use the "setNativeDialogHandler" function to introduce a handler function for native dialogs.
    `,
    [types_1.TEST_RUN_ERRORS.uncaughtErrorInNativeDialogHandler]: err => `
        An error occurred in the native dialog handler called for a native ${err.dialogType} dialog on page ${utils_1.formatUrl(err.pageUrl)}:

        ${lodash_1.escape(err.errMsg)}
    `,
    [types_1.TEST_RUN_ERRORS.setTestSpeedArgumentError]: err => `
        Speed is expected to be a number between 0.01 and 1, but ${err.actualValue} was passed.
    `,
    [types_1.TEST_RUN_ERRORS.setNativeDialogHandlerCodeWrongTypeError]: err => `
        The native dialog handler is expected to be a function, ClientFunction or null, but it was ${err.actualType}.
    `,
    [types_1.TEST_RUN_ERRORS.uncaughtErrorInClientFunctionCode]: err => `
        An error occurred in ${err.instantiationCallsiteName} code:

        ${lodash_1.escape(err.errMsg)}
    `,
    [types_1.TEST_RUN_ERRORS.uncaughtErrorInCustomDOMPropertyCode]: err => `
        An error occurred when trying to calculate a custom Selector property "${err.property}":

        ${lodash_1.escape(err.errMsg)}
    `,
    [types_1.TEST_RUN_ERRORS.clientFunctionExecutionInterruptionError]: err => `
        ${err.instantiationCallsiteName} execution was interrupted by page unload. This problem may appear if you trigger page navigation from ${err.instantiationCallsiteName} code.
    `,
    [types_1.TEST_RUN_ERRORS.uncaughtNonErrorObjectInTestCode]: err => `
        Uncaught ${err.objType} "${lodash_1.escape(err.objStr)}" was thrown. Throw Error instead.
    `,
    [types_1.TEST_RUN_ERRORS.unhandledPromiseRejection]: err => `
        Unhandled promise rejection:

        ${lodash_1.escape(err.errMsg)}
    `,
    [types_1.TEST_RUN_ERRORS.uncaughtException]: err => `
        Uncaught exception:

        ${lodash_1.escape(err.errMsg)}
    `,
    [types_1.TEST_RUN_ERRORS.actionOptionsTypeError]: err => `
        Action options is expected to be an object, null or undefined but it was ${err.actualType}.
    `,
    [types_1.TEST_RUN_ERRORS.actionStringArgumentError]: err => `
        The "${err.argumentName}" argument is expected to be a non-empty string, but it was ${err.actualValue}.
    `,
    [types_1.TEST_RUN_ERRORS.actionBooleanArgumentError]: err => `
        The "${err.argumentName}" argument is expected to be a boolean value, but it was ${err.actualValue}.
    `,
    [types_1.TEST_RUN_ERRORS.actionNullableStringArgumentError]: err => `
        The "${err.argumentName}" argument is expected to be a null or a string, but it was ${err.actualValue}.
    `,
    [types_1.TEST_RUN_ERRORS.actionStringOrStringArrayArgumentError]: err => `
        The "${err.argumentName}" argument is expected to be a non-empty string or a string array, but it was ${err.actualValue}.
    `,
    [types_1.TEST_RUN_ERRORS.actionStringArrayElementError]: err => `
        Elements of the "${err.argumentName}" argument are expected to be non-empty strings, but the element at index ${err.elementIndex} was ${err.actualValue}.
    `,
    [types_1.TEST_RUN_ERRORS.actionIntegerArgumentError]: err => `
        The "${err.argumentName}" argument is expected to be an integer, but it was ${err.actualValue}.
    `,
    [types_1.TEST_RUN_ERRORS.actionRoleArgumentError]: err => `
        The "${err.argumentName}" argument is expected to be a Role instance, but it was ${err.actualValue}.
    `,
    [types_1.TEST_RUN_ERRORS.actionFunctionArgumentError]: err => `
        The "${err.argumentName}" argument is expected to be a function, but it was ${err.actualValue}.
    `,
    [types_1.TEST_RUN_ERRORS.actionPositiveIntegerArgumentError]: err => `
        The "${err.argumentName}" argument is expected to be a positive integer, but it was ${err.actualValue}.
    `,
    [types_1.TEST_RUN_ERRORS.actionElementNotFoundError]: (err, viewportWidth) => `
        The specified selector does not match any element in the DOM tree.

        ${utils_1.formatSelectorCallstack(err.apiFnChain, err.apiFnIndex, viewportWidth)}
    `,
    [types_1.TEST_RUN_ERRORS.actionElementIsInvisibleError]: () => `
        The element that matches the specified selector is not visible.
    `,
    [types_1.TEST_RUN_ERRORS.actionSelectorMatchesWrongNodeTypeError]: err => `
        The specified selector is expected to match a DOM element, but it matches a ${err.nodeDescription} node.
    `,
    [types_1.TEST_RUN_ERRORS.actionAdditionalElementNotFoundError]: (err, viewportWidth) => `
        The specified "${err.argumentName}" does not match any element in the DOM tree.

        ${utils_1.formatSelectorCallstack(err.apiFnChain, err.apiFnIndex, viewportWidth)}
    `,
    [types_1.TEST_RUN_ERRORS.actionAdditionalElementIsInvisibleError]: err => `
        The element that matches the specified "${err.argumentName}" is not visible.
    `,
    [types_1.TEST_RUN_ERRORS.actionAdditionalSelectorMatchesWrongNodeTypeError]: err => `
        The specified "${err.argumentName}" is expected to match a DOM element, but it matches a ${err.nodeDescription} node.
    `,
    [types_1.TEST_RUN_ERRORS.actionElementNonEditableError]: () => `
        The action element is expected to be editable (an input, textarea or element with the contentEditable attribute).
    `,
    [types_1.TEST_RUN_ERRORS.actionElementNonContentEditableError]: err => `
        The element that matches the specified "${err.argumentName}" is expected to have the contentEditable attribute enabled or the entire document should be in design mode.
    `,
    [types_1.TEST_RUN_ERRORS.actionRootContainerNotFoundError]: () => `
        Content between the action elements cannot be selected because the root container for the selection range cannot be found, i.e. these elements do not have a common ancestor with the contentEditable attribute.
    `,
    [types_1.TEST_RUN_ERRORS.actionElementIsNotFileInputError]: () => `
        The specified selector does not match a file input element.
    `,
    [types_1.TEST_RUN_ERRORS.actionCannotFindFileToUploadError]: err => `
        Cannot find the following file(s) to upload:
        ${err.filePaths.map(path => lodash_1.escape(path)).join('\n')}

        The following locations were scanned for the missing upload files:
        ${err.scannedFilePaths.map(path => lodash_1.escape(path)).join('\n')}

        Ensure these files exist or change the working directory.
    `,
    [types_1.TEST_RUN_ERRORS.actionElementNotTextAreaError]: () => `
        The action element is expected to be a &lt;textarea&gt;.
    `,
    [types_1.TEST_RUN_ERRORS.actionElementNotIframeError]: () => `
        The action element is expected to be an &lt;iframe&gt.
    `,
    [types_1.TEST_RUN_ERRORS.actionIncorrectKeysError]: err => `
        The "${err.argumentName}" argument contains an incorrect key or key combination.
    `,
    [types_1.TEST_RUN_ERRORS.actionUnsupportedDeviceTypeError]: err => `
        The "${err.argumentName}" argument specifies an unsupported "${err.actualValue}" device. For a list of supported devices, refer to ${utils_1.formatUrl(EXTERNAL_LINKS.viewportSizes)}.
    `,
    [types_1.TEST_RUN_ERRORS.actionInvalidScrollTargetError]: err => `
        Unable to scroll to the specified point because a point with the specified ${err.properties} is not located inside the element's cropping region.
    `,
    [types_1.TEST_RUN_ERRORS.actionIframeIsNotLoadedError]: () => `
        Content of the iframe to which you are switching did not load.
    `,
    [types_1.TEST_RUN_ERRORS.currentIframeIsNotLoadedError]: () => `
        Content of the iframe in which the test is currently operating did not load.
    `,
    [types_1.TEST_RUN_ERRORS.currentIframeNotFoundError]: () => `
        The iframe in which the test is currently operating does not exist anymore.
    `,
    [types_1.TEST_RUN_ERRORS.currentIframeIsInvisibleError]: () => `
        The iframe in which the test is currently operating is not visible anymore.
    `,
    [types_1.TEST_RUN_ERRORS.missingAwaitError]: () => `
        A call to an async function is not awaited. Use the "await" keyword before actions, assertions or chains of them to ensure that they run in the right sequence.
    `,
    [types_1.TEST_RUN_ERRORS.externalAssertionLibraryError]: err => `
        ${lodash_1.escape(err.errMsg)}

        <span class="diff-added">+ expected</span> <span class="diff-removed">- actual</span>

        ${err.diff}
    `,
    [types_1.TEST_RUN_ERRORS.domNodeClientFunctionResultError]: err => `
       ${err.instantiationCallsiteName} cannot return DOM elements. Use Selector functions for this purpose.
    `,
    [types_1.TEST_RUN_ERRORS.invalidSelectorResultError]: () => `
        Function that specifies a selector can only return a DOM node, an array of nodes, NodeList, HTMLCollection, null or undefined. Use ClientFunction to return other values.
    `,
    [types_1.TEST_RUN_ERRORS.actionSelectorError]: err => `
        Action "${err.selectorName}" argument error:

        ${lodash_1.escape(err.errMsg)}
    `,
    [types_1.TEST_RUN_ERRORS.cannotObtainInfoForElementSpecifiedBySelectorError]: (err, viewportWidth) => `
        Cannot obtain information about the node because the specified selector does not match any node in the DOM tree.

        ${utils_1.formatSelectorCallstack(err.apiFnChain, err.apiFnIndex, viewportWidth)}
    `,
    [types_1.TEST_RUN_ERRORS.windowDimensionsOverflowError]: () => `
        Unable to resize the window because the specified size exceeds the screen size. On macOS, a window cannot be larger than the screen.
    `,
    [types_1.TEST_RUN_ERRORS.forbiddenCharactersInScreenshotPathError]: err => `
        There are forbidden characters in the "${err.screenshotPath}" screenshot path:
        ${utils_1.renderForbiddenCharsList(err.forbiddenCharsList)}
    `,
    [types_1.TEST_RUN_ERRORS.invalidElementScreenshotDimensionsError]: err => `
         Unable to capture an element image because the resulting image ${err.dimensions} ${err.verb} zero or negative.
    `,
    [types_1.TEST_RUN_ERRORS.roleSwitchInRoleInitializerError]: () => `
        Role cannot be switched while another role is being initialized.
    `,
    [types_1.TEST_RUN_ERRORS.assertionExecutableArgumentError]: err => `
        Cannot evaluate the "${err.actualValue}" expression in the "${err.argumentName}" parameter because of the following error:

        ${err.errMsg}
    `,
    [types_1.TEST_RUN_ERRORS.assertionWithoutMethodCallError]: () => `
        An assertion method is not specified.
    `,
    [types_1.TEST_RUN_ERRORS.assertionUnawaitedPromiseError]: () => `
        Attempted to run assertions on a Promise object. Did you forget to await it? If not, pass "{ allowUnawaitedPromise: true }" to the assertion options.
    `,
    [types_1.TEST_RUN_ERRORS.requestHookNotImplementedError]: err => `
        You should implement the "${err.methodName}" method in the "${err.hookClassName}" class.
    `,
    [types_1.TEST_RUN_ERRORS.requestHookUnhandledError]: err => `
        An unhandled error occurred in the "${err.methodName}" method of the "${err.hookClassName}" class:

        ${lodash_1.escape(err.errMsg)}
    `,
    [types_1.TEST_RUN_ERRORS.uncaughtErrorInCustomClientScriptCode]: err => `
        An error occurred in a script injected into the tested page:

        ${lodash_1.escape(err.errMsg)}
    `,
    [types_1.TEST_RUN_ERRORS.uncaughtErrorInCustomClientScriptCodeLoadedFromModule]: err => `
        An error occurred in the '${err.moduleName}' module injected into the tested page. Make sure that this module can be executed in the browser environment.

        Error details:
        ${lodash_1.escape(err.errMsg)}
    `,
    [types_1.TEST_RUN_ERRORS.uncaughtErrorInCustomScript]: err => `
        An unhandled error occurred in the custom script:

        Error details: ${lodash_1.escape(err.errMsg)}

        ${utils_1.formatExpressionMessage(err.expression, err.line, err.column)}
    `,
    [types_1.TEST_RUN_ERRORS.childWindowIsNotLoadedError]: () => `
        The page in the child window is not loaded.
    `,
    [types_1.TEST_RUN_ERRORS.childWindowNotFoundError]: () => `
        The child window is not found.
    `,
    [types_1.TEST_RUN_ERRORS.cannotSwitchToWindowError]: () => `
        Cannot switch to the window.
    `,
    [types_1.TEST_RUN_ERRORS.closeChildWindowError]: () => `
        An error occurred while closing child windows.
    `,
    [types_1.TEST_RUN_ERRORS.childWindowClosedBeforeSwitchingError]: () => `
        The child window was closed before TestCafe could switch to it.
    `,
    [types_1.TEST_RUN_ERRORS.cannotCloseWindowWithChildrenError]: () => `
        Cannot close a window that has an open child window.
    `,
    [types_1.TEST_RUN_ERRORS.targetWindowNotFoundError]: () => `
        Cannot find the window specified in the action parameters.
    `,
    [types_1.TEST_RUN_ERRORS.parentWindowNotFoundError]: () => `
        Cannot find the parent window. Make sure that the tested window was opened from another window.
    `,
    [types_1.TEST_RUN_ERRORS.previousWindowNotFoundError]: () => `
        Cannot find the previous window. Make sure that the previous window is opened.
    `,
    [types_1.TEST_RUN_ERRORS.switchToWindowPredicateError]: err => `
        An error occurred inside the "switchToWindow" argument function.

        Error details:
        ${lodash_1.escape(err.errMsg)}
    `,
    [types_1.TEST_RUN_ERRORS.multipleWindowsModeIsDisabledError]: err => `
        Multi window mode is disabled. Remove the "--disable-multiple-windows" CLI flag or set the "disableMultipleWindows" option to "false" in the API to use the "${err.methodName}" method.
    `,
    [types_1.TEST_RUN_ERRORS.multipleWindowsModeIsNotSupportedInRemoteBrowserError]: err => `
        Multi window mode is supported in Chrome, Chromium, Edge 84+ and Firefox only. Run tests in these browsers to use the "${err.methodName}" method.
    `,
    [types_1.TEST_RUN_ERRORS.cannotCloseWindowWithoutParent]: () => `
        Cannot close the window because it does not have a parent. The parent window was closed or you are attempting to close the root browser window where tests were launched.
    `,
    [types_1.TEST_RUN_ERRORS.cannotRestoreChildWindowError]: () => `
        Failed to restore connection to window within the allocated timeout.
    `,
};
module.exports = exports.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2Vycm9ycy90ZXN0LXJ1bi90ZW1wbGF0ZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBOEM7QUFDOUMsb0NBQTJDO0FBQzNDLG1DQU1pQjtBQUVqQixNQUFNLGNBQWMsR0FBRztJQUNuQixjQUFjLEVBQU8sMEVBQTBFO0lBQy9GLG1CQUFtQixFQUFFLCtEQUErRDtJQUNwRixhQUFhLEVBQVEsNEVBQTRFO0NBQ3BHLENBQUM7QUFFRixrQkFBZTtJQUNYLENBQUMsdUJBQWUsQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7ZUFDeEMsR0FBRyxDQUFDLFVBQVUscURBQXFELEdBQUcsQ0FBQyxXQUFXO0tBQzVGO0lBRUQsQ0FBQyx1QkFBZSxDQUFDLGdDQUFnQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQztlQUNoRCxHQUFHLENBQUMsVUFBVSw2REFBNkQsR0FBRyxDQUFDLFdBQVc7S0FDcEc7SUFFRCxDQUFDLHVCQUFlLENBQUMsd0JBQXdCLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO2VBQ3hDLEdBQUcsQ0FBQyxVQUFVLDBEQUEwRCxHQUFHLENBQUMsV0FBVztLQUNqRztJQUVELENBQUMsdUJBQWUsQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7ZUFDdEMsR0FBRyxDQUFDLFVBQVUsc0VBQXNFLEdBQUcsQ0FBQyxXQUFXO0tBQzdHO0lBRUQsQ0FBQyx1QkFBZSxDQUFDLGFBQWEsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7dUJBQ3JCLGlCQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQzs7cUVBRTRCLGlCQUFTLENBQUMsY0FBYyxDQUFDLG1CQUFtQixDQUFDOzs7VUFHeEcsR0FBRyxDQUFDLE1BQU07S0FDZjtJQUVELENBQUMsdUJBQWUsQ0FBQyxtQkFB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c2NhcGUgYXMgZXNjYXBlSHRtbCB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyBURVNUX1JVTl9FUlJPUlMgfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQge1xuICAgIHJlbmRlckZvcmJpZGRlbkNoYXJzTGlzdCxcbiAgICBmb3JtYXRTZWxlY3RvckNhbGxzdGFjayxcbiAgICBmb3JtYXRVcmwsXG4gICAgcmVwbGFjZUxlYWRpbmdTcGFjZXNXaXRoTmJzcCxcbiAgICBmb3JtYXRFeHByZXNzaW9uTWVzc2FnZVxufSBmcm9tICcuL3V0aWxzJztcblxuY29uc3QgRVhURVJOQUxfTElOS1MgPSB7XG4gICAgY3JlYXRlTmV3SXNzdWU6ICAgICAgJ2h0dHBzOi8vZ2l0aHViLmNvbS9EZXZFeHByZXNzL3Rlc3RjYWZlL2lzc3Vlcy9uZXc/dGVtcGxhdGU9YnVnLXJlcG9ydC5tZCcsXG4gICAgdHJvdWJsZXNob290TmV0d29yazogJ2h0dHBzOi8vZ28uZGV2ZXhwcmVzcy5jb20vVGVzdENhZmVfRkFRX0FSZXF1ZXN0SGFzRmFpbGVkLmFzcHgnLFxuICAgIHZpZXdwb3J0U2l6ZXM6ICAgICAgICdodHRwczovL2dpdGh1Yi5jb20vRGV2RXhwcmVzcy9kZXZpY2Utc3BlY3MvYmxvYi9tYXN0ZXIvdmlld3BvcnQtc2l6ZXMuanNvbidcbn07XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBbVEVTVF9SVU5fRVJST1JTLmFjdGlvbkludGVnZXJPcHRpb25FcnJvcl06IGVyciA9PiBgXG4gICAgICAgIFRoZSBcIiR7ZXJyLm9wdGlvbk5hbWV9XCIgb3B0aW9uIGlzIGV4cGVjdGVkIHRvIGJlIGFuIGludGVnZXIsIGJ1dCBpdCB3YXMgJHtlcnIuYWN0dWFsVmFsdWV9LlxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLmFjdGlvblBvc2l0aXZlSW50ZWdlck9wdGlvbkVycm9yXTogZXJyID0+IGBcbiAgICAgICAgVGhlIFwiJHtlcnIub3B0aW9uTmFtZX1cIiBvcHRpb24gaXMgZXhwZWN0ZWQgdG8gYmUgYSBwb3NpdGl2ZSBpbnRlZ2VyLCBidXQgaXQgd2FzICR7ZXJyLmFjdHVhbFZhbHVlfS5cbiAgICBgLFxuXG4gICAgW1RFU1RfUlVOX0VSUk9SUy5hY3Rpb25Cb29sZWFuT3B0aW9uRXJyb3JdOiBlcnIgPT4gYFxuICAgICAgICBUaGUgXCIke2Vyci5vcHRpb25OYW1lfVwiIG9wdGlvbiBpcyBleHBlY3RlZCB0byBiZSBhIGJvb2xlYW4gdmFsdWUsIGJ1dCBpdCB3YXMgJHtlcnIuYWN0dWFsVmFsdWV9LlxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLmFjdGlvblNwZWVkT3B0aW9uRXJyb3JdOiBlcnIgPT4gYFxuICAgICAgICBUaGUgXCIke2Vyci5vcHRpb25OYW1lfVwiIG9wdGlvbiBpcyBleHBlY3RlZCB0byBiZSBhIG51bWJlciBiZXR3ZWVuIDAuMDEgYW5kIDEsIGJ1dCBpdCB3YXMgJHtlcnIuYWN0dWFsVmFsdWV9LlxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLnBhZ2VMb2FkRXJyb3JdOiBlcnIgPT4gYFxuICAgICAgICBBIHJlcXVlc3QgdG8gJHtmb3JtYXRVcmwoZXJyLnVybCl9IGhhcyBmYWlsZWQuXG4gICAgICAgIFVzZSBxdWFyYW50aW5lIG1vZGUgdG8gcGVyZm9ybSBhZGRpdGlvbmFsIGF0dGVtcHRzIHRvIGV4ZWN1dGUgdGhpcyB0ZXN0LlxuICAgICAgICBZb3UgY2FuIGZpbmQgdHJvdWJsZXNob290aW5nIGluZm9ybWF0aW9uIGZvciB0aGlzIGlzc3VlIGF0ICR7Zm9ybWF0VXJsKEVYVEVSTkFMX0xJTktTLnRyb3VibGVzaG9vdE5ldHdvcmspfS5cblxuICAgICAgICBFcnJvciBkZXRhaWxzOlxuICAgICAgICAke2Vyci5lcnJNc2d9XG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMudW5jYXVnaHRFcnJvck9uUGFnZV06IGVyciA9PiBgXG4gICAgICAgIEEgSmF2YVNjcmlwdCBlcnJvciBvY2N1cnJlZCBvbiAke2Zvcm1hdFVybChlcnIucGFnZURlc3RVcmwpfS5cbiAgICAgICAgUmVwZWF0IHRlc3QgYWN0aW9ucyBpbiB0aGUgYnJvd3NlciBhbmQgY2hlY2sgdGhlIGNvbnNvbGUgZm9yIGVycm9ycy5cbiAgICAgICAgSWYgeW91IHNlZSB0aGlzIGVycm9yLCBpdCBtZWFucyB0aGF0IHRoZSB0ZXN0ZWQgd2Vic2l0ZSBjYXVzZWQgaXQuIFlvdSBjYW4gZml4IGl0IG9yIGRpc2FibGUgdHJhY2tpbmcgSmF2YVNjcmlwdCBlcnJvcnMgaW4gVGVzdENhZmUuIFRvIGRvIHRoZSBsYXR0ZXIsIGVuYWJsZSB0aGUgXCItLXNraXAtanMtZXJyb3JzXCIgb3B0aW9uLlxuICAgICAgICBJZiB0aGlzIGVycm9yIGRvZXMgbm90IG9jY3VyLCBwbGVhc2Ugd3JpdGUgYSBuZXcgaXNzdWUgYXQ6XG4gICAgICAgICR7Zm9ybWF0VXJsKEVYVEVSTkFMX0xJTktTLmNyZWF0ZU5ld0lzc3VlKX0uXG5cbiAgICAgICAgSmF2YVNjcmlwdCBlcnJvciBkZXRhaWxzOlxuICAgICAgICAke3JlcGxhY2VMZWFkaW5nU3BhY2VzV2l0aE5ic3AoZXNjYXBlSHRtbChlcnIuZXJyU3RhY2spKX1cbiAgICBgLFxuXG4gICAgW1RFU1RfUlVOX0VSUk9SUy51bmNhdWdodEVycm9ySW5UZXN0Q29kZV06IGVyciA9PiBgXG4gICAgICAgICR7ZXNjYXBlSHRtbChlcnIuZXJyTXNnKX1cbiAgICBgLFxuXG4gICAgW1RFU1RfUlVOX0VSUk9SUy5uYXRpdmVEaWFsb2dOb3RIYW5kbGVkRXJyb3JdOiBlcnIgPT4gYFxuICAgICAgICBBIG5hdGl2ZSAke2Vyci5kaWFsb2dUeXBlfSBkaWFsb2cgd2FzIGludm9rZWQgb24gcGFnZSAke2Zvcm1hdFVybChlcnIucGFnZVVybCl9LCBidXQgbm8gaGFuZGxlciB3YXMgc2V0IGZvciBpdC4gVXNlIHRoZSBcInNldE5hdGl2ZURpYWxvZ0hhbmRsZXJcIiBmdW5jdGlvbiB0byBpbnRyb2R1Y2UgYSBoYW5kbGVyIGZ1bmN0aW9uIGZvciBuYXRpdmUgZGlhbG9ncy5cbiAgICBgLFxuXG4gICAgW1RFU1RfUlVOX0VSUk9SUy51bmNhdWdodEVycm9ySW5OYXRpdmVEaWFsb2dIYW5kbGVyXTogZXJyID0+IGBcbiAgICAgICAgQW4gZXJyb3Igb2NjdXJyZWQgaW4gdGhlIG5hdGl2ZSBkaWFsb2cgaGFuZGxlciBjYWxsZWQgZm9yIGEgbmF0aXZlICR7ZXJyLmRpYWxvZ1R5cGV9IGRpYWxvZyBvbiBwYWdlICR7Zm9ybWF0VXJsKGVyci5wYWdlVXJsKX06XG5cbiAgICAgICAgJHtlc2NhcGVIdG1sKGVyci5lcnJNc2cpfVxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLnNldFRlc3RTcGVlZEFyZ3VtZW50RXJyb3JdOiBlcnIgPT4gYFxuICAgICAgICBTcGVlZCBpcyBleHBlY3RlZCB0byBiZSBhIG51bWJlciBiZXR3ZWVuIDAuMDEgYW5kIDEsIGJ1dCAke2Vyci5hY3R1YWxWYWx1ZX0gd2FzIHBhc3NlZC5cbiAgICBgLFxuXG4gICAgW1RFU1RfUlVOX0VSUk9SUy5zZXROYXRpdmVEaWFsb2dIYW5kbGVyQ29kZVdyb25nVHlwZUVycm9yXTogZXJyID0+IGBcbiAgICAgICAgVGhlIG5hdGl2ZSBkaWFsb2cgaGFuZGxlciBpcyBleHBlY3RlZCB0byBiZSBhIGZ1bmN0aW9uLCBDbGllbnRGdW5jdGlvbiBvciBudWxsLCBidXQgaXQgd2FzICR7ZXJyLmFjdHVhbFR5cGV9LlxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLnVuY2F1Z2h0RXJyb3JJbkNsaWVudEZ1bmN0aW9uQ29kZV06IGVyciA9PiBgXG4gICAgICAgIEFuIGVycm9yIG9jY3VycmVkIGluICR7ZXJyLmluc3RhbnRpYXRpb25DYWxsc2l0ZU5hbWV9IGNvZGU6XG5cbiAgICAgICAgJHtlc2NhcGVIdG1sKGVyci5lcnJNc2cpfVxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLnVuY2F1Z2h0RXJyb3JJbkN1c3RvbURPTVByb3BlcnR5Q29kZV06IGVyciA9PiBgXG4gICAgICAgIEFuIGVycm9yIG9jY3VycmVkIHdoZW4gdHJ5aW5nIHRvIGNhbGN1bGF0ZSBhIGN1c3RvbSBTZWxlY3RvciBwcm9wZXJ0eSBcIiR7ZXJyLnByb3BlcnR5fVwiOlxuXG4gICAgICAgICR7ZXNjYXBlSHRtbChlcnIuZXJyTXNnKX1cbiAgICBgLFxuXG4gICAgW1RFU1RfUlVOX0VSUk9SUy5jbGllbnRGdW5jdGlvbkV4ZWN1dGlvbkludGVycnVwdGlvbkVycm9yXTogZXJyID0+IGBcbiAgICAgICAgJHtlcnIuaW5zdGFudGlhdGlvbkNhbGxzaXRlTmFtZX0gZXhlY3V0aW9uIHdhcyBpbnRlcnJ1cHRlZCBieSBwYWdlIHVubG9hZC4gVGhpcyBwcm9ibGVtIG1heSBhcHBlYXIgaWYgeW91IHRyaWdnZXIgcGFnZSBuYXZpZ2F0aW9uIGZyb20gJHtlcnIuaW5zdGFudGlhdGlvbkNhbGxzaXRlTmFtZX0gY29kZS5cbiAgICBgLFxuXG4gICAgW1RFU1RfUlVOX0VSUk9SUy51bmNhdWdodE5vbkVycm9yT2JqZWN0SW5UZXN0Q29kZV06IGVyciA9PiBgXG4gICAgICAgIFVuY2F1Z2h0ICR7ZXJyLm9ialR5cGV9IFwiJHtlc2NhcGVIdG1sKGVyci5vYmpTdHIpfVwiIHdhcyB0aHJvd24uIFRocm93IEVycm9yIGluc3RlYWQuXG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMudW5oYW5kbGVkUHJvbWlzZVJlamVjdGlvbl06IGVyciA9PiBgXG4gICAgICAgIFVuaGFuZGxlZCBwcm9taXNlIHJlamVjdGlvbjpcblxuICAgICAgICAke2VzY2FwZUh0bWwoZXJyLmVyck1zZyl9XG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMudW5jYXVnaHRFeGNlcHRpb25dOiBlcnIgPT4gYFxuICAgICAgICBVbmNhdWdodCBleGNlcHRpb246XG5cbiAgICAgICAgJHtlc2NhcGVIdG1sKGVyci5lcnJNc2cpfVxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLmFjdGlvbk9wdGlvbnNUeXBlRXJyb3JdOiBlcnIgPT4gYFxuICAgICAgICBBY3Rpb24gb3B0aW9ucyBpcyBleHBlY3RlZCB0byBiZSBhbiBvYmplY3QsIG51bGwgb3IgdW5kZWZpbmVkIGJ1dCBpdCB3YXMgJHtlcnIuYWN0dWFsVHlwZX0uXG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMuYWN0aW9uU3RyaW5nQXJndW1lbnRFcnJvcl06IGVyciA9PiBgXG4gICAgICAgIFRoZSBcIiR7ZXJyLmFyZ3VtZW50TmFtZX1cIiBhcmd1bWVudCBpcyBleHBlY3RlZCB0byBiZSBhIG5vbi1lbXB0eSBzdHJpbmcsIGJ1dCBpdCB3YXMgJHtlcnIuYWN0dWFsVmFsdWV9LlxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLmFjdGlvbkJvb2xlYW5Bcmd1bWVudEVycm9yXTogZXJyID0+IGBcbiAgICAgICAgVGhlIFwiJHtlcnIuYXJndW1lbnROYW1lfVwiIGFyZ3VtZW50IGlzIGV4cGVjdGVkIHRvIGJlIGEgYm9vbGVhbiB2YWx1ZSwgYnV0IGl0IHdhcyAke2Vyci5hY3R1YWxWYWx1ZX0uXG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMuYWN0aW9uTnVsbGFibGVTdHJpbmdBcmd1bWVudEVycm9yXTogZXJyID0+IGBcbiAgICAgICAgVGhlIFwiJHtlcnIuYXJndW1lbnROYW1lfVwiIGFyZ3VtZW50IGlzIGV4cGVjdGVkIHRvIGJlIGEgbnVsbCBvciBhIHN0cmluZywgYnV0IGl0IHdhcyAke2Vyci5hY3R1YWxWYWx1ZX0uXG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMuYWN0aW9uU3RyaW5nT3JTdHJpbmdBcnJheUFyZ3VtZW50RXJyb3JdOiBlcnIgPT4gYFxuICAgICAgICBUaGUgXCIke2Vyci5hcmd1bWVudE5hbWV9XCIgYXJndW1lbnQgaXMgZXhwZWN0ZWQgdG8gYmUgYSBub24tZW1wdHkgc3RyaW5nIG9yIGEgc3RyaW5nIGFycmF5LCBidXQgaXQgd2FzICR7ZXJyLmFjdHVhbFZhbHVlfS5cbiAgICBgLFxuXG4gICAgW1RFU1RfUlVOX0VSUk9SUy5hY3Rpb25TdHJpbmdBcnJheUVsZW1lbnRFcnJvcl06IGVyciA9PiBgXG4gICAgICAgIEVsZW1lbnRzIG9mIHRoZSBcIiR7ZXJyLmFyZ3VtZW50TmFtZX1cIiBhcmd1bWVudCBhcmUgZXhwZWN0ZWQgdG8gYmUgbm9uLWVtcHR5IHN0cmluZ3MsIGJ1dCB0aGUgZWxlbWVudCBhdCBpbmRleCAke2Vyci5lbGVtZW50SW5kZXh9IHdhcyAke2Vyci5hY3R1YWxWYWx1ZX0uXG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMuYWN0aW9uSW50ZWdlckFyZ3VtZW50RXJyb3JdOiBlcnIgPT4gYFxuICAgICAgICBUaGUgXCIke2Vyci5hcmd1bWVudE5hbWV9XCIgYXJndW1lbnQgaXMgZXhwZWN0ZWQgdG8gYmUgYW4gaW50ZWdlciwgYnV0IGl0IHdhcyAke2Vyci5hY3R1YWxWYWx1ZX0uXG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMuYWN0aW9uUm9sZUFyZ3VtZW50RXJyb3JdOiBlcnIgPT4gYFxuICAgICAgICBUaGUgXCIke2Vyci5hcmd1bWVudE5hbWV9XCIgYXJndW1lbnQgaXMgZXhwZWN0ZWQgdG8gYmUgYSBSb2xlIGluc3RhbmNlLCBidXQgaXQgd2FzICR7ZXJyLmFjdHVhbFZhbHVlfS5cbiAgICBgLFxuXG4gICAgW1RFU1RfUlVOX0VSUk9SUy5hY3Rpb25GdW5jdGlvbkFyZ3VtZW50RXJyb3JdOiBlcnIgPT4gYFxuICAgICAgICBUaGUgXCIke2Vyci5hcmd1bWVudE5hbWV9XCIgYXJndW1lbnQgaXMgZXhwZWN0ZWQgdG8gYmUgYSBmdW5jdGlvbiwgYnV0IGl0IHdhcyAke2Vyci5hY3R1YWxWYWx1ZX0uXG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMuYWN0aW9uUG9zaXRpdmVJbnRlZ2VyQXJndW1lbnRFcnJvcl06IGVyciA9PiBgXG4gICAgICAgIFRoZSBcIiR7ZXJyLmFyZ3VtZW50TmFtZX1cIiBhcmd1bWVudCBpcyBleHBlY3RlZCB0byBiZSBhIHBvc2l0aXZlIGludGVnZXIsIGJ1dCBpdCB3YXMgJHtlcnIuYWN0dWFsVmFsdWV9LlxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLmFjdGlvbkVsZW1lbnROb3RGb3VuZEVycm9yXTogKGVyciwgdmlld3BvcnRXaWR0aCkgPT4gYFxuICAgICAgICBUaGUgc3BlY2lmaWVkIHNlbGVjdG9yIGRvZXMgbm90IG1hdGNoIGFueSBlbGVtZW50IGluIHRoZSBET00gdHJlZS5cblxuICAgICAgICAke2Zvcm1hdFNlbGVjdG9yQ2FsbHN0YWNrKGVyci5hcGlGbkNoYWluLCBlcnIuYXBpRm5JbmRleCwgdmlld3BvcnRXaWR0aCl9XG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMuYWN0aW9uRWxlbWVudElzSW52aXNpYmxlRXJyb3JdOiAoKSA9PiBgXG4gICAgICAgIFRoZSBlbGVtZW50IHRoYXQgbWF0Y2hlcyB0aGUgc3BlY2lmaWVkIHNlbGVjdG9yIGlzIG5vdCB2aXNpYmxlLlxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLmFjdGlvblNlbGVjdG9yTWF0Y2hlc1dyb25nTm9kZVR5cGVFcnJvcl06IGVyciA9PiBgXG4gICAgICAgIFRoZSBzcGVjaWZpZWQgc2VsZWN0b3IgaXMgZXhwZWN0ZWQgdG8gbWF0Y2ggYSBET00gZWxlbWVudCwgYnV0IGl0IG1hdGNoZXMgYSAke2Vyci5ub2RlRGVzY3JpcHRpb259IG5vZGUuXG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMuYWN0aW9uQWRkaXRpb25hbEVsZW1lbnROb3RGb3VuZEVycm9yXTogKGVyciwgdmlld3BvcnRXaWR0aCkgPT4gYFxuICAgICAgICBUaGUgc3BlY2lmaWVkIFwiJHtlcnIuYXJndW1lbnROYW1lfVwiIGRvZXMgbm90IG1hdGNoIGFueSBlbGVtZW50IGluIHRoZSBET00gdHJlZS5cblxuICAgICAgICAke2Zvcm1hdFNlbGVjdG9yQ2FsbHN0YWNrKGVyci5hcGlGbkNoYWluLCBlcnIuYXBpRm5JbmRleCwgdmlld3BvcnRXaWR0aCl9XG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMuYWN0aW9uQWRkaXRpb25hbEVsZW1lbnRJc0ludmlzaWJsZUVycm9yXTogZXJyID0+IGBcbiAgICAgICAgVGhlIGVsZW1lbnQgdGhhdCBtYXRjaGVzIHRoZSBzcGVjaWZpZWQgXCIke2Vyci5hcmd1bWVudE5hbWV9XCIgaXMgbm90IHZpc2libGUuXG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMuYWN0aW9uQWRkaXRpb25hbFNlbGVjdG9yTWF0Y2hlc1dyb25nTm9kZVR5cGVFcnJvcl06IGVyciA9PiBgXG4gICAgICAgIFRoZSBzcGVjaWZpZWQgXCIke2Vyci5hcmd1bWVudE5hbWV9XCIgaXMgZXhwZWN0ZWQgdG8gbWF0Y2ggYSBET00gZWxlbWVudCwgYnV0IGl0IG1hdGNoZXMgYSAke2Vyci5ub2RlRGVzY3JpcHRpb259IG5vZGUuXG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMuYWN0aW9uRWxlbWVudE5vbkVkaXRhYmxlRXJyb3JdOiAoKSA9PiBgXG4gICAgICAgIFRoZSBhY3Rpb24gZWxlbWVudCBpcyBleHBlY3RlZCB0byBiZSBlZGl0YWJsZSAoYW4gaW5wdXQsIHRleHRhcmVhIG9yIGVsZW1lbnQgd2l0aCB0aGUgY29udGVudEVkaXRhYmxlIGF0dHJpYnV0ZSkuXG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMuYWN0aW9uRWxlbWVudE5vbkNvbnRlbnRFZGl0YWJsZUVycm9yXTogZXJyID0+IGBcbiAgICAgICAgVGhlIGVsZW1lbnQgdGhhdCBtYXRjaGVzIHRoZSBzcGVjaWZpZWQgXCIke2Vyci5hcmd1bWVudE5hbWV9XCIgaXMgZXhwZWN0ZWQgdG8gaGF2ZSB0aGUgY29udGVudEVkaXRhYmxlIGF0dHJpYnV0ZSBlbmFibGVkIG9yIHRoZSBlbnRpcmUgZG9jdW1lbnQgc2hvdWxkIGJlIGluIGRlc2lnbiBtb2RlLlxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLmFjdGlvblJvb3RDb250YWluZXJOb3RGb3VuZEVycm9yXTogKCkgPT4gYFxuICAgICAgICBDb250ZW50IGJldHdlZW4gdGhlIGFjdGlvbiBlbGVtZW50cyBjYW5ub3QgYmUgc2VsZWN0ZWQgYmVjYXVzZSB0aGUgcm9vdCBjb250YWluZXIgZm9yIHRoZSBzZWxlY3Rpb24gcmFuZ2UgY2Fubm90IGJlIGZvdW5kLCBpLmUuIHRoZXNlIGVsZW1lbnRzIGRvIG5vdCBoYXZlIGEgY29tbW9uIGFuY2VzdG9yIHdpdGggdGhlIGNvbnRlbnRFZGl0YWJsZSBhdHRyaWJ1dGUuXG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMuYWN0aW9uRWxlbWVudElzTm90RmlsZUlucHV0RXJyb3JdOiAoKSA9PiBgXG4gICAgICAgIFRoZSBzcGVjaWZpZWQgc2VsZWN0b3IgZG9lcyBub3QgbWF0Y2ggYSBmaWxlIGlucHV0IGVsZW1lbnQuXG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMuYWN0aW9uQ2Fubm90RmluZEZpbGVUb1VwbG9hZEVycm9yXTogZXJyID0+IGBcbiAgICAgICAgQ2Fubm90IGZpbmQgdGhlIGZvbGxvd2luZyBmaWxlKHMpIHRvIHVwbG9hZDpcbiAgICAgICAgJHtlcnIuZmlsZVBhdGhzLm1hcChwYXRoID0+IGVzY2FwZUh0bWwocGF0aCkpLmpvaW4oJ1xcbicpfVxuXG4gICAgICAgIFRoZSBmb2xsb3dpbmcgbG9jYXRpb25zIHdlcmUgc2Nhbm5lZCBmb3IgdGhlIG1pc3NpbmcgdXBsb2FkIGZpbGVzOlxuICAgICAgICAke2Vyci5zY2FubmVkRmlsZVBhdGhzLm1hcChwYXRoID0+IGVzY2FwZUh0bWwocGF0aCkpLmpvaW4oJ1xcbicpfVxuXG4gICAgICAgIEVuc3VyZSB0aGVzZSBmaWxlcyBleGlzdCBvciBjaGFuZ2UgdGhlIHdvcmtpbmcgZGlyZWN0b3J5LlxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLmFjdGlvbkVsZW1lbnROb3RUZXh0QXJlYUVycm9yXTogKCkgPT4gYFxuICAgICAgICBUaGUgYWN0aW9uIGVsZW1lbnQgaXMgZXhwZWN0ZWQgdG8gYmUgYSAmbHQ7dGV4dGFyZWEmZ3Q7LlxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLmFjdGlvbkVsZW1lbnROb3RJZnJhbWVFcnJvcl06ICgpID0+IGBcbiAgICAgICAgVGhlIGFjdGlvbiBlbGVtZW50IGlzIGV4cGVjdGVkIHRvIGJlIGFuICZsdDtpZnJhbWUmZ3QuXG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMuYWN0aW9uSW5jb3JyZWN0S2V5c0Vycm9yXTogZXJyID0+IGBcbiAgICAgICAgVGhlIFwiJHtlcnIuYXJndW1lbnROYW1lfVwiIGFyZ3VtZW50IGNvbnRhaW5zIGFuIGluY29ycmVjdCBrZXkgb3Iga2V5IGNvbWJpbmF0aW9uLlxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLmFjdGlvblVuc3VwcG9ydGVkRGV2aWNlVHlwZUVycm9yXTogZXJyID0+IGBcbiAgICAgICAgVGhlIFwiJHtlcnIuYXJndW1lbnROYW1lfVwiIGFyZ3VtZW50IHNwZWNpZmllcyBhbiB1bnN1cHBvcnRlZCBcIiR7ZXJyLmFjdHVhbFZhbHVlfVwiIGRldmljZS4gRm9yIGEgbGlzdCBvZiBzdXBwb3J0ZWQgZGV2aWNlcywgcmVmZXIgdG8gJHtmb3JtYXRVcmwoRVhURVJOQUxfTElOS1Mudmlld3BvcnRTaXplcyl9LlxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLmFjdGlvbkludmFsaWRTY3JvbGxUYXJnZXRFcnJvcl06IGVyciA9PiBgXG4gICAgICAgIFVuYWJsZSB0byBzY3JvbGwgdG8gdGhlIHNwZWNpZmllZCBwb2ludCBiZWNhdXNlIGEgcG9pbnQgd2l0aCB0aGUgc3BlY2lmaWVkICR7ZXJyLnByb3BlcnRpZXN9IGlzIG5vdCBsb2NhdGVkIGluc2lkZSB0aGUgZWxlbWVudCdzIGNyb3BwaW5nIHJlZ2lvbi5cbiAgICBgLFxuXG4gICAgW1RFU1RfUlVOX0VSUk9SUy5hY3Rpb25JZnJhbWVJc05vdExvYWRlZEVycm9yXTogKCkgPT4gYFxuICAgICAgICBDb250ZW50IG9mIHRoZSBpZnJhbWUgdG8gd2hpY2ggeW91IGFyZSBzd2l0Y2hpbmcgZGlkIG5vdCBsb2FkLlxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLmN1cnJlbnRJZnJhbWVJc05vdExvYWRlZEVycm9yXTogKCkgPT4gYFxuICAgICAgICBDb250ZW50IG9mIHRoZSBpZnJhbWUgaW4gd2hpY2ggdGhlIHRlc3QgaXMgY3VycmVudGx5IG9wZXJhdGluZyBkaWQgbm90IGxvYWQuXG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMuY3VycmVudElmcmFtZU5vdEZvdW5kRXJyb3JdOiAoKSA9PiBgXG4gICAgICAgIFRoZSBpZnJhbWUgaW4gd2hpY2ggdGhlIHRlc3QgaXMgY3VycmVudGx5IG9wZXJhdGluZyBkb2VzIG5vdCBleGlzdCBhbnltb3JlLlxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLmN1cnJlbnRJZnJhbWVJc0ludmlzaWJsZUVycm9yXTogKCkgPT4gYFxuICAgICAgICBUaGUgaWZyYW1lIGluIHdoaWNoIHRoZSB0ZXN0IGlzIGN1cnJlbnRseSBvcGVyYXRpbmcgaXMgbm90IHZpc2libGUgYW55bW9yZS5cbiAgICBgLFxuXG4gICAgW1RFU1RfUlVOX0VSUk9SUy5taXNzaW5nQXdhaXRFcnJvcl06ICgpID0+IGBcbiAgICAgICAgQSBjYWxsIHRvIGFuIGFzeW5jIGZ1bmN0aW9uIGlzIG5vdCBhd2FpdGVkLiBVc2UgdGhlIFwiYXdhaXRcIiBrZXl3b3JkIGJlZm9yZSBhY3Rpb25zLCBhc3NlcnRpb25zIG9yIGNoYWlucyBvZiB0aGVtIHRvIGVuc3VyZSB0aGF0IHRoZXkgcnVuIGluIHRoZSByaWdodCBzZXF1ZW5jZS5cbiAgICBgLFxuXG4gICAgW1RFU1RfUlVOX0VSUk9SUy5leHRlcm5hbEFzc2VydGlvbkxpYnJhcnlFcnJvcl06IGVyciA9PiBgXG4gICAgICAgICR7ZXNjYXBlSHRtbChlcnIuZXJyTXNnKX1cblxuICAgICAgICA8c3BhbiBjbGFzcz1cImRpZmYtYWRkZWRcIj4rIGV4cGVjdGVkPC9zcGFuPiA8c3BhbiBjbGFzcz1cImRpZmYtcmVtb3ZlZFwiPi0gYWN0dWFsPC9zcGFuPlxuXG4gICAgICAgICR7ZXJyLmRpZmZ9XG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMuZG9tTm9kZUNsaWVudEZ1bmN0aW9uUmVzdWx0RXJyb3JdOiBlcnIgPT4gYFxuICAgICAgICR7ZXJyLmluc3RhbnRpYXRpb25DYWxsc2l0ZU5hbWV9IGNhbm5vdCByZXR1cm4gRE9NIGVsZW1lbnRzLiBVc2UgU2VsZWN0b3IgZnVuY3Rpb25zIGZvciB0aGlzIHB1cnBvc2UuXG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMuaW52YWxpZFNlbGVjdG9yUmVzdWx0RXJyb3JdOiAoKSA9PiBgXG4gICAgICAgIEZ1bmN0aW9uIHRoYXQgc3BlY2lmaWVzIGEgc2VsZWN0b3IgY2FuIG9ubHkgcmV0dXJuIGEgRE9NIG5vZGUsIGFuIGFycmF5IG9mIG5vZGVzLCBOb2RlTGlzdCwgSFRNTENvbGxlY3Rpb24sIG51bGwgb3IgdW5kZWZpbmVkLiBVc2UgQ2xpZW50RnVuY3Rpb24gdG8gcmV0dXJuIG90aGVyIHZhbHVlcy5cbiAgICBgLFxuXG4gICAgW1RFU1RfUlVOX0VSUk9SUy5hY3Rpb25TZWxlY3RvckVycm9yXTogZXJyID0+IGBcbiAgICAgICAgQWN0aW9uIFwiJHtlcnIuc2VsZWN0b3JOYW1lfVwiIGFyZ3VtZW50IGVycm9yOlxuXG4gICAgICAgICR7ZXNjYXBlSHRtbChlcnIuZXJyTXNnKX1cbiAgICBgLFxuXG4gICAgW1RFU1RfUlVOX0VSUk9SUy5jYW5ub3RPYnRhaW5JbmZvRm9yRWxlbWVudFNwZWNpZmllZEJ5U2VsZWN0b3JFcnJvcl06IChlcnIsIHZpZXdwb3J0V2lkdGgpID0+IGBcbiAgICAgICAgQ2Fubm90IG9idGFpbiBpbmZvcm1hdGlvbiBhYm91dCB0aGUgbm9kZSBiZWNhdXNlIHRoZSBzcGVjaWZpZWQgc2VsZWN0b3IgZG9lcyBub3QgbWF0Y2ggYW55IG5vZGUgaW4gdGhlIERPTSB0cmVlLlxuXG4gICAgICAgICR7Zm9ybWF0U2VsZWN0b3JDYWxsc3RhY2soZXJyLmFwaUZuQ2hhaW4sIGVyci5hcGlGbkluZGV4LCB2aWV3cG9ydFdpZHRoKX1cbiAgICBgLFxuXG4gICAgW1RFU1RfUlVOX0VSUk9SUy53aW5kb3dEaW1lbnNpb25zT3ZlcmZsb3dFcnJvcl06ICgpID0+IGBcbiAgICAgICAgVW5hYmxlIHRvIHJlc2l6ZSB0aGUgd2luZG93IGJlY2F1c2UgdGhlIHNwZWNpZmllZCBzaXplIGV4Y2VlZHMgdGhlIHNjcmVlbiBzaXplLiBPbiBtYWNPUywgYSB3aW5kb3cgY2Fubm90IGJlIGxhcmdlciB0aGFuIHRoZSBzY3JlZW4uXG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMuZm9yYmlkZGVuQ2hhcmFjdGVyc0luU2NyZWVuc2hvdFBhdGhFcnJvcl06IGVyciA9PiBgXG4gICAgICAgIFRoZXJlIGFyZSBmb3JiaWRkZW4gY2hhcmFjdGVycyBpbiB0aGUgXCIke2Vyci5zY3JlZW5zaG90UGF0aH1cIiBzY3JlZW5zaG90IHBhdGg6XG4gICAgICAgICR7cmVuZGVyRm9yYmlkZGVuQ2hhcnNMaXN0KGVyci5mb3JiaWRkZW5DaGFyc0xpc3QpfVxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLmludmFsaWRFbGVtZW50U2NyZWVuc2hvdERpbWVuc2lvbnNFcnJvcl06IGVyciA9PiBgXG4gICAgICAgICBVbmFibGUgdG8gY2FwdHVyZSBhbiBlbGVtZW50IGltYWdlIGJlY2F1c2UgdGhlIHJlc3VsdGluZyBpbWFnZSAke2Vyci5kaW1lbnNpb25zfSAke2Vyci52ZXJifSB6ZXJvIG9yIG5lZ2F0aXZlLlxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLnJvbGVTd2l0Y2hJblJvbGVJbml0aWFsaXplckVycm9yXTogKCkgPT4gYFxuICAgICAgICBSb2xlIGNhbm5vdCBiZSBzd2l0Y2hlZCB3aGlsZSBhbm90aGVyIHJvbGUgaXMgYmVpbmcgaW5pdGlhbGl6ZWQuXG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMuYXNzZXJ0aW9uRXhlY3V0YWJsZUFyZ3VtZW50RXJyb3JdOiBlcnIgPT4gYFxuICAgICAgICBDYW5ub3QgZXZhbHVhdGUgdGhlIFwiJHtlcnIuYWN0dWFsVmFsdWV9XCIgZXhwcmVzc2lvbiBpbiB0aGUgXCIke2Vyci5hcmd1bWVudE5hbWV9XCIgcGFyYW1ldGVyIGJlY2F1c2Ugb2YgdGhlIGZvbGxvd2luZyBlcnJvcjpcblxuICAgICAgICAke2Vyci5lcnJNc2d9XG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMuYXNzZXJ0aW9uV2l0aG91dE1ldGhvZENhbGxFcnJvcl06ICgpID0+IGBcbiAgICAgICAgQW4gYXNzZXJ0aW9uIG1ldGhvZCBpcyBub3Qgc3BlY2lmaWVkLlxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLmFzc2VydGlvblVuYXdhaXRlZFByb21pc2VFcnJvcl06ICgpID0+IGBcbiAgICAgICAgQXR0ZW1wdGVkIHRvIHJ1biBhc3NlcnRpb25zIG9uIGEgUHJvbWlzZSBvYmplY3QuIERpZCB5b3UgZm9yZ2V0IHRvIGF3YWl0IGl0PyBJZiBub3QsIHBhc3MgXCJ7IGFsbG93VW5hd2FpdGVkUHJvbWlzZTogdHJ1ZSB9XCIgdG8gdGhlIGFzc2VydGlvbiBvcHRpb25zLlxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLnJlcXVlc3RIb29rTm90SW1wbGVtZW50ZWRFcnJvcl06IGVyciA9PiBgXG4gICAgICAgIFlvdSBzaG91bGQgaW1wbGVtZW50IHRoZSBcIiR7ZXJyLm1ldGhvZE5hbWV9XCIgbWV0aG9kIGluIHRoZSBcIiR7ZXJyLmhvb2tDbGFzc05hbWV9XCIgY2xhc3MuXG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMucmVxdWVzdEhvb2tVbmhhbmRsZWRFcnJvcl06IGVyciA9PiBgXG4gICAgICAgIEFuIHVuaGFuZGxlZCBlcnJvciBvY2N1cnJlZCBpbiB0aGUgXCIke2Vyci5tZXRob2ROYW1lfVwiIG1ldGhvZCBvZiB0aGUgXCIke2Vyci5ob29rQ2xhc3NOYW1lfVwiIGNsYXNzOlxuXG4gICAgICAgICR7ZXNjYXBlSHRtbChlcnIuZXJyTXNnKX1cbiAgICBgLFxuXG4gICAgW1RFU1RfUlVOX0VSUk9SUy51bmNhdWdodEVycm9ySW5DdXN0b21DbGllbnRTY3JpcHRDb2RlXTogZXJyID0+IGBcbiAgICAgICAgQW4gZXJyb3Igb2NjdXJyZWQgaW4gYSBzY3JpcHQgaW5qZWN0ZWQgaW50byB0aGUgdGVzdGVkIHBhZ2U6XG5cbiAgICAgICAgJHtlc2NhcGVIdG1sKGVyci5lcnJNc2cpfVxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLnVuY2F1Z2h0RXJyb3JJbkN1c3RvbUNsaWVudFNjcmlwdENvZGVMb2FkZWRGcm9tTW9kdWxlXTogZXJyID0+IGBcbiAgICAgICAgQW4gZXJyb3Igb2NjdXJyZWQgaW4gdGhlICcke2Vyci5tb2R1bGVOYW1lfScgbW9kdWxlIGluamVjdGVkIGludG8gdGhlIHRlc3RlZCBwYWdlLiBNYWtlIHN1cmUgdGhhdCB0aGlzIG1vZHVsZSBjYW4gYmUgZXhlY3V0ZWQgaW4gdGhlIGJyb3dzZXIgZW52aXJvbm1lbnQuXG5cbiAgICAgICAgRXJyb3IgZGV0YWlsczpcbiAgICAgICAgJHtlc2NhcGVIdG1sKGVyci5lcnJNc2cpfVxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLnVuY2F1Z2h0RXJyb3JJbkN1c3RvbVNjcmlwdF06IGVyciA9PiBgXG4gICAgICAgIEFuIHVuaGFuZGxlZCBlcnJvciBvY2N1cnJlZCBpbiB0aGUgY3VzdG9tIHNjcmlwdDpcblxuICAgICAgICBFcnJvciBkZXRhaWxzOiAke2VzY2FwZUh0bWwoZXJyLmVyck1zZyl9XG5cbiAgICAgICAgJHtmb3JtYXRFeHByZXNzaW9uTWVzc2FnZShlcnIuZXhwcmVzc2lvbiwgZXJyLmxpbmUsIGVyci5jb2x1bW4pfVxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLmNoaWxkV2luZG93SXNOb3RMb2FkZWRFcnJvcl06ICgpID0+IGBcbiAgICAgICAgVGhlIHBhZ2UgaW4gdGhlIGNoaWxkIHdpbmRvdyBpcyBub3QgbG9hZGVkLlxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLmNoaWxkV2luZG93Tm90Rm91bmRFcnJvcl06ICgpID0+IGBcbiAgICAgICAgVGhlIGNoaWxkIHdpbmRvdyBpcyBub3QgZm91bmQuXG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMuY2Fubm90U3dpdGNoVG9XaW5kb3dFcnJvcl06ICgpID0+IGBcbiAgICAgICAgQ2Fubm90IHN3aXRjaCB0byB0aGUgd2luZG93LlxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLmNsb3NlQ2hpbGRXaW5kb3dFcnJvcl06ICgpID0+IGBcbiAgICAgICAgQW4gZXJyb3Igb2NjdXJyZWQgd2hpbGUgY2xvc2luZyBjaGlsZCB3aW5kb3dzLlxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLmNoaWxkV2luZG93Q2xvc2VkQmVmb3JlU3dpdGNoaW5nRXJyb3JdOiAoKSA9PiBgXG4gICAgICAgIFRoZSBjaGlsZCB3aW5kb3cgd2FzIGNsb3NlZCBiZWZvcmUgVGVzdENhZmUgY291bGQgc3dpdGNoIHRvIGl0LlxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLmNhbm5vdENsb3NlV2luZG93V2l0aENoaWxkcmVuRXJyb3JdOiAoKSA9PiBgXG4gICAgICAgIENhbm5vdCBjbG9zZSBhIHdpbmRvdyB0aGF0IGhhcyBhbiBvcGVuIGNoaWxkIHdpbmRvdy5cbiAgICBgLFxuXG4gICAgW1RFU1RfUlVOX0VSUk9SUy50YXJnZXRXaW5kb3dOb3RGb3VuZEVycm9yXTogKCkgPT4gYFxuICAgICAgICBDYW5ub3QgZmluZCB0aGUgd2luZG93IHNwZWNpZmllZCBpbiB0aGUgYWN0aW9uIHBhcmFtZXRlcnMuXG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMucGFyZW50V2luZG93Tm90Rm91bmRFcnJvcl06ICgpID0+IGBcbiAgICAgICAgQ2Fubm90IGZpbmQgdGhlIHBhcmVudCB3aW5kb3cuIE1ha2Ugc3VyZSB0aGF0IHRoZSB0ZXN0ZWQgd2luZG93IHdhcyBvcGVuZWQgZnJvbSBhbm90aGVyIHdpbmRvdy5cbiAgICBgLFxuXG4gICAgW1RFU1RfUlVOX0VSUk9SUy5wcmV2aW91c1dpbmRvd05vdEZvdW5kRXJyb3JdOiAoKSA9PiBgXG4gICAgICAgIENhbm5vdCBmaW5kIHRoZSBwcmV2aW91cyB3aW5kb3cuIE1ha2Ugc3VyZSB0aGF0IHRoZSBwcmV2aW91cyB3aW5kb3cgaXMgb3BlbmVkLlxuICAgIGAsXG5cbiAgICBbVEVTVF9SVU5fRVJST1JTLnN3aXRjaFRvV2luZG93UHJlZGljYXRlRXJyb3JdOiBlcnIgPT4gYFxuICAgICAgICBBbiBlcnJvciBvY2N1cnJlZCBpbnNpZGUgdGhlIFwic3dpdGNoVG9XaW5kb3dcIiBhcmd1bWVudCBmdW5jdGlvbi5cblxuICAgICAgICBFcnJvciBkZXRhaWxzOlxuICAgICAgICAke2VzY2FwZUh0bWwoZXJyLmVyck1zZyl9XG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMubXVsdGlwbGVXaW5kb3dzTW9kZUlzRGlzYWJsZWRFcnJvcl06IGVyciA9PiBgXG4gICAgICAgIE11bHRpIHdpbmRvdyBtb2RlIGlzIGRpc2FibGVkLiBSZW1vdmUgdGhlIFwiLS1kaXNhYmxlLW11bHRpcGxlLXdpbmRvd3NcIiBDTEkgZmxhZyBvciBzZXQgdGhlIFwiZGlzYWJsZU11bHRpcGxlV2luZG93c1wiIG9wdGlvbiB0byBcImZhbHNlXCIgaW4gdGhlIEFQSSB0byB1c2UgdGhlIFwiJHtlcnIubWV0aG9kTmFtZX1cIiBtZXRob2QuXG4gICAgYCxcblxuICAgIFtURVNUX1JVTl9FUlJPUlMubXVsdGlwbGVXaW5kb3dzTW9kZUlzTm90U3VwcG9ydGVkSW5SZW1vdGVCcm93c2VyRXJyb3JdOiBlcnIgPT4gYFxuICAgICAgICBNdWx0aSB3aW5kb3cgbW9kZSBpcyBzdXBwb3J0ZWQgaW4gQ2hyb21lLCBDaHJvbWl1bSwgRWRnZSA4NCsgYW5kIEZpcmVmb3ggb25seS4gUnVuIHRlc3RzIGluIHRoZXNlIGJyb3dzZXJzIHRvIHVzZSB0aGUgXCIke2Vyci5tZXRob2ROYW1lfVwiIG1ldGhvZC5cbiAgICBgLFxuXG4gICAgW1RFU1RfUlVOX0VSUk9SUy5jYW5ub3RDbG9zZVdpbmRvd1dpdGhvdXRQYXJlbnRdOiAoKSA9PiBgXG4gICAgICAgIENhbm5vdCBjbG9zZSB0aGUgd2luZG93IGJlY2F1c2UgaXQgZG9lcyBub3QgaGF2ZSBhIHBhcmVudC4gVGhlIHBhcmVudCB3aW5kb3cgd2FzIGNsb3NlZCBvciB5b3UgYXJlIGF0dGVtcHRpbmcgdG8gY2xvc2UgdGhlIHJvb3QgYnJvd3NlciB3aW5kb3cgd2hlcmUgdGVzdHMgd2VyZSBsYXVuY2hlZC5cbiAgICBgLFxuXG4gICAgW1RFU1RfUlVOX0VSUk9SUy5jYW5ub3RSZXN0b3JlQ2hpbGRXaW5kb3dFcnJvcl06ICgpID0+IGBcbiAgICAgICAgRmFpbGVkIHRvIHJlc3RvcmUgY29ubmVjdGlvbiB0byB3aW5kb3cgd2l0aGluIHRoZSBhbGxvY2F0ZWQgdGltZW91dC5cbiAgICBgLFxufTtcbiJdfQ==