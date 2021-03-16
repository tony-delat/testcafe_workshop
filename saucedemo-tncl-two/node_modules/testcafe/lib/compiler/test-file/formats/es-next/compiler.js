"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const load_libs_1 = __importDefault(require("../../../babel/load-libs"));
const api_based_1 = __importDefault(require("../../api-based"));
const is_flow_code_1 = __importDefault(require("./is-flow-code"));
const get_base_babel_options_1 = __importDefault(require("../../../babel/get-base-babel-options"));
class ESNextTestFileCompiler extends api_based_1.default {
    static getBabelOptions(filename, code) {
        const { presetStage2, presetFlow, transformRuntime, presetEnvForTestCode, presetReact, moduleResolver } = load_libs_1.default();
        const opts = Object.assign({}, get_base_babel_options_1.default, {
            presets: [presetStage2, presetEnvForTestCode, presetReact],
            plugins: [transformRuntime, moduleResolver],
            sourceMaps: 'inline',
            filename
        });
        if (is_flow_code_1.default(code))
            opts.presets.push(presetFlow);
        return opts;
    }
    _compileCode(code, filename) {
        const { babel } = load_libs_1.default();
        if (this.cache[filename])
            return this.cache[filename];
        const opts = ESNextTestFileCompiler.getBabelOptions(filename, code);
        const compiled = babel.transform(code, opts);
        this.cache[filename] = compiled.code;
        return compiled.code;
    }
    _getRequireCompilers() {
        return {
            '.js': (code, filename) => this._compileCode(code, filename),
            '.jsx': (code, filename) => this._compileCode(code, filename),
        };
    }
    getSupportedExtension() {
        return ['.js', '.jsx'];
    }
}
exports.default = ESNextTestFileCompiler;
module.exports = exports.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY29tcGlsZXIvdGVzdC1maWxlL2Zvcm1hdHMvZXMtbmV4dC9jb21waWxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLHlFQUFxRDtBQUNyRCxnRUFBMkQ7QUFDM0Qsa0VBQXdDO0FBQ3hDLG1HQUF1RTtBQUV2RSxNQUFxQixzQkFBdUIsU0FBUSxtQkFBNEI7SUFDNUUsTUFBTSxDQUFDLGVBQWUsQ0FBRSxRQUFRLEVBQUUsSUFBSTtRQUNsQyxNQUFNLEVBQ0YsWUFBWSxFQUNaLFVBQVUsRUFDVixnQkFBZ0IsRUFDaEIsb0JBQW9CLEVBQ3BCLFdBQVcsRUFDWCxjQUFjLEVBQ2pCLEdBQUcsbUJBQWEsRUFBRSxDQUFDO1FBRXBCLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLGdDQUFrQixFQUFFO1lBQy9DLE9BQU8sRUFBSyxDQUFDLFlBQVksRUFBRSxvQkFBb0IsRUFBRSxXQUFXLENBQUM7WUFDN0QsT0FBTyxFQUFLLENBQUMsZ0JBQWdCLEVBQUUsY0FBYyxDQUFDO1lBQzlDLFVBQVUsRUFBRSxRQUFRO1lBQ3BCLFFBQVE7U0FDWCxDQUFDLENBQUM7UUFFSCxJQUFJLHNCQUFVLENBQUMsSUFBSSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRWxDLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxZQUFZLENBQUUsSUFBSSxFQUFFLFFBQVE7UUFDeEIsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLG1CQUFhLEVBQUUsQ0FBQztRQUVsQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVoQyxNQUFNLElBQUksR0FBTyxzQkFBc0IsQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3hFLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTdDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQztRQUVyQyxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUM7SUFDekIsQ0FBQztJQUVELG9CQUFvQjtRQUNoQixPQUFPO1lBQ0gsS0FBSyxFQUFHLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDO1lBQzdELE1BQU0sRUFBRSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQztTQUNoRSxDQUFDO0lBQ04sQ0FBQztJQUVELHFCQUFxQjtRQUNqQixPQUFPLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzNCLENBQUM7Q0FDSjtBQWhERCx5Q0FnREMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbG9hZEJhYmVsTGlicyBmcm9tICcuLi8uLi8uLi9iYWJlbC9sb2FkLWxpYnMnO1xuaW1wb3J0IEFQSUJhc2VkVGVzdEZpbGVDb21waWxlckJhc2UgZnJvbSAnLi4vLi4vYXBpLWJhc2VkJztcbmltcG9ydCBpc0Zsb3dDb2RlIGZyb20gJy4vaXMtZmxvdy1jb2RlJztcbmltcG9ydCBCQVNFX0JBQkVMX09QVElPTlMgZnJvbSAnLi4vLi4vLi4vYmFiZWwvZ2V0LWJhc2UtYmFiZWwtb3B0aW9ucyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEVTTmV4dFRlc3RGaWxlQ29tcGlsZXIgZXh0ZW5kcyBBUElCYXNlZFRlc3RGaWxlQ29tcGlsZXJCYXNlIHtcbiAgICBzdGF0aWMgZ2V0QmFiZWxPcHRpb25zIChmaWxlbmFtZSwgY29kZSkge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBwcmVzZXRTdGFnZTIsXG4gICAgICAgICAgICBwcmVzZXRGbG93LFxuICAgICAgICAgICAgdHJhbnNmb3JtUnVudGltZSxcbiAgICAgICAgICAgIHByZXNldEVudkZvclRlc3RDb2RlLFxuICAgICAgICAgICAgcHJlc2V0UmVhY3QsXG4gICAgICAgICAgICBtb2R1bGVSZXNvbHZlclxuICAgICAgICB9ID0gbG9hZEJhYmVsTGlicygpO1xuXG4gICAgICAgIGNvbnN0IG9wdHMgPSBPYmplY3QuYXNzaWduKHt9LCBCQVNFX0JBQkVMX09QVElPTlMsIHtcbiAgICAgICAgICAgIHByZXNldHM6ICAgIFtwcmVzZXRTdGFnZTIsIHByZXNldEVudkZvclRlc3RDb2RlLCBwcmVzZXRSZWFjdF0sXG4gICAgICAgICAgICBwbHVnaW5zOiAgICBbdHJhbnNmb3JtUnVudGltZSwgbW9kdWxlUmVzb2x2ZXJdLFxuICAgICAgICAgICAgc291cmNlTWFwczogJ2lubGluZScsXG4gICAgICAgICAgICBmaWxlbmFtZVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoaXNGbG93Q29kZShjb2RlKSlcbiAgICAgICAgICAgIG9wdHMucHJlc2V0cy5wdXNoKHByZXNldEZsb3cpO1xuXG4gICAgICAgIHJldHVybiBvcHRzO1xuICAgIH1cblxuICAgIF9jb21waWxlQ29kZSAoY29kZSwgZmlsZW5hbWUpIHtcbiAgICAgICAgY29uc3QgeyBiYWJlbCB9ID0gbG9hZEJhYmVsTGlicygpO1xuXG4gICAgICAgIGlmICh0aGlzLmNhY2hlW2ZpbGVuYW1lXSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNhY2hlW2ZpbGVuYW1lXTtcblxuICAgICAgICBjb25zdCBvcHRzICAgICA9IEVTTmV4dFRlc3RGaWxlQ29tcGlsZXIuZ2V0QmFiZWxPcHRpb25zKGZpbGVuYW1lLCBjb2RlKTtcbiAgICAgICAgY29uc3QgY29tcGlsZWQgPSBiYWJlbC50cmFuc2Zvcm0oY29kZSwgb3B0cyk7XG5cbiAgICAgICAgdGhpcy5jYWNoZVtmaWxlbmFtZV0gPSBjb21waWxlZC5jb2RlO1xuXG4gICAgICAgIHJldHVybiBjb21waWxlZC5jb2RlO1xuICAgIH1cblxuICAgIF9nZXRSZXF1aXJlQ29tcGlsZXJzICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICcuanMnOiAgKGNvZGUsIGZpbGVuYW1lKSA9PiB0aGlzLl9jb21waWxlQ29kZShjb2RlLCBmaWxlbmFtZSksXG4gICAgICAgICAgICAnLmpzeCc6IChjb2RlLCBmaWxlbmFtZSkgPT4gdGhpcy5fY29tcGlsZUNvZGUoY29kZSwgZmlsZW5hbWUpLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGdldFN1cHBvcnRlZEV4dGVuc2lvbiAoKSB7XG4gICAgICAgIHJldHVybiBbJy5qcycsICcuanN4J107XG4gICAgfVxufVxuIl19