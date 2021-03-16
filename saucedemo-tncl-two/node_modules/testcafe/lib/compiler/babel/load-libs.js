"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const exportble_lib_path_1 = __importDefault(require("../test-file/exportble-lib-path"));
function getPresetEnvForTestCodeOpts() {
    return {
        targets: { node: 'current' },
        loose: true,
        exclude: ['transform-regenerator']
    };
}
function getPresetEnvForClientFunctionOpts() {
    return {
        loose: true,
        exclude: ['transform-typeof-symbol', 'transform-for-of']
    };
}
function getModuleResolverOpts() {
    return {
        resolvePath(source) {
            if (source === 'testcafe')
                return exportble_lib_path_1.default;
            return source;
        }
    };
}
function getTransformForOfOptions() {
    // NOTE: allowArrayLike is required to allow iterating non-iterable objects (e.g. NodeList)
    // to preserve compatibility with older TestCafe code
    return { loose: true, allowArrayLike: true };
}
function getTransformRuntimeOpts() {
    // NOTE: We are forced to import helpers to each compiled file
    // because of '@babel/plugin-transform-runtime' plugin cannot correctly resolve path
    // to the helpers from the '@babel/runtime' module.
    return {
        'helpers': false
    };
}
function getPresetReact() {
    const presetReact = require('@babel/preset-react');
    presetReact.presets = []; // disables flow so it doesn't confict w/ presetFlow
    return presetReact;
}
// NOTE: lazy load heavy dependencies
function loadLibs() {
    return {
        babel: require('@babel/core'),
        presetStage2: require('./preset-stage-2'),
        presetFlow: require('@babel/preset-flow'),
        transformRuntime: [require('@babel/plugin-transform-runtime'), getTransformRuntimeOpts()],
        transformForOfAsArray: [require('@babel/plugin-transform-for-of'), getTransformForOfOptions()],
        presetEnvForClientFunction: [require('@babel/preset-env'), getPresetEnvForClientFunctionOpts()],
        presetEnvForTestCode: [require('@babel/preset-env'), getPresetEnvForTestCodeOpts()],
        moduleResolver: [require('babel-plugin-module-resolver'), getModuleResolverOpts()],
        presetReact: getPresetReact()
    };
}
exports.default = loadLibs;
module.exports = exports.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZC1saWJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvbXBpbGVyL2JhYmVsL2xvYWQtbGlicy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLHlGQUFrRTtBQUVsRSxTQUFTLDJCQUEyQjtJQUNoQyxPQUFPO1FBQ0gsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTtRQUM1QixLQUFLLEVBQUksSUFBSTtRQUNiLE9BQU8sRUFBRSxDQUFDLHVCQUF1QixDQUFDO0tBQ3JDLENBQUM7QUFDTixDQUFDO0FBRUQsU0FBUyxpQ0FBaUM7SUFDdEMsT0FBTztRQUNILEtBQUssRUFBSSxJQUFJO1FBQ2IsT0FBTyxFQUFFLENBQUMseUJBQXlCLEVBQUUsa0JBQWtCLENBQUM7S0FDM0QsQ0FBQztBQUNOLENBQUM7QUFFRCxTQUFTLHFCQUFxQjtJQUMxQixPQUFPO1FBQ0gsV0FBVyxDQUFFLE1BQU07WUFDZixJQUFJLE1BQU0sS0FBSyxVQUFVO2dCQUNyQixPQUFPLDRCQUFtQixDQUFDO1lBRS9CLE9BQU8sTUFBTSxDQUFDO1FBQ2xCLENBQUM7S0FDSixDQUFDO0FBQ04sQ0FBQztBQUVELFNBQVMsd0JBQXdCO0lBQzdCLDJGQUEyRjtJQUMzRixxREFBcUQ7SUFDckQsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxDQUFDO0FBQ2pELENBQUM7QUFFRCxTQUFTLHVCQUF1QjtJQUM1Qiw4REFBOEQ7SUFDOUQsb0ZBQW9GO0lBQ3BGLG1EQUFtRDtJQUNuRCxPQUFPO1FBQ0gsU0FBUyxFQUFFLEtBQUs7S0FDbkIsQ0FBQztBQUNOLENBQUM7QUFFRCxTQUFTLGNBQWM7SUFDbkIsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7SUFFbkQsV0FBVyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsQ0FBQyxvREFBb0Q7SUFFOUUsT0FBTyxXQUFXLENBQUM7QUFDdkIsQ0FBQztBQUVELHFDQUFxQztBQUNyQyxTQUF3QixRQUFRO0lBQzVCLE9BQU87UUFDSCxLQUFLLEVBQXVCLE9BQU8sQ0FBQyxhQUFhLENBQUM7UUFDbEQsWUFBWSxFQUFnQixPQUFPLENBQUMsa0JBQWtCLENBQUM7UUFDdkQsVUFBVSxFQUFrQixPQUFPLENBQUMsb0JBQW9CLENBQUM7UUFDekQsZ0JBQWdCLEVBQVksQ0FBQyxPQUFPLENBQUMsaUNBQWlDLENBQUMsRUFBRSx1QkFBdUIsRUFBRSxDQUFDO1FBQ25HLHFCQUFxQixFQUFPLENBQUMsT0FBTyxDQUFDLGdDQUFnQyxDQUFDLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQztRQUNuRywwQkFBMEIsRUFBRSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLGlDQUFpQyxFQUFFLENBQUM7UUFDL0Ysb0JBQW9CLEVBQVEsQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsRUFBRSwyQkFBMkIsRUFBRSxDQUFDO1FBQ3pGLGNBQWMsRUFBYyxDQUFDLE9BQU8sQ0FBQyw4QkFBOEIsQ0FBQyxFQUFFLHFCQUFxQixFQUFFLENBQUM7UUFDOUYsV0FBVyxFQUFpQixjQUFjLEVBQUU7S0FDL0MsQ0FBQztBQUNOLENBQUM7QUFaRCwyQkFZQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBFWFBPUlRBQkxFX0xJQl9QQVRIIGZyb20gJy4uL3Rlc3QtZmlsZS9leHBvcnRibGUtbGliLXBhdGgnO1xuXG5mdW5jdGlvbiBnZXRQcmVzZXRFbnZGb3JUZXN0Q29kZU9wdHMgKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHRhcmdldHM6IHsgbm9kZTogJ2N1cnJlbnQnIH0sXG4gICAgICAgIGxvb3NlOiAgIHRydWUsXG4gICAgICAgIGV4Y2x1ZGU6IFsndHJhbnNmb3JtLXJlZ2VuZXJhdG9yJ11cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBnZXRQcmVzZXRFbnZGb3JDbGllbnRGdW5jdGlvbk9wdHMgKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGxvb3NlOiAgIHRydWUsXG4gICAgICAgIGV4Y2x1ZGU6IFsndHJhbnNmb3JtLXR5cGVvZi1zeW1ib2wnLCAndHJhbnNmb3JtLWZvci1vZiddXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0TW9kdWxlUmVzb2x2ZXJPcHRzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXNvbHZlUGF0aCAoc291cmNlKSB7XG4gICAgICAgICAgICBpZiAoc291cmNlID09PSAndGVzdGNhZmUnKVxuICAgICAgICAgICAgICAgIHJldHVybiBFWFBPUlRBQkxFX0xJQl9QQVRIO1xuXG4gICAgICAgICAgICByZXR1cm4gc291cmNlO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0VHJhbnNmb3JtRm9yT2ZPcHRpb25zICgpIHtcbiAgICAvLyBOT1RFOiBhbGxvd0FycmF5TGlrZSBpcyByZXF1aXJlZCB0byBhbGxvdyBpdGVyYXRpbmcgbm9uLWl0ZXJhYmxlIG9iamVjdHMgKGUuZy4gTm9kZUxpc3QpXG4gICAgLy8gdG8gcHJlc2VydmUgY29tcGF0aWJpbGl0eSB3aXRoIG9sZGVyIFRlc3RDYWZlIGNvZGVcbiAgICByZXR1cm4geyBsb29zZTogdHJ1ZSwgYWxsb3dBcnJheUxpa2U6IHRydWUgfTtcbn1cblxuZnVuY3Rpb24gZ2V0VHJhbnNmb3JtUnVudGltZU9wdHMgKCkge1xuICAgIC8vIE5PVEU6IFdlIGFyZSBmb3JjZWQgdG8gaW1wb3J0IGhlbHBlcnMgdG8gZWFjaCBjb21waWxlZCBmaWxlXG4gICAgLy8gYmVjYXVzZSBvZiAnQGJhYmVsL3BsdWdpbi10cmFuc2Zvcm0tcnVudGltZScgcGx1Z2luIGNhbm5vdCBjb3JyZWN0bHkgcmVzb2x2ZSBwYXRoXG4gICAgLy8gdG8gdGhlIGhlbHBlcnMgZnJvbSB0aGUgJ0BiYWJlbC9ydW50aW1lJyBtb2R1bGUuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgJ2hlbHBlcnMnOiBmYWxzZVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGdldFByZXNldFJlYWN0ICgpIHtcbiAgICBjb25zdCBwcmVzZXRSZWFjdCA9IHJlcXVpcmUoJ0BiYWJlbC9wcmVzZXQtcmVhY3QnKTtcblxuICAgIHByZXNldFJlYWN0LnByZXNldHMgPSBbXTsgLy8gZGlzYWJsZXMgZmxvdyBzbyBpdCBkb2Vzbid0IGNvbmZpY3Qgdy8gcHJlc2V0Rmxvd1xuXG4gICAgcmV0dXJuIHByZXNldFJlYWN0O1xufVxuXG4vLyBOT1RFOiBsYXp5IGxvYWQgaGVhdnkgZGVwZW5kZW5jaWVzXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBsb2FkTGlicyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgYmFiZWw6ICAgICAgICAgICAgICAgICAgICAgIHJlcXVpcmUoJ0BiYWJlbC9jb3JlJyksXG4gICAgICAgIHByZXNldFN0YWdlMjogICAgICAgICAgICAgICByZXF1aXJlKCcuL3ByZXNldC1zdGFnZS0yJyksXG4gICAgICAgIHByZXNldEZsb3c6ICAgICAgICAgICAgICAgICByZXF1aXJlKCdAYmFiZWwvcHJlc2V0LWZsb3cnKSxcbiAgICAgICAgdHJhbnNmb3JtUnVudGltZTogICAgICAgICAgIFtyZXF1aXJlKCdAYmFiZWwvcGx1Z2luLXRyYW5zZm9ybS1ydW50aW1lJyksIGdldFRyYW5zZm9ybVJ1bnRpbWVPcHRzKCldLFxuICAgICAgICB0cmFuc2Zvcm1Gb3JPZkFzQXJyYXk6ICAgICAgW3JlcXVpcmUoJ0BiYWJlbC9wbHVnaW4tdHJhbnNmb3JtLWZvci1vZicpLCBnZXRUcmFuc2Zvcm1Gb3JPZk9wdGlvbnMoKV0sXG4gICAgICAgIHByZXNldEVudkZvckNsaWVudEZ1bmN0aW9uOiBbcmVxdWlyZSgnQGJhYmVsL3ByZXNldC1lbnYnKSwgZ2V0UHJlc2V0RW52Rm9yQ2xpZW50RnVuY3Rpb25PcHRzKCldLFxuICAgICAgICBwcmVzZXRFbnZGb3JUZXN0Q29kZTogICAgICAgW3JlcXVpcmUoJ0BiYWJlbC9wcmVzZXQtZW52JyksIGdldFByZXNldEVudkZvclRlc3RDb2RlT3B0cygpXSxcbiAgICAgICAgbW9kdWxlUmVzb2x2ZXI6ICAgICAgICAgICAgIFtyZXF1aXJlKCdiYWJlbC1wbHVnaW4tbW9kdWxlLXJlc29sdmVyJyksIGdldE1vZHVsZVJlc29sdmVyT3B0cygpXSxcbiAgICAgICAgcHJlc2V0UmVhY3Q6ICAgICAgICAgICAgICAgIGdldFByZXNldFJlYWN0KClcbiAgICB9O1xufVxuIl19