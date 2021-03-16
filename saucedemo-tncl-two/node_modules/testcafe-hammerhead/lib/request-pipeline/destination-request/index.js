"use strict";

exports.__esModule = true;
exports.default = void 0;

var _http = _interopRequireDefault(require("http"));

var _https = _interopRequireDefault(require("https"));

var _lodash = require("lodash");

var requestAgent = _interopRequireWildcard(require("./agent"));

var _events = require("events");

var _webauth = require("webauth");

var _connectionResetGuard = _interopRequireDefault(require("../connection-reset-guard"));

var _messages = require("../../messages");

var _logger = _interopRequireDefault(require("../../utils/logger"));

var requestCache = _interopRequireWildcard(require("../cache"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const TUNNELING_SOCKET_ERR_RE = /tunneling socket could not be established/i;
const TUNNELING_AUTHORIZE_ERR_RE = /statusCode=407/i;
const SOCKET_HANG_UP_ERR_RE = /socket hang up/i;
const IS_DNS_ERR_MSG_RE = /ECONNREFUSED|ENOTFOUND|EPROTO/;
const IS_DNS_ERR_CODE_RE = /ECONNRESET/;

class DestinationRequest extends _events.EventEmitter {
  constructor(opts, cache) {
    super();
    this.opts = opts;
    this.cache = cache;

    _defineProperty(this, "req", void 0);

    _defineProperty(this, "hasResponse", false);

    _defineProperty(this, "credentialsSent", false);

    _defineProperty(this, "aborted", false);

    _defineProperty(this, "protocolInterface", void 0);

    _defineProperty(this, "timeout", void 0);

    this.protocolInterface = this.opts.isHttps ? _https.default : _http.default;
    this.timeout = this.opts.isAjax ? opts.requestTimeout.ajax : opts.requestTimeout.page;
    if (this.opts.isHttps) opts.ignoreSSLAuth();
    requestAgent.assign(this.opts);

    this._send();
  }

  _sendReal(waitForData) {
    const preparedOptions = this.opts.prepare();
    this.req = this.protocolInterface.request(preparedOptions, res => {
      if (waitForData) {
        res.on('data', _lodash.noop);
        res.once('end', () => this._onResponse(res));
      }
    });

    if (_logger.default.destinationSocket.enabled) {
      this.req.on('socket', socket => {
        socket.once('data', data => _logger.default.destinationSocket.onFirstChunk(this.opts, data));
        socket.once('error', err => _logger.default.destinationSocket.onError(this.opts, err));
      });
    }

    if (!waitForData) this.req.on('response', res => this._onResponse(res));
    this.req.on('error', err => this._onError(err));
    this.req.on('upgrade', (res, socket, head) => this._onUpgrade(res, socket, head));
    this.req.setTimeout(this.timeout, () => this._onTimeout());
    this.req.write(this.opts.body);
    this.req.end();

    _logger.default.destination.onRequest(this.opts);
  }

  _send(waitForData) {
    (0, _connectionResetGuard.default)(() => {
      if (this.cache) {
        const cachedResponse = requestCache.getResponse(this.opts);

        if (cachedResponse) {
          // NOTE: To store async order of the 'response' event
          setImmediate(() => {
            this._emitOnResponse(cachedResponse.res);
          }, 0);

          _logger.default.destination.onCachedRequest(this.opts, cachedResponse.hitCount);

          return;
        }
      }

      this._sendReal(waitForData);
    });
  }

  _shouldResendWithCredentials(res) {
    if (res.statusCode === 401 && this.opts.credentials) {
      const authInfo = (0, _webauth.getAuthInfo)(res); // NOTE: If we get 401 status code after credentials are sent, we should stop trying to authenticate.

      if (!authInfo.isChallengeMessage && this.credentialsSent) return false;
      return authInfo.canAuthorize;
    }

    return false;
  }

  _onResponse(res) {
    _logger.default.destination.onResponse(this.opts, res);

    if (this._shouldResendWithCredentials(res)) this._resendWithCredentials(res);else if (!this.opts.isHttps && this.opts.proxy && res.statusCode === 407) {
      _logger.default.destination.onProxyAuthenticationError(this.opts);

      this._fatalError(_messages.MESSAGE.cantAuthorizeToProxy, this.opts.proxy.host);
    } else this._emitOnResponse(res);
  }

  _emitOnResponse(res) {
    this.hasResponse = true;
    this.emit('response', res);
  }

  _onUpgrade(res, socket, head) {
    _logger.default.destination.onUpgradeRequest(this.opts, res);

    if (head && head.length) socket.unshift(head);

    this._onResponse(res);
  }

  _resendWithCredentials(res) {
    _logger.default.destination.onResendWithCredentials(this.opts);

    (0, _webauth.addCredentials)(this.opts.credentials, this.opts, res, this.protocolInterface);
    this.credentialsSent = true; // NOTE: NTLM authentication requires using the same socket for the "negotiate" and "authenticate" requests.
    // So, before sending the "authenticate" message, we should wait for data from the "challenge" response. It
    // will mean that the socket is free.

    this._send((0, _webauth.requiresResBody)(res));
  }

  _fatalError(msg, url) {
    if (!this.aborted) {
      this.aborted = true;
      this.req.abort();
      this.emit('fatalError', (0, _messages.getText)(msg, {
        url: url || this.opts.url
      }));
    }
  }

  _isDNSErr(err) {
    return err.message && IS_DNS_ERR_MSG_RE.test(err.message) || !this.aborted && !this.hasResponse && err.code && IS_DNS_ERR_CODE_RE.test(err.code);
  }

  _isTunnelingErr(err) {
    return this.opts.isHttps && this.opts.proxy && err.message && TUNNELING_SOCKET_ERR_RE.test(err.message);
  }

  _isSocketHangUpErr(err) {
    return err.message && SOCKET_HANG_UP_ERR_RE.test(err.message) && // NOTE: At this moment, we determinate the socket hand up error by internal stack trace.
    // TODO: After what we will change minimal node.js version up to 8 need to rethink this code.
    err.stack && (err.stack.includes('createHangUpError') || err.stack.includes('connResetException'));
  }

  _onTimeout() {
    _logger.default.destination.onTimeoutError(this.opts, this.timeout); // NOTE: this handler is also called if we get an error response (for example, 404). So, we should check
    // for the response presence before raising the timeout error.


    if (!this.hasResponse) this._fatalError(_messages.MESSAGE.destRequestTimeout);
  }

  _onError(err) {
    _logger.default.destination.onError(this.opts, err);

    if (this._isSocketHangUpErr(err)) this.emit('socketHangUp');else if (requestAgent.shouldRegressHttps(err, this.opts)) {
      requestAgent.regressHttps(this.opts);

      this._send();
    } else if (this._isTunnelingErr(err)) {
      if (TUNNELING_AUTHORIZE_ERR_RE.test(err.message)) this._fatalError(_messages.MESSAGE.cantAuthorizeToProxy, this.opts.proxy.host);else this._fatalError(_messages.MESSAGE.cantEstablishTunnelingConnection, this.opts.proxy.host);
    } else if (this._isDNSErr(err)) {
      if (!this.opts.isHttps && this.opts.proxy) this._fatalError(_messages.MESSAGE.cantEstablishProxyConnection, this.opts.proxy.host);else this._fatalError(_messages.MESSAGE.cantResolveUrl);
    } else this.emit('error', err);
  }

}

exports.default = DestinationRequest;
module.exports = exports.default;