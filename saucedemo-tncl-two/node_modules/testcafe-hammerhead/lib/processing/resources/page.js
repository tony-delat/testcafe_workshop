"use strict";

exports.__esModule = true;
exports.default = void 0;

var _util = _interopRequireDefault(require("util"));

var _parse = _interopRequireDefault(require("parse5"));

var _className = _interopRequireDefault(require("../../shadow-ui/class-name"));

var _dom = _interopRequireDefault(require("../dom"));

var _parse5DomAdapter = _interopRequireDefault(require("../dom/parse5-dom-adapter"));

var _resourceProcessorBase = _interopRequireDefault(require("./resource-processor-base"));

var parse5Utils = _interopRequireWildcard(require("../../utils/parse5"));

var _getBom = _interopRequireDefault(require("../../utils/get-bom"));

var _getStorageKey = _interopRequireDefault(require("../../utils/get-storage-key"));

var _selfRemovingScripts = _interopRequireDefault(require("../../utils/self-removing-scripts"));

var _serviceRoutes = _interopRequireDefault(require("../../proxy/service-routes"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const PARSED_BODY_CREATED_EVENT_SCRIPT = _parse.default.parseFragment(_selfRemovingScripts.default.onBodyCreated).childNodes[0];

const PARSED_ORIGIN_FIRST_TITLE_ELEMENT_LOADED_SCRIPT = _parse.default.parseFragment(_selfRemovingScripts.default.onOriginFirstTitleLoaded).childNodes[0];

const PARSED_INIT_SCRIPT_FOR_IFRAME_TEMPLATE = _parse.default.parseFragment(_selfRemovingScripts.default.iframeInit).childNodes[0];

class PageProcessor extends _resourceProcessorBase.default {
  constructor() {
    super();

    _defineProperty(this, "RESTART_PROCESSING", void 0);

    this.RESTART_PROCESSING = Symbol();
  }

  _createRestoreStoragesScript(storageKey, storages) {
    const parsedDocumentFragment = _parse.default.parseFragment(_util.default.format(_selfRemovingScripts.default.restoreStorages, storageKey, JSON.stringify(storages.localStorage), storageKey, JSON.stringify(storages.sessionStorage)));

    return parsedDocumentFragment.childNodes[0];
  }

  static _getPageProcessingOptions(ctx, urlReplacer) {
    return {
      crossDomainProxyPort: ctx.serverInfo.crossDomainPort,
      isIframe: ctx.isIframe,
      stylesheets: ctx.getInjectableStyles(),
      scripts: ctx.getInjectableScripts(),
      urlReplacer: urlReplacer,
      isIframeWithImageSrc: ctx.contentInfo && ctx.contentInfo.isIframeWithImageSrc
    };
  }

  static _getPageMetas(metaEls, domAdapter) {
    const metas = [];

    for (let i = 0; i < metaEls.length; i++) {
      metas.push({
        httpEquiv: domAdapter.getAttr(metaEls[i], 'http-equiv'),
        content: domAdapter.getAttr(metaEls[i], 'content'),
        charset: domAdapter.getAttr(metaEls[i], 'charset')
      });
    }

    return metas;
  }

  static _addPageResources(head, processingOptions) {
    const injectedResources = [];

    if (processingOptions.stylesheets) {
      processingOptions.stylesheets.forEach(stylesheetUrl => {
        injectedResources.unshift(parse5Utils.createElement('link', [{
          name: 'rel',
          value: 'stylesheet'
        }, {
          name: 'type',
          value: 'text/css'
        }, {
          name: 'class',
          value: _className.default.uiStylesheet
        }, {
          name: 'href',
          value: stylesheetUrl
        }]));
      });
    }

    if (processingOptions.scripts) {
      processingOptions.scripts.forEach(scriptUrl => {
        injectedResources.push(parse5Utils.createElement('script', [{
          name: 'type',
          value: 'text/javascript'
        }, {
          name: 'class',
          value: _className.default.script
        }, {
          name: 'charset',
          value: 'UTF-8'
        }, {
          name: 'src',
          value: scriptUrl
        }]));
      });
    }

    for (let i = injectedResources.length - 1; i > -1; i--) parse5Utils.insertBeforeFirstScript(injectedResources[i], head);

    return injectedResources;
  }

  static _getTaskScriptNodeIndex(head, ctx) {
    const taskScriptUrls = [ctx.resolveInjectableUrl(_serviceRoutes.default.task), ctx.resolveInjectableUrl(_serviceRoutes.default.iframeTask)];
    return parse5Utils.findNodeIndex(head, node => {
      return node.tagName === 'script' && !!node.attrs.find(attr => attr.name === 'class' && attr.value === _className.default.script) && !!node.attrs.find(attr => attr.name === 'src' && taskScriptUrls.includes(attr.value));
    });
  }
  /**
   * Inject the service script after the first title element
   * or after injected resources,
   * if they are placed right after the <title> tag
   **/


  static _addPageOriginFirstTitleParsedScript(head, ctx) {
    const firstTitleNodeIndex = parse5Utils.findNodeIndex(head, node => node.tagName === 'title');
    if (firstTitleNodeIndex === -1) return;

    const taskScriptNodeIndex = PageProcessor._getTaskScriptNodeIndex(head, ctx);

    const insertIndex = taskScriptNodeIndex > firstTitleNodeIndex ? taskScriptNodeIndex + 1 : firstTitleNodeIndex + 1;
    parse5Utils.appendNode(PARSED_ORIGIN_FIRST_TITLE_ELEMENT_LOADED_SCRIPT, head, insertIndex);
  }

  static _addCharsetInfo(head, charset) {
    parse5Utils.unshiftElement(parse5Utils.createElement('meta', [{
      name: 'class',
      value: _className.default.charset
    }, {
      name: 'charset',
      value: charset
    }]), head);
  }

  static _changeMetas(metas, domAdapter) {
    if (metas) {
      metas.forEach(meta => {
        // TODO: Figure out how to emulate the tag behavior.
        if (domAdapter.getAttr(meta, 'name') === 'referrer') parse5Utils.setAttr(meta, 'content', 'unsafe-url');
      });
    }
  }

  static _prepareHtml(html, processingOpts) {
    if (processingOpts && processingOpts.iframeImageSrc) return `<html><body><img src="${processingOpts.iframeImageSrc}" /></body></html>`;
    return html;
  }

  _addRestoreStoragesScript(ctx, head) {
    const storageKey = (0, _getStorageKey.default)(ctx.session.id, ctx.dest.host);

    const restoreStoragesScript = this._createRestoreStoragesScript(storageKey, ctx.restoringStorages);

    parse5Utils.insertBeforeFirstScript(restoreStoragesScript, head);
  }

  static _addBodyCreatedEventScript(body) {
    parse5Utils.unshiftElement(PARSED_BODY_CREATED_EVENT_SCRIPT, body);
  }

  shouldProcessResource(ctx) {
    // NOTE: In some cases, Firefox sends the default accept header for the script.
    // We should not try to process it as a page in this case.
    return (ctx.isPage || ctx.contentInfo.isIframeWithImageSrc) && !ctx.contentInfo.isScript && !ctx.contentInfo.isFileDownload;
  }

  processResource(html, ctx, charset, urlReplacer, isSrcdoc = false) {
    const processingOpts = PageProcessor._getPageProcessingOptions(ctx, urlReplacer);

    const bom = (0, _getBom.default)(html);
    if (isSrcdoc) processingOpts.isIframe = true;
    html = bom ? html.replace(bom, '') : html;

    PageProcessor._prepareHtml(html, processingOpts);

    const root = _parse.default.parse(html);

    const domAdapter = new _parse5DomAdapter.default(processingOpts.isIframe, ctx, charset, urlReplacer);
    const elements = parse5Utils.findElementsByTagNames(root, ['base', 'meta', 'head', 'body', 'frameset']);
    const base = elements.base ? elements.base[0] : null;
    const baseUrl = base ? domAdapter.getAttr(base, 'href') : '';
    const metas = elements.meta;
    const head = elements.head[0];
    const body = elements.body ? elements.body[0] : elements.frameset[0];
    if (!isSrcdoc && metas && charset.fromMeta(PageProcessor._getPageMetas(metas, domAdapter))) return this.RESTART_PROCESSING;
    const domProcessor = new _dom.default(domAdapter);

    const replacer = (resourceUrl, resourceType, charsetAttrValue, isCrossDomain = false) => urlReplacer(resourceUrl, resourceType, charsetAttrValue, baseUrl, isCrossDomain);

    domProcessor.forceProxySrcForImage = ctx.session.hasRequestEventListeners();
    domProcessor.allowMultipleWindows = ctx.session.options.allowMultipleWindows;
    parse5Utils.walkElements(root, el => domProcessor.processElement(el, replacer));
    if (isSrcdoc) parse5Utils.unshiftElement(PARSED_INIT_SCRIPT_FOR_IFRAME_TEMPLATE, head);else if (!ctx.isHtmlImport) {
      PageProcessor._addPageResources(head, processingOpts);

      PageProcessor._addPageOriginFirstTitleParsedScript(head, ctx);

      PageProcessor._addBodyCreatedEventScript(body);

      if (ctx.restoringStorages && !processingOpts.isIframe) this._addRestoreStoragesScript(ctx, head);
    }

    PageProcessor._changeMetas(metas, domAdapter);

    PageProcessor._addCharsetInfo(head, charset.get());

    return (bom || '') + _parse.default.serialize(root);
  }

}

var _default = new PageProcessor();

exports.default = _default;
module.exports = exports.default;