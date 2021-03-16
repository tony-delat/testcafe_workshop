"use strict";

exports.__esModule = true;
exports.run = run;

var _context = _interopRequireDefault(require("./context"));

var _http = require("../utils/http");

var _logger = _interopRequireDefault(require("../utils/logger"));

var _stages = _interopRequireDefault(require("./stages"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function run(req, res, serverInfo, openSessions) {
  const ctx = new _context.default(req, res, serverInfo);

  _logger.default.proxy.onRequest(ctx);

  if (!ctx.dispatch(openSessions)) {
    _logger.default.proxy.onRequestError(ctx);

    (0, _http.respond404)(res);
    return;
  }

  for (let i = 0; i < _stages.default.length; i++) {
    await _stages.default[i](ctx);
    if (!ctx.goToNextStage) return;
  }
}