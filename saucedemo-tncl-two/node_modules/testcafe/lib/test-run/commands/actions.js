"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecorderCommand = exports.UseRoleCommand = exports.SetPageLoadTimeoutCommand = exports.SetTestSpeedCommand = exports.GetBrowserConsoleMessagesCommand = exports.GetNativeDialogHistoryCommand = exports.SetNativeDialogHandlerCommand = exports.SwitchToPreviousWindowCommand = exports.SwitchToParentWindowCommand = exports.SwitchToWindowByPredicateCommand = exports.SwitchToWindowCommand = exports.GetCurrentWindowsCommand = exports.GetCurrentWindowCommand = exports.CloseWindowCommand = exports.OpenWindowCommand = exports.SwitchToMainWindowCommand = exports.SwitchToIframeCommand = exports.ClearUploadCommand = exports.SetFilesToUploadCommand = exports.NavigateToCommand = exports.PressKeyCommand = exports.SelectTextAreaContentCommand = exports.SelectEditableContentCommand = exports.SelectTextCommand = exports.DragToElementCommand = exports.DragCommand = exports.TypeTextCommand = exports.HoverCommand = exports.DoubleClickCommand = exports.ExecuteAsyncExpressionCommand = exports.ExecuteExpressionCommand = exports.RightClickCommand = exports.ClickCommand = void 0;
const type_1 = __importDefault(require("./type"));
const selector_builder_1 = __importDefault(require("../../client-functions/selectors/selector-builder"));
const client_function_builder_1 = __importDefault(require("../../client-functions/client-function-builder"));
const builder_symbol_1 = __importDefault(require("../../client-functions/builder-symbol"));
const base_1 = __importDefault(require("./base"));
const options_1 = require("./options");
const initializers_1 = require("./validations/initializers");
const execute_js_expression_1 = require("../execute-js-expression");
const utils_1 = require("./utils");
const argument_1 = require("./validations/argument");
const test_run_1 = require("../../errors/test-run");
const observation_1 = require("./observation");
// Initializers
function initActionOptions(name, val) {
    return new options_1.ActionOptions(val, true);
}
function initClickOptions(name, val) {
    return new options_1.ClickOptions(val, true);
}
function initMouseOptions(name, val) {
    return new options_1.MouseOptions(val, true);
}
function initTypeOptions(name, val) {
    return new options_1.TypeOptions(val, true);
}
function initDragToElementOptions(name, val) {
    return new options_1.DragToElementOptions(val, true);
}
function initDialogHandler(name, val, { skipVisibilityCheck, testRun }) {
    let fn;
    if (utils_1.isJSExpression(val))
        fn = execute_js_expression_1.executeJsExpression(val.value, testRun, { skipVisibilityCheck });
    else
        fn = val.fn;
    if (fn === null || fn instanceof observation_1.ExecuteClientFunctionCommand)
        return fn;
    const options = val.options;
    const methodName = 'setNativeDialogHandler';
    const functionType = typeof fn;
    let builder = fn && fn[builder_symbol_1.default];
    const isSelector = builder instanceof selector_builder_1.default;
    const isClientFunction = builder instanceof client_function_builder_1.default;
    if (functionType !== 'function' || isSelector)
        throw new test_run_1.SetNativeDialogHandlerCodeWrongTypeError(isSelector ? 'Selector' : functionType);
    if (isClientFunction)
        builder = fn.with(options)[builder_symbol_1.default];
    else
        builder = new client_function_builder_1.default(fn, options, { instantiation: methodName, execution: methodName });
    return builder.getCommand([]);
}
// Commands
class ClickCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.click);
    }
    _getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initSelector, required: true },
            { name: 'options', type: argument_1.actionOptions, init: initClickOptions, required: true }
        ];
    }
}
exports.ClickCommand = ClickCommand;
class RightClickCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.rightClick);
    }
    _getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initSelector, required: true },
            { name: 'options', type: argument_1.actionOptions, init: initClickOptions, required: true }
        ];
    }
}
exports.RightClickCommand = RightClickCommand;
class ExecuteExpressionCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.executeExpression);
    }
    _getAssignableProperties() {
        return [
            { name: 'expression', type: argument_1.nonEmptyStringArgument, required: true },
            { name: 'resultVariableName', type: argument_1.nonEmptyStringArgument, defaultValue: null }
        ];
    }
}
exports.ExecuteExpressionCommand = ExecuteExpressionCommand;
class ExecuteAsyncExpressionCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.executeAsyncExpression);
    }
    _getAssignableProperties() {
        return [
            { name: 'expression', type: argument_1.stringArgument, required: true }
        ];
    }
}
exports.ExecuteAsyncExpressionCommand = ExecuteAsyncExpressionCommand;
class DoubleClickCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.doubleClick);
    }
    _getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initSelector, required: true },
            { name: 'options', type: argument_1.actionOptions, init: initClickOptions, required: true }
        ];
    }
}
exports.DoubleClickCommand = DoubleClickCommand;
class HoverCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.hover);
    }
    _getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initSelector, required: true },
            { name: 'options', type: argument_1.actionOptions, init: initMouseOptions, required: true }
        ];
    }
}
exports.HoverCommand = HoverCommand;
class TypeTextCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.typeText);
    }
    _getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initSelector, required: true },
            { name: 'text', type: argument_1.nonEmptyStringArgument, required: true },
            { name: 'options', type: argument_1.actionOptions, init: initTypeOptions, required: true }
        ];
    }
}
exports.TypeTextCommand = TypeTextCommand;
class DragCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.drag);
    }
    _getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initSelector, required: true },
            { name: 'dragOffsetX', type: argument_1.integerArgument, required: true },
            { name: 'dragOffsetY', type: argument_1.integerArgument, required: true },
            { name: 'options', type: argument_1.actionOptions, init: initMouseOptions, required: true }
        ];
    }
}
exports.DragCommand = DragCommand;
class DragToElementCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.dragToElement);
    }
    _getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initSelector, required: true },
            { name: 'destinationSelector', init: initializers_1.initSelector, required: true },
            { name: 'options', type: argument_1.actionOptions, init: initDragToElementOptions, required: true }
        ];
    }
}
exports.DragToElementCommand = DragToElementCommand;
class SelectTextCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.selectText);
    }
    _getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initSelector, required: true },
            { name: 'startPos', type: argument_1.positiveIntegerArgument, defaultValue: null },
            { name: 'endPos', type: argument_1.positiveIntegerArgument, defaultValue: null },
            { name: 'options', type: argument_1.actionOptions, init: initActionOptions, required: true }
        ];
    }
}
exports.SelectTextCommand = SelectTextCommand;
class SelectEditableContentCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.selectEditableContent);
    }
    _getAssignableProperties() {
        return [
            { name: 'startSelector', init: initializers_1.initSelector, required: true },
            { name: 'endSelector', init: initializers_1.initSelector, defaultValue: null },
            { name: 'options', type: argument_1.actionOptions, init: initActionOptions, required: true }
        ];
    }
}
exports.SelectEditableContentCommand = SelectEditableContentCommand;
class SelectTextAreaContentCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.selectTextAreaContent);
    }
    _getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initSelector, required: true },
            { name: 'startLine', type: argument_1.positiveIntegerArgument, defaultValue: null },
            { name: 'startPos', type: argument_1.positiveIntegerArgument, defaultValue: null },
            { name: 'endLine', type: argument_1.positiveIntegerArgument, defaultValue: null },
            { name: 'endPos', type: argument_1.positiveIntegerArgument, defaultValue: null },
            { name: 'options', type: argument_1.actionOptions, init: initActionOptions, required: true }
        ];
    }
}
exports.SelectTextAreaContentCommand = SelectTextAreaContentCommand;
class PressKeyCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.pressKey);
    }
    _getAssignableProperties() {
        return [
            { name: 'keys', type: argument_1.nonEmptyStringArgument, required: true },
            { name: 'options', type: argument_1.actionOptions, init: initActionOptions, required: true }
        ];
    }
}
exports.PressKeyCommand = PressKeyCommand;
class NavigateToCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.navigateTo);
    }
    _getAssignableProperties() {
        return [
            { name: 'url', type: argument_1.urlArgument, required: true },
            { name: 'stateSnapshot', type: argument_1.nullableStringArgument, defaultValue: null },
            { name: 'forceReload', type: argument_1.booleanArgument, defaultValue: false }
        ];
    }
}
exports.NavigateToCommand = NavigateToCommand;
class SetFilesToUploadCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.setFilesToUpload);
    }
    _getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initUploadSelector, required: true },
            { name: 'filePath', type: argument_1.stringOrStringArrayArgument, required: true }
        ];
    }
}
exports.SetFilesToUploadCommand = SetFilesToUploadCommand;
class ClearUploadCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.clearUpload);
    }
    _getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initUploadSelector, required: true }
        ];
    }
}
exports.ClearUploadCommand = ClearUploadCommand;
class SwitchToIframeCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.switchToIframe);
    }
    _getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initSelector, required: true }
        ];
    }
}
exports.SwitchToIframeCommand = SwitchToIframeCommand;
class SwitchToMainWindowCommand {
    constructor() {
        this.type = type_1.default.switchToMainWindow;
    }
}
exports.SwitchToMainWindowCommand = SwitchToMainWindowCommand;
class OpenWindowCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.openWindow);
    }
    _getAssignableProperties() {
        return [
            { name: 'url', type: argument_1.urlArgument },
        ];
    }
}
exports.OpenWindowCommand = OpenWindowCommand;
class CloseWindowCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.closeWindow);
    }
    _getAssignableProperties() {
        return [
            { name: 'windowId', type: argument_1.nullableStringArgument, required: true },
        ];
    }
}
exports.CloseWindowCommand = CloseWindowCommand;
class GetCurrentWindowCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.getCurrentWindow);
    }
    _getAssignableProperties() {
        return [];
    }
}
exports.GetCurrentWindowCommand = GetCurrentWindowCommand;
class GetCurrentWindowsCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.getCurrentWindows);
    }
    _getAssignableProperties() {
        return [];
    }
}
exports.GetCurrentWindowsCommand = GetCurrentWindowsCommand;
class SwitchToWindowCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.switchToWindow);
    }
    _getAssignableProperties() {
        return [
            { name: 'windowId', type: argument_1.nonEmptyStringArgument, required: true }
        ];
    }
}
exports.SwitchToWindowCommand = SwitchToWindowCommand;
class SwitchToWindowByPredicateCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.switchToWindowByPredicate);
    }
    _getAssignableProperties() {
        return [
            { name: 'findWindow', type: argument_1.functionArgument, required: true }
        ];
    }
}
exports.SwitchToWindowByPredicateCommand = SwitchToWindowByPredicateCommand;
class SwitchToParentWindowCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.switchToParentWindow);
    }
    _getAssignableProperties() {
        return [];
    }
}
exports.SwitchToParentWindowCommand = SwitchToParentWindowCommand;
class SwitchToPreviousWindowCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.switchToPreviousWindow);
    }
    _getAssignableProperties() {
        return [];
    }
}
exports.SwitchToPreviousWindowCommand = SwitchToPreviousWindowCommand;
class SetNativeDialogHandlerCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.setNativeDialogHandler);
    }
    _getAssignableProperties() {
        return [
            { name: 'dialogHandler', init: initDialogHandler, required: true }
        ];
    }
}
exports.SetNativeDialogHandlerCommand = SetNativeDialogHandlerCommand;
class GetNativeDialogHistoryCommand {
    constructor() {
        this.type = type_1.default.getNativeDialogHistory;
    }
}
exports.GetNativeDialogHistoryCommand = GetNativeDialogHistoryCommand;
class GetBrowserConsoleMessagesCommand {
    constructor() {
        this.type = type_1.default.getBrowserConsoleMessages;
    }
}
exports.GetBrowserConsoleMessagesCommand = GetBrowserConsoleMessagesCommand;
class SetTestSpeedCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.setTestSpeed);
    }
    _getAssignableProperties() {
        return [
            { name: 'speed', type: argument_1.setSpeedArgument, required: true }
        ];
    }
}
exports.SetTestSpeedCommand = SetTestSpeedCommand;
class SetPageLoadTimeoutCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.setPageLoadTimeout);
    }
    _getAssignableProperties() {
        return [
            { name: 'duration', type: argument_1.positiveIntegerArgument, required: true }
        ];
    }
}
exports.SetPageLoadTimeoutCommand = SetPageLoadTimeoutCommand;
class UseRoleCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.useRole);
    }
    _getAssignableProperties() {
        return [
            { name: 'role', type: argument_1.actionRoleArgument, required: true }
        ];
    }
}
exports.UseRoleCommand = UseRoleCommand;
class RecorderCommand extends base_1.default {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.recorder);
    }
    _getAssignableProperties() {
        return [
            { name: 'subtype', type: argument_1.nonEmptyStringArgument, required: true },
            { name: 'forceExecutionInTopWindowOnly', type: argument_1.booleanArgument, defaultValue: false }
        ];
    }
}
exports.RecorderCommand = RecorderCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90ZXN0LXJ1bi9jb21tYW5kcy9hY3Rpb25zLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQix5R0FBZ0Y7QUFDaEYsNkdBQW1GO0FBQ25GLDJGQUEwRTtBQUMxRSxrREFBaUM7QUFDakMsdUNBTW1CO0FBRW5CLDZEQUE4RTtBQUM5RSxvRUFBK0Q7QUFDL0QsbUNBQXlDO0FBRXpDLHFEQWFnQztBQUVoQyxvREFBaUY7QUFDakYsK0NBQTZEO0FBRzdELGVBQWU7QUFDZixTQUFTLGlCQUFpQixDQUFFLElBQUksRUFBRSxHQUFHO0lBQ2pDLE9BQU8sSUFBSSx1QkFBYSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN4QyxDQUFDO0FBRUQsU0FBUyxnQkFBZ0IsQ0FBRSxJQUFJLEVBQUUsR0FBRztJQUNoQyxPQUFPLElBQUksc0JBQVksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDdkMsQ0FBQztBQUVELFNBQVMsZ0JBQWdCLENBQUUsSUFBSSxFQUFFLEdBQUc7SUFDaEMsT0FBTyxJQUFJLHNCQUFZLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3ZDLENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBRSxJQUFJLEVBQUUsR0FBRztJQUMvQixPQUFPLElBQUkscUJBQVcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDdEMsQ0FBQztBQUVELFNBQVMsd0JBQXdCLENBQUUsSUFBSSxFQUFFLEdBQUc7SUFDeEMsT0FBTyxJQUFJLDhCQUFvQixDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUMvQyxDQUFDO0FBRUQsU0FBUyxpQkFBaUIsQ0FBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUUsbUJBQW1CLEVBQUUsT0FBTyxFQUFFO0lBQ25FLElBQUksRUFBRSxDQUFDO0lBRVAsSUFBSSxz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bGRlciBmcm9tICcuLi8uLi9jbGllbnQtZnVuY3Rpb25zL3NlbGVjdG9ycy9zZWxlY3Rvci1idWlsZGVyJztcbmltcG9ydCBDbGllbnRGdW5jdGlvbkJ1aWxkZXIgZnJvbSAnLi4vLi4vY2xpZW50LWZ1bmN0aW9ucy9jbGllbnQtZnVuY3Rpb24tYnVpbGRlcic7XG5pbXBvcnQgZnVuY3Rpb25CdWlsZGVyU3ltYm9sIGZyb20gJy4uLy4uL2NsaWVudC1mdW5jdGlvbnMvYnVpbGRlci1zeW1ib2wnO1xuaW1wb3J0IENvbW1hbmRCYXNlIGZyb20gJy4vYmFzZSc7XG5pbXBvcnQge1xuICAgIEFjdGlvbk9wdGlvbnMsXG4gICAgQ2xpY2tPcHRpb25zLFxuICAgIE1vdXNlT3B0aW9ucyxcbiAgICBUeXBlT3B0aW9ucyxcbiAgICBEcmFnVG9FbGVtZW50T3B0aW9uc1xufSBmcm9tICcuL29wdGlvbnMnO1xuXG5pbXBvcnQgeyBpbml0U2VsZWN0b3IsIGluaXRVcGxvYWRTZWxlY3RvciB9IGZyb20gJy4vdmFsaWRhdGlvbnMvaW5pdGlhbGl6ZXJzJztcbmltcG9ydCB7IGV4ZWN1dGVKc0V4cHJlc3Npb24gfSBmcm9tICcuLi9leGVjdXRlLWpzLWV4cHJlc3Npb24nO1xuaW1wb3J0IHsgaXNKU0V4cHJlc3Npb24gfSBmcm9tICcuL3V0aWxzJztcblxuaW1wb3J0IHtcbiAgICBhY3Rpb25PcHRpb25zLFxuICAgIGludGVnZXJBcmd1bWVudCxcbiAgICBwb3NpdGl2ZUludGVnZXJBcmd1bWVudCxcbiAgICBzdHJpbmdBcmd1bWVudCxcbiAgICBub25FbXB0eVN0cmluZ0FyZ3VtZW50LFxuICAgIG51bGxhYmxlU3RyaW5nQXJndW1lbnQsXG4gICAgdXJsQXJndW1lbnQsXG4gICAgc3RyaW5nT3JTdHJpbmdBcnJheUFyZ3VtZW50LFxuICAgIHNldFNwZWVkQXJndW1lbnQsXG4gICAgYWN0aW9uUm9sZUFyZ3VtZW50LFxuICAgIGJvb2xlYW5Bcmd1bWVudCxcbiAgICBmdW5jdGlvbkFyZ3VtZW50XG59IGZyb20gJy4vdmFsaWRhdGlvbnMvYXJndW1lbnQnO1xuXG5pbXBvcnQgeyBTZXROYXRpdmVEaWFsb2dIYW5kbGVyQ29kZVdyb25nVHlwZUVycm9yIH0gZnJvbSAnLi4vLi4vZXJyb3JzL3Rlc3QtcnVuJztcbmltcG9ydCB7IEV4ZWN1dGVDbGllbnRGdW5jdGlvbkNvbW1hbmQgfSBmcm9tICcuL29ic2VydmF0aW9uJztcblxuXG4vLyBJbml0aWFsaXplcnNcbmZ1bmN0aW9uIGluaXRBY3Rpb25PcHRpb25zIChuYW1lLCB2YWwpIHtcbiAgICByZXR1cm4gbmV3IEFjdGlvbk9wdGlvbnModmFsLCB0cnVlKTtcbn1cblxuZnVuY3Rpb24gaW5pdENsaWNrT3B0aW9ucyAobmFtZSwgdmFsKSB7XG4gICAgcmV0dXJuIG5ldyBDbGlja09wdGlvbnModmFsLCB0cnVlKTtcbn1cblxuZnVuY3Rpb24gaW5pdE1vdXNlT3B0aW9ucyAobmFtZSwgdmFsKSB7XG4gICAgcmV0dXJuIG5ldyBNb3VzZU9wdGlvbnModmFsLCB0cnVlKTtcbn1cblxuZnVuY3Rpb24gaW5pdFR5cGVPcHRpb25zIChuYW1lLCB2YWwpIHtcbiAgICByZXR1cm4gbmV3IFR5cGVPcHRpb25zKHZhbCwgdHJ1ZSk7XG59XG5cbmZ1bmN0aW9uIGluaXREcmFnVG9FbGVtZW50T3B0aW9ucyAobmFtZSwgdmFsKSB7XG4gICAgcmV0dXJuIG5ldyBEcmFnVG9FbGVtZW50T3B0aW9ucyh2YWwsIHRydWUpO1xufVxuXG5mdW5jdGlvbiBpbml0RGlhbG9nSGFuZGxlciAobmFtZSwgdmFsLCB7IHNraXBWaXNpYmlsaXR5Q2hlY2ssIHRlc3RSdW4gfSkge1xuICAgIGxldCBmbjtcblxuICAgIGlmIChpc0pTRXhwcmVzc2lvbih2YWwpKVxuICAgICAgICBmbiA9IGV4ZWN1dGVKc0V4cHJlc3Npb24odmFsLnZhbHVlLCB0ZXN0UnVuLCB7IHNraXBWaXNpYmlsaXR5Q2hlY2sgfSk7XG4gICAgZWxzZVxuICAgICAgICBmbiA9IHZhbC5mbjtcblxuICAgIGlmIChmbiA9PT0gbnVsbCB8fCBmbiBpbnN0YW5jZW9mIEV4ZWN1dGVDbGllbnRGdW5jdGlvbkNvbW1hbmQpXG4gICAgICAgIHJldHVybiBmbjtcblxuICAgIGNvbnN0IG9wdGlvbnMgICAgICA9IHZhbC5vcHRpb25zO1xuICAgIGNvbnN0IG1ldGhvZE5hbWUgICA9ICdzZXROYXRpdmVEaWFsb2dIYW5kbGVyJztcbiAgICBjb25zdCBmdW5jdGlvblR5cGUgPSB0eXBlb2YgZm47XG5cbiAgICBsZXQgYnVpbGRlciA9IGZuICYmIGZuW2Z1bmN0aW9uQnVpbGRlclN5bWJvbF07XG5cbiAgICBjb25zdCBpc1NlbGVjdG9yICAgICAgID0gYnVpbGRlciBpbnN0YW5jZW9mIFNlbGVjdG9yQnVpbGRlcjtcbiAgICBjb25zdCBpc0NsaWVudEZ1bmN0aW9uID0gYnVpbGRlciBpbnN0YW5jZW9mIENsaWVudEZ1bmN0aW9uQnVpbGRlcjtcblxuICAgIGlmIChmdW5jdGlvblR5cGUgIT09ICdmdW5jdGlvbicgfHwgaXNTZWxlY3RvcilcbiAgICAgICAgdGhyb3cgbmV3IFNldE5hdGl2ZURpYWxvZ0hhbmRsZXJDb2RlV3JvbmdUeXBlRXJyb3IoaXNTZWxlY3RvciA/ICdTZWxlY3RvcicgOiBmdW5jdGlvblR5cGUpO1xuXG4gICAgaWYgKGlzQ2xpZW50RnVuY3Rpb24pXG4gICAgICAgIGJ1aWxkZXIgPSBmbi53aXRoKG9wdGlvbnMpW2Z1bmN0aW9uQnVpbGRlclN5bWJvbF07XG4gICAgZWxzZVxuICAgICAgICBidWlsZGVyID0gbmV3IENsaWVudEZ1bmN0aW9uQnVpbGRlcihmbiwgb3B0aW9ucywgeyBpbnN0YW50aWF0aW9uOiBtZXRob2ROYW1lLCBleGVjdXRpb246IG1ldGhvZE5hbWUgfSk7XG5cbiAgICByZXR1cm4gYnVpbGRlci5nZXRDb21tYW5kKFtdKTtcbn1cblxuLy8gQ29tbWFuZHNcbmV4cG9ydCBjbGFzcyBDbGlja0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1bikge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUuY2xpY2spO1xuICAgIH1cblxuICAgIF9nZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICdzZWxlY3RvcicsIGluaXQ6IGluaXRTZWxlY3RvciwgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ29wdGlvbnMnLCB0eXBlOiBhY3Rpb25PcHRpb25zLCBpbml0OiBpbml0Q2xpY2tPcHRpb25zLCByZXF1aXJlZDogdHJ1ZSB9XG4gICAgICAgIF07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmlnaHRDbGlja0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1bikge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUucmlnaHRDbGljayk7XG4gICAgfVxuXG4gICAgX2dldEFzc2lnbmFibGVQcm9wZXJ0aWVzICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3NlbGVjdG9yJywgaW5pdDogaW5pdFNlbGVjdG9yLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnb3B0aW9ucycsIHR5cGU6IGFjdGlvbk9wdGlvbnMsIGluaXQ6IGluaXRDbGlja09wdGlvbnMsIHJlcXVpcmVkOiB0cnVlIH1cbiAgICAgICAgXTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFeGVjdXRlRXhwcmVzc2lvbkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1bikge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUuZXhlY3V0ZUV4cHJlc3Npb24pO1xuICAgIH1cblxuICAgIF9nZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICdleHByZXNzaW9uJywgdHlwZTogbm9uRW1wdHlTdHJpbmdBcmd1bWVudCwgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ3Jlc3VsdFZhcmlhYmxlTmFtZScsIHR5cGU6IG5vbkVtcHR5U3RyaW5nQXJndW1lbnQsIGRlZmF1bHRWYWx1ZTogbnVsbCB9XG4gICAgICAgIF07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRXhlY3V0ZUFzeW5jRXhwcmVzc2lvbkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1bikge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUuZXhlY3V0ZUFzeW5jRXhwcmVzc2lvbik7XG4gICAgfVxuXG4gICAgX2dldEFzc2lnbmFibGVQcm9wZXJ0aWVzICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgbmFtZTogJ2V4cHJlc3Npb24nLCB0eXBlOiBzdHJpbmdBcmd1bWVudCwgcmVxdWlyZWQ6IHRydWUgfVxuICAgICAgICBdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIERvdWJsZUNsaWNrQ29tbWFuZCBleHRlbmRzIENvbW1hbmRCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5kb3VibGVDbGljayk7XG4gICAgfVxuXG4gICAgX2dldEFzc2lnbmFibGVQcm9wZXJ0aWVzICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3NlbGVjdG9yJywgaW5pdDogaW5pdFNlbGVjdG9yLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnb3B0aW9ucycsIHR5cGU6IGFjdGlvbk9wdGlvbnMsIGluaXQ6IGluaXRDbGlja09wdGlvbnMsIHJlcXVpcmVkOiB0cnVlIH1cbiAgICAgICAgXTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBIb3ZlckNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1bikge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUuaG92ZXIpO1xuICAgIH1cblxuICAgIF9nZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICdzZWxlY3RvcicsIGluaXQ6IGluaXRTZWxlY3RvciwgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ29wdGlvbnMnLCB0eXBlOiBhY3Rpb25PcHRpb25zLCBpbml0OiBpbml0TW91c2VPcHRpb25zLCByZXF1aXJlZDogdHJ1ZSB9XG4gICAgICAgIF07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVHlwZVRleHRDb21tYW5kIGV4dGVuZHMgQ29tbWFuZEJhc2Uge1xuICAgIGNvbnN0cnVjdG9yIChvYmosIHRlc3RSdW4pIHtcbiAgICAgICAgc3VwZXIob2JqLCB0ZXN0UnVuLCBUWVBFLnR5cGVUZXh0KTtcbiAgICB9XG5cbiAgICBfZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyBuYW1lOiAnc2VsZWN0b3InLCBpbml0OiBpbml0U2VsZWN0b3IsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICd0ZXh0JywgdHlwZTogbm9uRW1wdHlTdHJpbmdBcmd1bWVudCwgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ29wdGlvbnMnLCB0eXBlOiBhY3Rpb25PcHRpb25zLCBpbml0OiBpbml0VHlwZU9wdGlvbnMsIHJlcXVpcmVkOiB0cnVlIH1cbiAgICAgICAgXTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBEcmFnQ29tbWFuZCBleHRlbmRzIENvbW1hbmRCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5kcmFnKTtcbiAgICB9XG5cbiAgICBfZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyBuYW1lOiAnc2VsZWN0b3InLCBpbml0OiBpbml0U2VsZWN0b3IsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdkcmFnT2Zmc2V0WCcsIHR5cGU6IGludGVnZXJBcmd1bWVudCwgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2RyYWdPZmZzZXRZJywgdHlwZTogaW50ZWdlckFyZ3VtZW50LCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnb3B0aW9ucycsIHR5cGU6IGFjdGlvbk9wdGlvbnMsIGluaXQ6IGluaXRNb3VzZU9wdGlvbnMsIHJlcXVpcmVkOiB0cnVlIH1cbiAgICAgICAgXTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBEcmFnVG9FbGVtZW50Q29tbWFuZCBleHRlbmRzIENvbW1hbmRCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5kcmFnVG9FbGVtZW50KTtcbiAgICB9XG5cbiAgICBfZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyBuYW1lOiAnc2VsZWN0b3InLCBpbml0OiBpbml0U2VsZWN0b3IsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdkZXN0aW5hdGlvblNlbGVjdG9yJywgaW5pdDogaW5pdFNlbGVjdG9yLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnb3B0aW9ucycsIHR5cGU6IGFjdGlvbk9wdGlvbnMsIGluaXQ6IGluaXREcmFnVG9FbGVtZW50T3B0aW9ucywgcmVxdWlyZWQ6IHRydWUgfVxuICAgICAgICBdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNlbGVjdFRleHRDb21tYW5kIGV4dGVuZHMgQ29tbWFuZEJhc2Uge1xuICAgIGNvbnN0cnVjdG9yIChvYmosIHRlc3RSdW4pIHtcbiAgICAgICAgc3VwZXIob2JqLCB0ZXN0UnVuLCBUWVBFLnNlbGVjdFRleHQpO1xuICAgIH1cblxuICAgIF9nZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICdzZWxlY3RvcicsIGluaXQ6IGluaXRTZWxlY3RvciwgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ3N0YXJ0UG9zJywgdHlwZTogcG9zaXRpdmVJbnRlZ2VyQXJndW1lbnQsIGRlZmF1bHRWYWx1ZTogbnVsbCB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnZW5kUG9zJywgdHlwZTogcG9zaXRpdmVJbnRlZ2VyQXJndW1lbnQsIGRlZmF1bHRWYWx1ZTogbnVsbCB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnb3B0aW9ucycsIHR5cGU6IGFjdGlvbk9wdGlvbnMsIGluaXQ6IGluaXRBY3Rpb25PcHRpb25zLCByZXF1aXJlZDogdHJ1ZSB9XG4gICAgICAgIF07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2VsZWN0RWRpdGFibGVDb250ZW50Q29tbWFuZCBleHRlbmRzIENvbW1hbmRCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5zZWxlY3RFZGl0YWJsZUNvbnRlbnQpO1xuICAgIH1cblxuICAgIF9nZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICdzdGFydFNlbGVjdG9yJywgaW5pdDogaW5pdFNlbGVjdG9yLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnZW5kU2VsZWN0b3InLCBpbml0OiBpbml0U2VsZWN0b3IsIGRlZmF1bHRWYWx1ZTogbnVsbCB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnb3B0aW9ucycsIHR5cGU6IGFjdGlvbk9wdGlvbnMsIGluaXQ6IGluaXRBY3Rpb25PcHRpb25zLCByZXF1aXJlZDogdHJ1ZSB9XG4gICAgICAgIF07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2VsZWN0VGV4dEFyZWFDb250ZW50Q29tbWFuZCBleHRlbmRzIENvbW1hbmRCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5zZWxlY3RUZXh0QXJlYUNvbnRlbnQpO1xuICAgIH1cblxuICAgIF9nZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICdzZWxlY3RvcicsIGluaXQ6IGluaXRTZWxlY3RvciwgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ3N0YXJ0TGluZScsIHR5cGU6IHBvc2l0aXZlSW50ZWdlckFyZ3VtZW50LCBkZWZhdWx0VmFsdWU6IG51bGwgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ3N0YXJ0UG9zJywgdHlwZTogcG9zaXRpdmVJbnRlZ2VyQXJndW1lbnQsIGRlZmF1bHRWYWx1ZTogbnVsbCB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnZW5kTGluZScsIHR5cGU6IHBvc2l0aXZlSW50ZWdlckFyZ3VtZW50LCBkZWZhdWx0VmFsdWU6IG51bGwgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2VuZFBvcycsIHR5cGU6IHBvc2l0aXZlSW50ZWdlckFyZ3VtZW50LCBkZWZhdWx0VmFsdWU6IG51bGwgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ29wdGlvbnMnLCB0eXBlOiBhY3Rpb25PcHRpb25zLCBpbml0OiBpbml0QWN0aW9uT3B0aW9ucywgcmVxdWlyZWQ6IHRydWUgfVxuICAgICAgICBdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFByZXNzS2V5Q29tbWFuZCBleHRlbmRzIENvbW1hbmRCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5wcmVzc0tleSk7XG4gICAgfVxuXG4gICAgX2dldEFzc2lnbmFibGVQcm9wZXJ0aWVzICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgbmFtZTogJ2tleXMnLCB0eXBlOiBub25FbXB0eVN0cmluZ0FyZ3VtZW50LCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnb3B0aW9ucycsIHR5cGU6IGFjdGlvbk9wdGlvbnMsIGluaXQ6IGluaXRBY3Rpb25PcHRpb25zLCByZXF1aXJlZDogdHJ1ZSB9XG4gICAgICAgIF07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgTmF2aWdhdGVUb0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1bikge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUubmF2aWdhdGVUbyk7XG4gICAgfVxuXG4gICAgX2dldEFzc2lnbmFibGVQcm9wZXJ0aWVzICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3VybCcsIHR5cGU6IHVybEFyZ3VtZW50LCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnc3RhdGVTbmFwc2hvdCcsIHR5cGU6IG51bGxhYmxlU3RyaW5nQXJndW1lbnQsIGRlZmF1bHRWYWx1ZTogbnVsbCB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnZm9yY2VSZWxvYWQnLCB0eXBlOiBib29sZWFuQXJndW1lbnQsIGRlZmF1bHRWYWx1ZTogZmFsc2UgfVxuICAgICAgICBdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNldEZpbGVzVG9VcGxvYWRDb21tYW5kIGV4dGVuZHMgQ29tbWFuZEJhc2Uge1xuICAgIGNvbnN0cnVjdG9yIChvYmosIHRlc3RSdW4pIHtcbiAgICAgICAgc3VwZXIob2JqLCB0ZXN0UnVuLCBUWVBFLnNldEZpbGVzVG9VcGxvYWQpO1xuICAgIH1cblxuICAgIF9nZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICdzZWxlY3RvcicsIGluaXQ6IGluaXRVcGxvYWRTZWxlY3RvciwgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2ZpbGVQYXRoJywgdHlwZTogc3RyaW5nT3JTdHJpbmdBcnJheUFyZ3VtZW50LCByZXF1aXJlZDogdHJ1ZSB9XG4gICAgICAgIF07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ2xlYXJVcGxvYWRDb21tYW5kIGV4dGVuZHMgQ29tbWFuZEJhc2Uge1xuICAgIGNvbnN0cnVjdG9yIChvYmosIHRlc3RSdW4pIHtcbiAgICAgICAgc3VwZXIob2JqLCB0ZXN0UnVuLCBUWVBFLmNsZWFyVXBsb2FkKTtcbiAgICB9XG5cbiAgICBfZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyBuYW1lOiAnc2VsZWN0b3InLCBpbml0OiBpbml0VXBsb2FkU2VsZWN0b3IsIHJlcXVpcmVkOiB0cnVlIH1cbiAgICAgICAgXTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTd2l0Y2hUb0lmcmFtZUNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1bikge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUuc3dpdGNoVG9JZnJhbWUpO1xuICAgIH1cblxuICAgIF9nZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICdzZWxlY3RvcicsIGluaXQ6IGluaXRTZWxlY3RvciwgcmVxdWlyZWQ6IHRydWUgfVxuICAgICAgICBdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFN3aXRjaFRvTWFpbldpbmRvd0NvbW1hbmQge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgdGhpcy50eXBlID0gVFlQRS5zd2l0Y2hUb01haW5XaW5kb3c7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgT3BlbldpbmRvd0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1bikge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUub3BlbldpbmRvdyk7XG4gICAgfVxuXG4gICAgX2dldEFzc2lnbmFibGVQcm9wZXJ0aWVzICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3VybCcsIHR5cGU6IHVybEFyZ3VtZW50IH0sXG4gICAgICAgIF07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ2xvc2VXaW5kb3dDb21tYW5kIGV4dGVuZHMgQ29tbWFuZEJhc2Uge1xuICAgIGNvbnN0cnVjdG9yIChvYmosIHRlc3RSdW4pIHtcbiAgICAgICAgc3VwZXIob2JqLCB0ZXN0UnVuLCBUWVBFLmNsb3NlV2luZG93KTtcbiAgICB9XG5cbiAgICBfZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyBuYW1lOiAnd2luZG93SWQnLCB0eXBlOiBudWxsYWJsZVN0cmluZ0FyZ3VtZW50LCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICBdO1xuICAgIH1cbn1cblxuXG5leHBvcnQgY2xhc3MgR2V0Q3VycmVudFdpbmRvd0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1bikge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUuZ2V0Q3VycmVudFdpbmRvdyk7XG4gICAgfVxuXG4gICAgX2dldEFzc2lnbmFibGVQcm9wZXJ0aWVzICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgXTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBHZXRDdXJyZW50V2luZG93c0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1bikge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUuZ2V0Q3VycmVudFdpbmRvd3MpO1xuICAgIH1cblxuICAgIF9nZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgIF07XG4gICAgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBTd2l0Y2hUb1dpbmRvd0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1bikge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUuc3dpdGNoVG9XaW5kb3cpO1xuICAgIH1cblxuICAgIF9nZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICd3aW5kb3dJZCcsIHR5cGU6IG5vbkVtcHR5U3RyaW5nQXJndW1lbnQsIHJlcXVpcmVkOiB0cnVlIH1cbiAgICAgICAgXTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTd2l0Y2hUb1dpbmRvd0J5UHJlZGljYXRlQ29tbWFuZCBleHRlbmRzIENvbW1hbmRCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5zd2l0Y2hUb1dpbmRvd0J5UHJlZGljYXRlKTtcbiAgICB9XG5cbiAgICBfZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyBuYW1lOiAnZmluZFdpbmRvdycsIHR5cGU6IGZ1bmN0aW9uQXJndW1lbnQsIHJlcXVpcmVkOiB0cnVlIH1cbiAgICAgICAgXTtcbiAgICB9XG59XG5cblxuZXhwb3J0IGNsYXNzIFN3aXRjaFRvUGFyZW50V2luZG93Q29tbWFuZCBleHRlbmRzIENvbW1hbmRCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5zd2l0Y2hUb1BhcmVudFdpbmRvdyk7XG4gICAgfVxuXG4gICAgX2dldEFzc2lnbmFibGVQcm9wZXJ0aWVzICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgXTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTd2l0Y2hUb1ByZXZpb3VzV2luZG93Q29tbWFuZCBleHRlbmRzIENvbW1hbmRCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5zd2l0Y2hUb1ByZXZpb3VzV2luZG93KTtcbiAgICB9XG5cbiAgICBfZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2V0TmF0aXZlRGlhbG9nSGFuZGxlckNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1bikge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUuc2V0TmF0aXZlRGlhbG9nSGFuZGxlcik7XG4gICAgfVxuXG4gICAgX2dldEFzc2lnbmFibGVQcm9wZXJ0aWVzICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgbmFtZTogJ2RpYWxvZ0hhbmRsZXInLCBpbml0OiBpbml0RGlhbG9nSGFuZGxlciwgcmVxdWlyZWQ6IHRydWUgfVxuICAgICAgICBdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEdldE5hdGl2ZURpYWxvZ0hpc3RvcnlDb21tYW5kIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHRoaXMudHlwZSA9IFRZUEUuZ2V0TmF0aXZlRGlhbG9nSGlzdG9yeTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBHZXRCcm93c2VyQ29uc29sZU1lc3NhZ2VzQ29tbWFuZCB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICB0aGlzLnR5cGUgPSBUWVBFLmdldEJyb3dzZXJDb25zb2xlTWVzc2FnZXM7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2V0VGVzdFNwZWVkQ29tbWFuZCBleHRlbmRzIENvbW1hbmRCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5zZXRUZXN0U3BlZWQpO1xuICAgIH1cblxuICAgIF9nZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICdzcGVlZCcsIHR5cGU6IHNldFNwZWVkQXJndW1lbnQsIHJlcXVpcmVkOiB0cnVlIH1cbiAgICAgICAgXTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTZXRQYWdlTG9hZFRpbWVvdXRDb21tYW5kIGV4dGVuZHMgQ29tbWFuZEJhc2Uge1xuICAgIGNvbnN0cnVjdG9yIChvYmosIHRlc3RSdW4pIHtcbiAgICAgICAgc3VwZXIob2JqLCB0ZXN0UnVuLCBUWVBFLnNldFBhZ2VMb2FkVGltZW91dCk7XG4gICAgfVxuXG4gICAgX2dldEFzc2lnbmFibGVQcm9wZXJ0aWVzICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgbmFtZTogJ2R1cmF0aW9uJywgdHlwZTogcG9zaXRpdmVJbnRlZ2VyQXJndW1lbnQsIHJlcXVpcmVkOiB0cnVlIH1cbiAgICAgICAgXTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBVc2VSb2xlQ29tbWFuZCBleHRlbmRzIENvbW1hbmRCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS51c2VSb2xlKTtcbiAgICB9XG5cbiAgICBfZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyBuYW1lOiAncm9sZScsIHR5cGU6IGFjdGlvblJvbGVBcmd1bWVudCwgcmVxdWlyZWQ6IHRydWUgfVxuICAgICAgICBdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJlY29yZGVyQ29tbWFuZCBleHRlbmRzIENvbW1hbmRCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5yZWNvcmRlcik7XG4gICAgfVxuXG4gICAgX2dldEFzc2lnbmFibGVQcm9wZXJ0aWVzICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3N1YnR5cGUnLCB0eXBlOiBub25FbXB0eVN0cmluZ0FyZ3VtZW50LCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnZm9yY2VFeGVjdXRpb25JblRvcFdpbmRvd09ubHknLCB0eXBlOiBib29sZWFuQXJndW1lbnQsIGRlZmF1bHRWYWx1ZTogZmFsc2UgfVxuICAgICAgICBdO1xuICAgIH1cbn1cbiJdfQ==