"use strict";

exports.__esModule = true;
exports.default = void 0;

var _stream = require("stream");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const DEFAULT_STATUS_CODE = 200;

class IncomingMessageLike extends _stream.Readable {
  constructor(init = {}) {
    super();

    _defineProperty(this, "_body", void 0);

    _defineProperty(this, "headers", void 0);

    _defineProperty(this, "trailers", void 0);

    _defineProperty(this, "statusCode", void 0);

    const {
      headers,
      trailers,
      statusCode,
      body
    } = this._initOptions(init);

    this.headers = headers;
    this.trailers = trailers;
    this.statusCode = statusCode;
    this._body = this._initBody(body);
  }

  _initOptions(init) {
    return {
      headers: Object.assign({}, init.headers),
      trailers: Object.assign({}, init.trailers),
      statusCode: init.statusCode || DEFAULT_STATUS_CODE,
      body: init.body || Buffer.alloc(0)
    };
  }

  _initBody(body) {
    if (!body) return Buffer.alloc(0);else if (body instanceof Buffer) return body;
    const bodyStr = typeof body === 'object' ? JSON.stringify(body) : String(body);
    return Buffer.from(bodyStr);
  }

  _read() {
    this.push(this._body);
    this._body = null;
  }

  setBody(value) {
    this._body = value;
  }

  getBody() {
    return this._body;
  }

  static createFrom(res) {
    const {
      headers,
      trailers,
      statusCode
    } = res;
    return new IncomingMessageLike({
      headers,
      trailers,
      statusCode
    });
  }

  static isIncomingMessageLike(obj) {
    return obj instanceof IncomingMessageLike;
  }

}

exports.default = IncomingMessageLike;
module.exports = exports.default;