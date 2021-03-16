"use strict";

exports.__esModule = true;
exports.default = void 0;

var _router = _interopRequireDefault(require("./router"));

var _http = _interopRequireDefault(require("http"));

var _https = _interopRequireDefault(require("https"));

var urlUtils = _interopRequireWildcard(require("../utils/url"));

var _readFileRelative = require("read-file-relative");

var _http2 = require("../utils/http");

var _requestPipeline = require("../request-pipeline");

var _createShadowStylesheet = _interopRequireDefault(require("../shadow-ui/create-shadow-stylesheet"));

var _agent = require("../request-pipeline/destination-request/agent");

var _serviceRoutes = _interopRequireDefault(require("./service-routes"));

var _builtinHeaderNames = _interopRequireDefault(require("../request-pipeline/builtin-header-names"));

var _logger = _interopRequireDefault(require("../utils/logger"));

var _errToString = _interopRequireDefault(require("../utils/err-to-string"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const SESSION_IS_NOT_OPENED_ERR = 'Session is not opened in proxy';

function parseAsJson(msg) {
  try {
    return JSON.parse(msg.toString());
  } catch (err) {
    return null;
  }
}

function createServerInfo(hostname, port, crossDomainPort, protocol, cacheRequests) {
  return {
    hostname,
    port,
    crossDomainPort,
    protocol,
    cacheRequests,
    domain: `${protocol}//${hostname}:${port}`
  };
}

class Proxy extends _router.default {
  // Max header size for incoming HTTP requests
  // Set to 80 KB as it was the original limit:
  // https://github.com/nodejs/node/blob/186035243fad247e3955fa0c202987cae99e82db/deps/http_parser/http_parser.h#L63
  // Before the change to 8 KB:
  // https://github.com/nodejs/node/commit/186035243fad247e3955fa0c202987cae99e82db#diff-1d0d420098503156cddb601e523b82e7R59
  constructor(hostname, port1, port2, options = {
    developmentMode: false,
    cache: false
  }) {
    super(options);

    _defineProperty(this, "openSessions", new Map());

    _defineProperty(this, "server1Info", void 0);

    _defineProperty(this, "server2Info", void 0);

    _defineProperty(this, "server1", void 0);

    _defineProperty(this, "server2", void 0);

    _defineProperty(this, "sockets", void 0);

    const {
      ssl,
      developmentMode,
      cache
    } = options;
    const protocol = ssl ? 'https:' : 'http:';

    const opts = this._getOpts(ssl);

    const createServer = this._getCreateServerMethod(ssl);

    this.server1Info = createServerInfo(hostname, port1, port2, protocol, cache);
    this.server2Info = createServerInfo(hostname, port2, port1, protocol, cache);
    this.server1 = createServer(opts, (req, res) => this._onRequest(req, res, this.server1Info));
    this.server2 = createServer(opts, (req, res) => this._onRequest(req, res, this.server2Info));
    this.server1.on('upgrade', (req, socket, head) => this._onUpgradeRequest(req, socket, head, this.server1Info));
    this.server2.on('upgrade', (req, socket, head) => this._onUpgradeRequest(req, socket, head, this.server2Info));
    this.server1.listen(port1);
    this.server2.listen(port2);
    this.sockets = new Set(); // BUG: GH-89

    this._startSocketsCollecting();

    this._registerServiceRoutes(developmentMode);
  }

  _getOpts(ssl) {
    let opts = {};
    if (ssl) opts = ssl;
    opts.maxHeaderSize = Proxy.MAX_REQUEST_HEADER_SIZE;
    return opts;
  }

  _getCreateServerMethod(ssl) {
    return ssl ? _https.default.createServer : _http.default.createServer;
  }

  _closeSockets() {
    this.sockets.forEach(socket => socket.destroy());
  }

  _startSocketsCollecting() {
    const handler = socket => {
      this.sockets.add(socket);
      socket.on('close', () => this.sockets.delete(socket));
    };

    this.server1.on('connection', handler);
    this.server2.on('connection', handler);
  }

  _registerServiceRoutes(developmentMode) {
    const developmentModeSuffix = developmentMode ? '' : '.min';
    const hammerheadFileName = `hammerhead${developmentModeSuffix}.js`;
    const hammerheadScriptContent = (0, _readFileRelative.readSync)(`../client/${hammerheadFileName}`);
    const transportWorkerFileName = `transport-worker${developmentModeSuffix}.js`;
    const transportWorkerContent = (0, _readFileRelative.readSync)(`../client/${transportWorkerFileName}`);
    const workerHammerheadFileName = `worker-hammerhead${developmentModeSuffix}.js`;
    const workerHammerheadContent = (0, _readFileRelative.readSync)(`../client/${workerHammerheadFileName}`);
    this.GET(_serviceRoutes.default.hammerhead, {
      contentType: 'application/x-javascript',
      content: hammerheadScriptContent
    });
    this.GET(_serviceRoutes.default.transportWorker, {
      contentType: 'application/x-javascript',
      content: transportWorkerContent
    });
    this.GET(_serviceRoutes.default.workerHammerhead, {
      contentType: 'application/x-javascript',
      content: workerHammerheadContent
    });
    this.POST(_serviceRoutes.default.messaging, (req, res, serverInfo) => this._onServiceMessage(req, res, serverInfo));
    this.GET(_serviceRoutes.default.task, (req, res, serverInfo) => this._onTaskScriptRequest(req, res, serverInfo, false));
    this.GET(_serviceRoutes.default.iframeTask, (req, res, serverInfo) => this._onTaskScriptRequest(req, res, serverInfo, true));
  }

  async _onServiceMessage(req, res, serverInfo) {
    const body = await (0, _http2.fetchBody)(req);
    const msg = parseAsJson(body);
    const session = msg && this.openSessions.get(msg.sessionId);

    if (session) {
      try {
        const result = await session.handleServiceMessage(msg, serverInfo);

        _logger.default.serviceMsg.onMessage(msg, result);

        (0, _http2.respondWithJSON)(res, result, false);
      } catch (err) {
        _logger.default.serviceMsg.onError(msg, err);

        (0, _http2.respond500)(res, (0, _errToString.default)(err));
      }
    } else (0, _http2.respond500)(res, SESSION_IS_NOT_OPENED_ERR);
  }

  async _onTaskScriptRequest(req, res, serverInfo, isIframe) {
    const referer = req.headers[_builtinHeaderNames.default.referer];
    const refererDest = referer && urlUtils.parseProxyUrl(referer);
    const session = refererDest && this.openSessions.get(refererDest.sessionId);
    const windowId = refererDest && refererDest.windowId;

    if (session) {
      res.setHeader(_builtinHeaderNames.default.contentType, 'application/x-javascript');
      (0, _http2.addPreventCachingHeaders)(res);
      const taskScript = await session.getTaskScript({
        referer,
        cookieUrl: refererDest.destUrl,
        serverInfo,
        isIframe,
        withPayload: true,
        windowId
      });
      res.end(taskScript);
    } else (0, _http2.respond500)(res, SESSION_IS_NOT_OPENED_ERR);
  }

  _onRequest(req, res, serverInfo) {
    // NOTE: Not a service request, execute the proxy pipeline.
    if (!this._route(req, res, serverInfo)) (0, _requestPipeline.run)(req, res, serverInfo, this.openSessions);
  }

  _onUpgradeRequest(req, socket, head, serverInfo) {
    if (head && head.length) socket.unshift(head);

    this._onRequest(req, socket, serverInfo);
  }

  _processStaticContent(handler) {
    if (handler.isShadowUIStylesheet) handler.content = (0, _createShadowStylesheet.default)(handler.content);
  } // API


  close() {
    this.server1.close();
    this.server2.close();

    this._closeSockets();

    (0, _agent.resetKeepAliveConnections)();
  }

  openSession(url, session, externalProxySettings) {
    session.proxy = this;
    this.openSessions.set(session.id, session);
    if (externalProxySettings) session.setExternalProxySettings(externalProxySettings);
    url = urlUtils.prepareUrl(url);
    return urlUtils.getProxyUrl(url, {
      proxyHostname: this.server1Info.hostname,
      proxyPort: this.server1Info.port.toString(),
      proxyProtocol: this.server1Info.protocol,
      sessionId: session.id,
      windowId: session.options.windowId
    });
  }

  closeSession(session) {
    session.proxy = null;
    this.openSessions.delete(session.id);
  }

}

exports.default = Proxy;

_defineProperty(Proxy, "MAX_REQUEST_HEADER_SIZE", 80 * 1024);

module.exports = exports.default;