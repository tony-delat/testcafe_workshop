"use strict";

exports.__esModule = true;
exports.default = _default;

var _lodash = require("lodash");

function _default(err) {
  const isError = err instanceof Error;
  return isError ? err.toString() : (0, _lodash.escape)(String(err));
}

module.exports = exports.default;