"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const dedent_1 = __importDefault(require("dedent"));
const client_function_builder_1 = __importDefault(require("../client-function-builder"));
const replicator_1 = require("../replicator");
const runtime_1 = require("../../errors/runtime");
const builder_symbol_1 = __importDefault(require("../builder-symbol"));
const types_1 = require("../../errors/types");
const type_assertions_1 = require("../../errors/runtime/type-assertions");
const observation_1 = require("../../test-run/commands/observation");
const define_lazy_property_1 = __importDefault(require("../../utils/define-lazy-property"));
const add_api_1 = require("./add-api");
const create_snapshot_methods_1 = __importDefault(require("./create-snapshot-methods"));
const prepare_api_args_1 = __importDefault(require("./prepare-api-args"));
const return_single_prop_mode_1 = __importDefault(require("../return-single-prop-mode"));
class SelectorBuilder extends client_function_builder_1.default {
    constructor(fn, options, callsiteNames) {
        const apiFn = options && options.apiFn;
        const apiFnID = options && options.apiFnID;
        const builderFromSelector = fn && fn[builder_symbol_1.default];
        const builderFromPromiseOrSnapshot = fn && fn.selector && fn.selector[builder_symbol_1.default];
        let builder = builderFromSelector || builderFromPromiseOrSnapshot;
        builder = builder instanceof SelectorBuilder ? builder : null;
        if (builder) {
            fn = builder.fn;
            if (options === void 0 || typeof options === 'object')
                options = lodash_1.merge({}, builder.options, options, { sourceSelectorBuilder: builder });
        }
        super(fn, options, callsiteNames);
        if (!this.options.apiFnChain) {
            const fnType = typeof this.fn;
            let item = fnType === 'string' ? `'${this.fn}'` : `[${fnType}]`;
            item = `Selector(${item})`;
            this.options.apiFn = item;
            this.options.apiFnChain = [item];
        }
        if (apiFn)
            this.options.apiFnChain.push(apiFn);
        this.options.apiFnID = typeof apiFnID === 'number' ? apiFnID : this.options.apiFnChain.length - 1;
    }
    _getCompiledFnCode() {
        // OPTIMIZATION: if selector was produced from another selector and
        // it has same dependencies as source selector, then we can
        // avoid recompilation and just re-use already compiled code.
        const hasSameDependenciesAsSourceSelector = this.options.sourceSelectorBuilder &&
            this.options.sourceSelectorBuilder.options.dependencies ===
                this.options.dependencies;
        if (hasSameDependenciesAsSourceSelector)
            return this.options.sourceSelectorBuilder.compiledFnCode;
        const code = typeof this.fn === 'string' ?
            `(function(){return document.querySelectorAll(${JSON.stringify(this.fn)});});` :
            super._getCompiledFnCode();
        if (code) {
            return dedent_1.default(`(function(){
                    var __f$=${code};
                    return function(){
                        var args           = __dependencies$.boundArgs || arguments;
                        var selectorFilter = window['%testCafeSelectorFilter%'];

                        var nodes = __f$.apply(this, args);
                        nodes     = selectorFilter.cast(nodes);

                        if (!nodes.length && !selectorFilter.error)
                            selectorFilter.error = __dependencies$.apiInfo.apiFnID;

                        return selectorFilter.filter(nodes, __dependencies$.filterOptions, __dependencies$.apiInfo);
                    };
                 })();`);
        }
        return null;
    }
    _createInvalidFnTypeError() {
        return new runtime_1.ClientFunctionAPIError(this.callsiteNames.instantiation, this.callsiteNames.instantiation, types_1.RUNTIME_ERRORS.selectorInitializedWithWrongType, typeof this.fn);
    }
    _executeCommand(args, testRun, callsite) {
        const resultPromise = super._executeCommand(args, testRun, callsite);
        this._addBoundArgsSelectorGetter(resultPromise, args);
        // OPTIMIZATION: use buffer function as selector not to trigger lazy property ahead of time
        add_api_1.addAPI(resultPromise, () => resultPromise.selector, SelectorBuilder, this.options.customDOMProperties, this.options.customMethods);
        return resultPromise;
    }
    _getSourceSelectorBuilderApiFnID() {
        let selectorAncestor = this;
        while (selectorAncestor.options.sourceSelectorBuilder)
            selectorAncestor = selectorAncestor.options.sourceSelectorBuilder;
        return selectorAncestor.options.apiFnID;
    }
    getFunctionDependencies() {
        const dependencies = super.getFunctionDependencies();
        const { filterVisible, filterHidden, counterMode, collectionMode, getVisibleValueMode, index, customDOMProperties, customMethods, apiFnChain, boundArgs } = this.options;
        return lodash_1.merge({}, dependencies, {
            filterOptions: {
                filterVisible,
                filterHidden,
                counterMode,
                collectionMode,
                index: lodash_1.isNil(index) ? null : index,
                getVisibleValueMode
            },
            apiInfo: {
                apiFnChain,
                apiFnID: this._getSourceSelectorBuilderApiFnID()
            },
            boundArgs,
            customDOMProperties,
            customMethods
        });
    }
    _createTestRunCommand(encodedArgs, encodedDependencies) {
        return new observation_1.ExecuteSelectorCommand({
            instantiationCallsiteName: this.callsiteNames.instantiation,
            fnCode: this.compiledFnCode,
            args: encodedArgs,
            dependencies: encodedDependencies,
            needError: this.options.needError,
            apiFnChain: this.options.apiFnChain,
            visibilityCheck: !!this.options.visibilityCheck,
            timeout: this.options.timeout
        });
    }
    _validateOptions(options) {
        super._validateOptions(options);
        if (!lodash_1.isNil(options.visibilityCheck))
            type_assertions_1.assertType(type_assertions_1.is.boolean, this.callsiteNames.instantiation, '"visibilityCheck" option', options.visibilityCheck);
        if (!lodash_1.isNil(options.timeout))
            type_assertions_1.assertType(type_assertions_1.is.nonNegativeNumber, this.callsiteNames.instantiation, '"timeout" option', options.timeout);
    }
    _getReplicatorTransforms() {
        const transforms = super._getReplicatorTransforms();
        transforms.push(new replicator_1.SelectorNodeTransform());
        return transforms;
    }
    _addBoundArgsSelectorGetter(obj, selectorArgs) {
        define_lazy_property_1.default(obj, 'selector', () => {
            const builder = new SelectorBuilder(this.getFunction(), { boundArgs: selectorArgs });
            return builder.getFunction();
        });
    }
    _decorateFunction(selectorFn) {
        super._decorateFunction(selectorFn);
        add_api_1.addAPI(selectorFn, () => selectorFn, SelectorBuilder, this.options.customDOMProperties, this.options.customMethods, this._getTestRun() ? this._getTestRun().observedCallsites : null);
    }
    _getClientFnWithOverriddenOptions(options) {
        const apiFn = prepare_api_args_1.default('with', options);
        const previousSelectorID = this.options.apiFnChain.length - 1;
        return super._getClientFnWithOverriddenOptions(Object.assign(options, { apiFn, apiFnID: previousSelectorID }));
    }
    _processResult(result, selectorArgs) {
        const snapshot = super._processResult(result, selectorArgs);
        if (snapshot && !return_single_prop_mode_1.default(this.options)) {
            this._addBoundArgsSelectorGetter(snapshot, selectorArgs);
            create_snapshot_methods_1.default(snapshot);
            if (this.options.customMethods)
                add_api_1.addCustomMethods(snapshot, () => snapshot.selector, SelectorBuilder, this.options.customMethods);
        }
        return snapshot;
    }
}
exports.default = SelectorBuilder;
module.exports = exports.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0b3ItYnVpbGRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQtZnVuY3Rpb25zL3NlbGVjdG9ycy9zZWxlY3Rvci1idWlsZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsbUNBQTJEO0FBQzNELG9EQUE0QjtBQUM1Qix5RkFBK0Q7QUFDL0QsOENBQXNEO0FBQ3RELGtEQUE4RDtBQUM5RCx1RUFBc0Q7QUFDdEQsOENBQW9EO0FBQ3BELDBFQUFzRTtBQUN0RSxxRUFBNkU7QUFDN0UsNEZBQWtFO0FBQ2xFLHVDQUFxRDtBQUNyRCx3RkFBOEQ7QUFDOUQsMEVBQWtEO0FBQ2xELHlGQUE4RDtBQUU5RCxNQUFxQixlQUFnQixTQUFRLGlDQUFxQjtJQUM5RCxZQUFhLEVBQUUsRUFBRSxPQUFPLEVBQUUsYUFBYTtRQUNuQyxNQUFNLEtBQUssR0FBMEIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUM7UUFDOUQsTUFBTSxPQUFPLEdBQXdCLE9BQU8sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDO1FBQ2hFLE1BQU0sbUJBQW1CLEdBQVksRUFBRSxJQUFJLEVBQUUsQ0FBQyx3QkFBcUIsQ0FBQyxDQUFDO1FBQ3JFLE1BQU0sNEJBQTRCLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyx3QkFBcUIsQ0FBQyxDQUFDO1FBQzdGLElBQUksT0FBTyxHQUEwQixtQkFBbUIsSUFBSSw0QkFBNEIsQ0FBQztRQUV6RixPQUFPLEdBQUcsT0FBTyxZQUFZLGVBQWUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFFOUQsSUFBSSxPQUFPLEVBQUU7WUFDVCxFQUFFLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUVoQixJQUFJLE9BQU8sS0FBSyxLQUFLLENBQUMsSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRO2dCQUNq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QUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhO2dCQUMxQiwwQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxlQUFlLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztTQUN4RztRQUVELE9BQU8sUUFBUSxDQUFDO0lBQ3BCLENBQUM7Q0FDSjtBQTNNRCxrQ0EyTUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBpc05pbCBhcyBpc051bGxPclVuZGVmaW5lZCwgbWVyZ2UgfSBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IGRlZGVudCBmcm9tICdkZWRlbnQnO1xuaW1wb3J0IENsaWVudEZ1bmN0aW9uQnVpbGRlciBmcm9tICcuLi9jbGllbnQtZnVuY3Rpb24tYnVpbGRlcic7XG5pbXBvcnQgeyBTZWxlY3Rvck5vZGVUcmFuc2Zvcm0gfSBmcm9tICcuLi9yZXBsaWNhdG9yJztcbmltcG9ydCB7IENsaWVudEZ1bmN0aW9uQVBJRXJyb3IgfSBmcm9tICcuLi8uLi9lcnJvcnMvcnVudGltZSc7XG5pbXBvcnQgZnVuY3Rpb25CdWlsZGVyU3ltYm9sIGZyb20gJy4uL2J1aWxkZXItc3ltYm9sJztcbmltcG9ydCB7IFJVTlRJTUVfRVJST1JTIH0gZnJvbSAnLi4vLi4vZXJyb3JzL3R5cGVzJztcbmltcG9ydCB7IGFzc2VydFR5cGUsIGlzIH0gZnJvbSAnLi4vLi4vZXJyb3JzL3J1bnRpbWUvdHlwZS1hc3NlcnRpb25zJztcbmltcG9ydCB7IEV4ZWN1dGVTZWxlY3RvckNvbW1hbmQgfSBmcm9tICcuLi8uLi90ZXN0LXJ1bi9jb21tYW5kcy9vYnNlcnZhdGlvbic7XG5pbXBvcnQgZGVmaW5lTGF6eVByb3BlcnR5IGZyb20gJy4uLy4uL3V0aWxzL2RlZmluZS1sYXp5LXByb3BlcnR5JztcbmltcG9ydCB7IGFkZEFQSSwgYWRkQ3VzdG9tTWV0aG9kcyB9IGZyb20gJy4vYWRkLWFwaSc7XG5pbXBvcnQgY3JlYXRlU25hcHNob3RNZXRob2RzIGZyb20gJy4vY3JlYXRlLXNuYXBzaG90LW1ldGhvZHMnO1xuaW1wb3J0IHByZXBhcmVBcGlGbkFyZ3MgZnJvbSAnLi9wcmVwYXJlLWFwaS1hcmdzJztcbmltcG9ydCByZXR1cm5TaW5nbGVQcm9wTW9kZSBmcm9tICcuLi9yZXR1cm4tc2luZ2xlLXByb3AtbW9kZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNlbGVjdG9yQnVpbGRlciBleHRlbmRzIENsaWVudEZ1bmN0aW9uQnVpbGRlciB7XG4gICAgY29uc3RydWN0b3IgKGZuLCBvcHRpb25zLCBjYWxsc2l0ZU5hbWVzKSB7XG4gICAgICAgIGNvbnN0IGFwaUZuICAgICAgICAgICAgICAgICAgICAgICAgPSBvcHRpb25zICYmIG9wdGlvbnMuYXBpRm47XG4gICAgICAgIGNvbnN0IGFwaUZuSUQgICAgICAgICAgICAgICAgICAgICAgPSBvcHRpb25zICYmIG9wdGlvbnMuYXBpRm5JRDtcbiAgICAgICAgY29uc3QgYnVpbGRlckZyb21TZWxlY3RvciAgICAgICAgICA9IGZuICYmIGZuW2Z1bmN0aW9uQnVpbGRlclN5bWJvbF07XG4gICAgICAgIGNvbnN0IGJ1aWxkZXJGcm9tUHJvbWlzZU9yU25hcHNob3QgPSBmbiAmJiBmbi5zZWxlY3RvciAmJiBmbi5zZWxlY3RvcltmdW5jdGlvbkJ1aWxkZXJTeW1ib2xdO1xuICAgICAgICBsZXQgYnVpbGRlciAgICAgICAgICAgICAgICAgICAgICAgID0gYnVpbGRlckZyb21TZWxlY3RvciB8fCBidWlsZGVyRnJvbVByb21pc2VPclNuYXBzaG90O1xuXG4gICAgICAgIGJ1aWxkZXIgPSBidWlsZGVyIGluc3RhbmNlb2YgU2VsZWN0b3JCdWlsZGVyID8gYnVpbGRlciA6IG51bGw7XG5cbiAgICAgICAgaWYgKGJ1aWxkZXIpIHtcbiAgICAgICAgICAgIGZuID0gYnVpbGRlci5mbjtcblxuICAgICAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCB8fCB0eXBlb2Ygb3B0aW9ucyA9PT0gJ29iamVjdCcpXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IG1lcmdlKHt9LCBidWlsZGVyLm9wdGlvbnMsIG9wdGlvbnMsIHsgc291cmNlU2VsZWN0b3JCdWlsZGVyOiBidWlsZGVyIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgc3VwZXIoZm4sIG9wdGlvbnMsIGNhbGxzaXRlTmFtZXMpO1xuXG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLmFwaUZuQ2hhaW4pIHtcbiAgICAgICAgICAgIGNvbnN0IGZuVHlwZSA9IHR5cGVvZiB0aGlzLmZuO1xuICAgICAgICAgICAgbGV0IGl0ZW0gICAgID0gZm5UeXBlID09PSAnc3RyaW5nJyA/IGAnJHt0aGlzLmZufSdgIDogYFske2ZuVHlwZX1dYDtcblxuICAgICAgICAgICAgaXRlbSAgICAgICAgICAgICAgICAgICAgPSBgU2VsZWN0b3IoJHtpdGVtfSlgO1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmFwaUZuICAgICAgPSBpdGVtO1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmFwaUZuQ2hhaW4gPSBbaXRlbV07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYXBpRm4pXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuYXBpRm5DaGFpbi5wdXNoKGFwaUZuKTtcblxuICAgICAgICB0aGlzLm9wdGlvbnMuYXBpRm5JRCA9IHR5cGVvZiBhcGlGbklEID09PSAnbnVtYmVyJyA/IGFwaUZuSUQgOiB0aGlzLm9wdGlvbnMuYXBpRm5DaGFpbi5sZW5ndGggLSAxO1xuICAgIH1cblxuICAgIF9nZXRDb21waWxlZEZuQ29kZSAoKSB7XG4gICAgICAgIC8vIE9QVElNSVpBVElPTjogaWYgc2VsZWN0b3Igd2FzIHByb2R1Y2VkIGZyb20gYW5vdGhlciBzZWxlY3RvciBhbmRcbiAgICAgICAgLy8gaXQgaGFzIHNhbWUgZGVwZW5kZW5jaWVzIGFzIHNvdXJjZSBzZWxlY3RvciwgdGhlbiB3ZSBjYW5cbiAgICAgICAgLy8gYXZvaWQgcmVjb21waWxhdGlvbiBhbmQganVzdCByZS11c2UgYWxyZWFkeSBjb21waWxlZCBjb2RlLlxuICAgICAgICBjb25zdCBoYXNTYW1lRGVwZW5kZW5jaWVzQXNTb3VyY2VTZWxlY3RvciA9IHRoaXMub3B0aW9ucy5zb3VyY2VTZWxlY3RvckJ1aWxkZXIgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuc291cmNlU2VsZWN0b3JCdWlsZGVyLm9wdGlvbnMuZGVwZW5kZW5jaWVzID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kZXBlbmRlbmNpZXM7XG5cbiAgICAgICAgaWYgKGhhc1NhbWVEZXBlbmRlbmNpZXNBc1NvdXJjZVNlbGVjdG9yKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5zb3VyY2VTZWxlY3RvckJ1aWxkZXIuY29tcGlsZWRGbkNvZGU7XG5cbiAgICAgICAgY29uc3QgY29kZSA9IHR5cGVvZiB0aGlzLmZuID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBgKGZ1bmN0aW9uKCl7cmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJHtKU09OLnN0cmluZ2lmeSh0aGlzLmZuKX0pO30pO2AgOlxuICAgICAgICAgICAgc3VwZXIuX2dldENvbXBpbGVkRm5Db2RlKCk7XG5cbiAgICAgICAgaWYgKGNvZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBkZWRlbnQoXG4gICAgICAgICAgICAgICAgYChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICB2YXIgX19mJD0ke2NvZGV9O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhcmdzICAgICAgICAgICA9IF9fZGVwZW5kZW5jaWVzJC5ib3VuZEFyZ3MgfHwgYXJndW1lbnRzO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGVjdG9yRmlsdGVyID0gd2luZG93WycldGVzdENhZmVTZWxlY3RvckZpbHRlciUnXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5vZGVzID0gX19mJC5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVzICAgICA9IHNlbGVjdG9yRmlsdGVyLmNhc3Qobm9kZXMpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW5vZGVzLmxlbmd0aCAmJiAhc2VsZWN0b3JGaWx0ZXIuZXJyb3IpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0b3JGaWx0ZXIuZXJyb3IgPSBfX2RlcGVuZGVuY2llcyQuYXBpSW5mby5hcGlGbklEO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZWN0b3JGaWx0ZXIuZmlsdGVyKG5vZGVzLCBfX2RlcGVuZGVuY2llcyQuZmlsdGVyT3B0aW9ucywgX19kZXBlbmRlbmNpZXMkLmFwaUluZm8pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICB9KSgpO2BcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBfY3JlYXRlSW52YWxpZEZuVHlwZUVycm9yICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDbGllbnRGdW5jdGlvbkFQSUVycm9yKHRoaXMuY2FsbHNpdGVOYW1lcy5pbnN0YW50aWF0aW9uLCB0aGlzLmNhbGxzaXRlTmFtZXMuaW5zdGFudGlhdGlvbiwgUlVOVElNRV9FUlJPUlMuc2VsZWN0b3JJbml0aWFsaXplZFdpdGhXcm9uZ1R5cGUsIHR5cGVvZiB0aGlzLmZuKTtcbiAgICB9XG5cbiAgICBfZXhlY3V0ZUNvbW1hbmQgKGFyZ3MsIHRlc3RSdW4sIGNhbGxzaXRlKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdFByb21pc2UgPSBzdXBlci5fZXhlY3V0ZUNvbW1hbmQoYXJncywgdGVzdFJ1biwgY2FsbHNpdGUpO1xuXG4gICAgICAgIHRoaXMuX2FkZEJvdW5kQXJnc1NlbGVjdG9yR2V0dGVyKHJlc3VsdFByb21pc2UsIGFyZ3MpO1xuXG4gICAgICAgIC8vIE9QVElNSVpBVElPTjogdXNlIGJ1ZmZlciBmdW5jdGlvbiBhcyBzZWxlY3RvciBub3QgdG8gdHJpZ2dlciBsYXp5IHByb3BlcnR5IGFoZWFkIG9mIHRpbWVcbiAgICAgICAgYWRkQVBJKHJlc3VsdFByb21pc2UsICgpID0+IHJlc3VsdFByb21pc2Uuc2VsZWN0b3IsIFNlbGVjdG9yQnVpbGRlciwgdGhpcy5vcHRpb25zLmN1c3RvbURPTVByb3BlcnRpZXMsIHRoaXMub3B0aW9ucy5jdXN0b21NZXRob2RzKTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0UHJvbWlzZTtcbiAgICB9XG5cbiAgICBfZ2V0U291cmNlU2VsZWN0b3JCdWlsZGVyQXBpRm5JRCAoKSB7XG4gICAgICAgIGxldCBzZWxlY3RvckFuY2VzdG9yID0gdGhpcztcblxuICAgICAgICB3aGlsZSAoc2VsZWN0b3JBbmNlc3Rvci5vcHRpb25zLnNvdXJjZVNlbGVjdG9yQnVpbGRlcilcbiAgICAgICAgICAgIHNlbGVjdG9yQW5jZXN0b3IgPSBzZWxlY3RvckFuY2VzdG9yLm9wdGlvbnMuc291cmNlU2VsZWN0b3JCdWlsZGVyO1xuXG4gICAgICAgIHJldHVybiBzZWxlY3RvckFuY2VzdG9yLm9wdGlvbnMuYXBpRm5JRDtcbiAgICB9XG5cbiAgICBnZXRGdW5jdGlvbkRlcGVuZGVuY2llcyAoKSB7XG4gICAgICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IHN1cGVyLmdldEZ1bmN0aW9uRGVwZW5kZW5jaWVzKCk7XG5cbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgZmlsdGVyVmlzaWJsZSxcbiAgICAgICAgICAgIGZpbHRlckhpZGRlbixcbiAgICAgICAgICAgIGNvdW50ZXJNb2RlLFxuICAgICAgICAgICAgY29sbGVjdGlvbk1vZGUsXG4gICAgICAgICAgICBnZXRWaXNpYmxlVmFsdWVNb2RlLFxuICAgICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgICBjdXN0b21ET01Qcm9wZXJ0aWVzLFxuICAgICAgICAgICAgY3VzdG9tTWV0aG9kcyxcbiAgICAgICAgICAgIGFwaUZuQ2hhaW4sXG4gICAgICAgICAgICBib3VuZEFyZ3NcbiAgICAgICAgfSA9IHRoaXMub3B0aW9ucztcblxuICAgICAgICByZXR1cm4gbWVyZ2Uoe30sIGRlcGVuZGVuY2llcywge1xuICAgICAgICAgICAgZmlsdGVyT3B0aW9uczoge1xuICAgICAgICAgICAgICAgIGZpbHRlclZpc2libGUsXG4gICAgICAgICAgICAgICAgZmlsdGVySGlkZGVuLFxuICAgICAgICAgICAgICAgIGNvdW50ZXJNb2RlLFxuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25Nb2RlLFxuICAgICAgICAgICAgICAgIGluZGV4OiBpc051bGxPclVuZGVmaW5lZChpbmRleCkgPyBudWxsIDogaW5kZXgsXG4gICAgICAgICAgICAgICAgZ2V0VmlzaWJsZVZhbHVlTW9kZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFwaUluZm86IHtcbiAgICAgICAgICAgICAgICBhcGlGbkNoYWluLFxuICAgICAgICAgICAgICAgIGFwaUZuSUQ6IHRoaXMuX2dldFNvdXJjZVNlbGVjdG9yQnVpbGRlckFwaUZuSUQoKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvdW5kQXJncyxcbiAgICAgICAgICAgIGN1c3RvbURPTVByb3BlcnRpZXMsXG4gICAgICAgICAgICBjdXN0b21NZXRob2RzXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9jcmVhdGVUZXN0UnVuQ29tbWFuZCAoZW5jb2RlZEFyZ3MsIGVuY29kZWREZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeGVjdXRlU2VsZWN0b3JDb21tYW5kKHtcbiAgICAgICAgICAgIGluc3RhbnRpYXRpb25DYWxsc2l0ZU5hbWU6IHRoaXMuY2FsbHNpdGVOYW1lcy5pbnN0YW50aWF0aW9uLFxuICAgICAgICAgICAgZm5Db2RlOiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb21waWxlZEZuQ29kZSxcbiAgICAgICAgICAgIGFyZ3M6ICAgICAgICAgICAgICAgICAgICAgIGVuY29kZWRBcmdzLFxuICAgICAgICAgICAgZGVwZW5kZW5jaWVzOiAgICAgICAgICAgICAgZW5jb2RlZERlcGVuZGVuY2llcyxcbiAgICAgICAgICAgIG5lZWRFcnJvcjogICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5uZWVkRXJyb3IsXG4gICAgICAgICAgICBhcGlGbkNoYWluOiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuYXBpRm5DaGFpbixcbiAgICAgICAgICAgIHZpc2liaWxpdHlDaGVjazogICAgICAgICAgICEhdGhpcy5vcHRpb25zLnZpc2liaWxpdHlDaGVjayxcbiAgICAgICAgICAgIHRpbWVvdXQ6ICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy50aW1lb3V0XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF92YWxpZGF0ZU9wdGlvbnMgKG9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIuX3ZhbGlkYXRlT3B0aW9ucyhvcHRpb25zKTtcblxuICAgICAgICBpZiAoIWlzTnVsbE9yVW5kZWZpbmVkKG9wdGlvbnMudmlzaWJpbGl0eUNoZWNrKSlcbiAgICAgICAgICAgIGFzc2VydFR5cGUoaXMuYm9vbGVhbiwgdGhpcy5jYWxsc2l0ZU5hbWVzLmluc3RhbnRpYXRpb24sICdcInZpc2liaWxpdHlDaGVja1wiIG9wdGlvbicsIG9wdGlvbnMudmlzaWJpbGl0eUNoZWNrKTtcblxuICAgICAgICBpZiAoIWlzTnVsbE9yVW5kZWZpbmVkKG9wdGlvbnMudGltZW91dCkpXG4gICAgICAgICAgICBhc3NlcnRUeXBlKGlzLm5vbk5lZ2F0aXZlTnVtYmVyLCB0aGlzLmNhbGxzaXRlTmFtZXMuaW5zdGFudGlhdGlvbiwgJ1widGltZW91dFwiIG9wdGlvbicsIG9wdGlvbnMudGltZW91dCk7XG4gICAgfVxuXG4gICAgX2dldFJlcGxpY2F0b3JUcmFuc2Zvcm1zICgpIHtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtcyA9IHN1cGVyLl9nZXRSZXBsaWNhdG9yVHJhbnNmb3JtcygpO1xuXG4gICAgICAgIHRyYW5zZm9ybXMucHVzaChuZXcgU2VsZWN0b3JOb2RlVHJhbnNmb3JtKCkpO1xuXG4gICAgICAgIHJldHVybiB0cmFuc2Zvcm1zO1xuICAgIH1cblxuICAgIF9hZGRCb3VuZEFyZ3NTZWxlY3RvckdldHRlciAob2JqLCBzZWxlY3RvckFyZ3MpIHtcbiAgICAgICAgZGVmaW5lTGF6eVByb3BlcnR5KG9iaiwgJ3NlbGVjdG9yJywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYnVpbGRlciA9IG5ldyBTZWxlY3RvckJ1aWxkZXIodGhpcy5nZXRGdW5jdGlvbigpLCB7IGJvdW5kQXJnczogc2VsZWN0b3JBcmdzIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gYnVpbGRlci5nZXRGdW5jdGlvbigpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBfZGVjb3JhdGVGdW5jdGlvbiAoc2VsZWN0b3JGbikge1xuICAgICAgICBzdXBlci5fZGVjb3JhdGVGdW5jdGlvbihzZWxlY3RvckZuKTtcblxuICAgICAgICBhZGRBUEkoXG4gICAgICAgICAgICBzZWxlY3RvckZuLFxuICAgICAgICAgICAgKCkgPT4gc2VsZWN0b3JGbixcbiAgICAgICAgICAgIFNlbGVjdG9yQnVpbGRlcixcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5jdXN0b21ET01Qcm9wZXJ0aWVzLFxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmN1c3RvbU1ldGhvZHMsXG4gICAgICAgICAgICB0aGlzLl9nZXRUZXN0UnVuKCkgPyB0aGlzLl9nZXRUZXN0UnVuKCkub2JzZXJ2ZWRDYWxsc2l0ZXMgOiBudWxsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgX2dldENsaWVudEZuV2l0aE92ZXJyaWRkZW5PcHRpb25zIChvcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IGFwaUZuICAgICAgICAgICAgICA9IHByZXBhcmVBcGlGbkFyZ3MoJ3dpdGgnLCBvcHRpb25zKTtcbiAgICAgICAgY29uc3QgcHJldmlvdXNTZWxlY3RvcklEID0gdGhpcy5vcHRpb25zLmFwaUZuQ2hhaW4ubGVuZ3RoIC0gMTtcblxuICAgICAgICByZXR1cm4gc3VwZXIuX2dldENsaWVudEZuV2l0aE92ZXJyaWRkZW5PcHRpb25zKE9iamVjdC5hc3NpZ24ob3B0aW9ucywgeyBhcGlGbiwgYXBpRm5JRDogcHJldmlvdXNTZWxlY3RvcklEIH0pKTtcbiAgICB9XG5cbiAgICBfcHJvY2Vzc1Jlc3VsdCAocmVzdWx0LCBzZWxlY3RvckFyZ3MpIHtcbiAgICAgICAgY29uc3Qgc25hcHNob3QgPSBzdXBlci5fcHJvY2Vzc1Jlc3VsdChyZXN1bHQsIHNlbGVjdG9yQXJncyk7XG5cbiAgICAgICAgaWYgKHNuYXBzaG90ICYmICFyZXR1cm5TaW5nbGVQcm9wTW9kZSh0aGlzLm9wdGlvbnMpKSB7XG4gICAgICAgICAgICB0aGlzLl9hZGRCb3VuZEFyZ3NTZWxlY3RvckdldHRlcihzbmFwc2hvdCwgc2VsZWN0b3JBcmdzKTtcbiAgICAgICAgICAgIGNyZWF0ZVNuYXBzaG90TWV0aG9kcyhzbmFwc2hvdCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuY3VzdG9tTWV0aG9kcylcbiAgICAgICAgICAgICAgICBhZGRDdXN0b21NZXRob2RzKHNuYXBzaG90LCAoKSA9PiBzbmFwc2hvdC5zZWxlY3RvciwgU2VsZWN0b3JCdWlsZGVyLCB0aGlzLm9wdGlvbnMuY3VzdG9tTWV0aG9kcyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc25hcHNob3Q7XG4gICAgfVxufVxuXG4iXX0=