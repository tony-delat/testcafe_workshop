"use strict";

exports.__esModule = true;
exports.default = createSpecialPageResponse;

var _incomingMessageLike = _interopRequireDefault(require("./incoming-message-like"));

var _builtinHeaderNames = _interopRequireDefault(require("./builtin-header-names"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createSpecialPageResponse() {
  return new _incomingMessageLike.default({
    headers: {
      [_builtinHeaderNames.default.contentType]: 'text/html',
      [_builtinHeaderNames.default.contentLength]: '0'
    }
  });
}

module.exports = exports.default;