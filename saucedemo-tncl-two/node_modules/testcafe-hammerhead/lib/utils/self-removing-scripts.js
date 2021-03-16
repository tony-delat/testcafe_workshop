"use strict";

exports.__esModule = true;
exports.default = void 0;

var _className = _interopRequireDefault(require("../shadow-ui/class-name"));

var _internalProperties = _interopRequireDefault(require("../processing/dom/internal-properties"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// -------------------------------------------------------------
// WARNING: this file is used by both the client and the server.
// Do not use any browser or node-specific API!
// -------------------------------------------------------------
function create(script) {
  return `
        <script class="${_className.default.selfRemovingScript}">
            (function () {
                ${script}

                var currentScript = document.currentScript;
                var scriptsLength;
                var scripts;

                /* NOTE: IE11 doesn't support the 'currentScript' property */
                if (!currentScript) {
                    var hammerhead;

                    try {
                        hammerhead = parent["${_internalProperties.default.hammerhead}"] || window["${_internalProperties.default.hammerhead}"];
                    }
                    catch (e) {
                        hammerhead = window["${_internalProperties.default.hammerhead}"];
                    }

                    if (hammerhead) {
                        try {
                            scripts       = hammerhead.nativeMethods.documentScriptsGetter.call(document);
                            scriptsLength = hammerhead.nativeMethods.htmlCollectionLengthGetter.call(scripts);
                        }
                        catch (e) {}
                    }

                    scripts       = scripts || document.scripts;
                    scriptsLength = scriptsLength !== void 0 ? scriptsLength : scripts.length;
                    currentScript = scripts[scriptsLength - 1];
                }

                currentScript.parentNode.removeChild(currentScript);
            })();
        </script>
    `.replace(/\n\s*|\/\*[\S\s]*?\*\//g, '');
}

var _default = {
  iframeInit: create(`
        var parentHammerhead = null;
    
        if (!window["${_internalProperties.default.hammerhead}"])
            Object.defineProperty(window, "${_internalProperties.default.documentWasCleaned}", { value: true, configurable: true });
    
        try {
            parentHammerhead = window.parent["${_internalProperties.default.hammerhead}"];
        } catch(e) {}
    
        if (parentHammerhead)
            parentHammerhead.sandbox.onIframeDocumentRecreated(window.frameElement);
    `),
  onWindowRecreation: create(`
        var hammerhead = window["${_internalProperties.default.hammerhead}"];
        var sandbox    = hammerhead && hammerhead.sandbox;
    
        if (!sandbox) {
            try {
                sandbox = window.parent["${_internalProperties.default.hammerhead}"].get('./sandbox/backup').get(window);
            } catch(e) {}
        }
    
        if (sandbox) {
            Object.defineProperty(window, "${_internalProperties.default.documentWasCleaned}", { value: true, configurable: true });
            
            sandbox.node.mutation.onDocumentCleaned(window, document);
    
            /* NOTE: B234357 */
            sandbox.node.processNodes(null, document);
        }
    `),
  onBodyCreated: create(`
        if (window["${_internalProperties.default.hammerhead}"])
            window["${_internalProperties.default.hammerhead}"].sandbox.node.raiseBodyCreatedEvent();
    `),
  onOriginFirstTitleLoaded: create(`
        window["${_internalProperties.default.hammerhead}"].sandbox.node.onOriginFirstTitleElementInHeadLoaded();
    `),
  restoreStorages: create(`
        window.localStorage.setItem("%s", %s);
        window.sessionStorage.setItem("%s", %s);
    `)
};
exports.default = _default;
module.exports = exports.default;