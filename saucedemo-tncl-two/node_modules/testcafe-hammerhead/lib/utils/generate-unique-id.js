"use strict";

exports.__esModule = true;
exports.default = _default;

var _nanoid = require("nanoid");

const UNIQUE_ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DEFAULT_ID_LENGTH = 9;

function _default(length) {
  const generator = (0, _nanoid.customAlphabet)(UNIQUE_ID_ALPHABET, length || DEFAULT_ID_LENGTH);
  return generator();
}

module.exports = exports.default;