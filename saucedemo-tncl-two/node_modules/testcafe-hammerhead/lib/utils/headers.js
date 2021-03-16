"use strict";

exports.__esModule = true;
exports.addAuthenticatePrefix = addAuthenticatePrefix;
exports.hasAuthenticatePrefix = hasAuthenticatePrefix;
exports.removeAuthenticatePrefix = removeAuthenticatePrefix;
exports.isAuthenticateHeader = isAuthenticateHeader;
exports.addAuthorizationPrefix = addAuthorizationPrefix;
exports.hasAuthorizationPrefix = hasAuthorizationPrefix;
exports.removeAuthorizationPrefix = removeAuthorizationPrefix;
exports.isAuthorizationHeader = isAuthorizationHeader;

var _builtinHeaderNames = _interopRequireDefault(require("../request-pipeline/builtin-header-names"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// -------------------------------------------------------------
// WARNING: this file is used by both the client and the server.
// Do not use any browser or node-specific API!
// -------------------------------------------------------------
const AUTHENTICATE_PREFIX = '~~~TestCafe added this prefix to hide the authentication dialog box~~~';
const AUTHORIZATION_PREFIX = '~~~TestCafe added this prefix to control the authorization flow~~~';

function addAuthenticatePrefix(value) {
  return AUTHENTICATE_PREFIX + value;
}

function hasAuthenticatePrefix(value) {
  return value.indexOf(AUTHENTICATE_PREFIX) > -1;
}

function removeAuthenticatePrefix(value) {
  return value.replace(AUTHENTICATE_PREFIX, '');
}

function isAuthenticateHeader(headerName) {
  const headerNameStr = String(headerName).toLowerCase();
  return headerNameStr === _builtinHeaderNames.default.wwwAuthenticate || headerNameStr === _builtinHeaderNames.default.proxyAuthenticate;
}

function addAuthorizationPrefix(value) {
  return AUTHORIZATION_PREFIX + value;
}

function hasAuthorizationPrefix(value) {
  return value.indexOf(AUTHORIZATION_PREFIX) > -1;
}

function removeAuthorizationPrefix(value) {
  return value.replace(AUTHORIZATION_PREFIX, '');
}

function isAuthorizationHeader(headerName) {
  const headerNameStr = String(headerName).toLowerCase();
  return headerNameStr === _builtinHeaderNames.default.authorization || headerNameStr === _builtinHeaderNames.default.proxyAuthorization;
}