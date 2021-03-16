"use strict";

exports.__esModule = true;
exports.forRequest = forRequest;
exports.forResponse = forResponse;
exports.transformHeadersCaseToRaw = transformHeadersCaseToRaw;
exports.setupPreventCachingHeaders = setupPreventCachingHeaders;

var _builtinHeaderNames = _interopRequireDefault(require("../builtin-header-names"));

var _http = require("../../utils/http");

var _transforms = require("./transforms");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const FORCED_REQ_HEADERS_BROWSER_CASES = [{
  lowerCase: _builtinHeaderNames.default.cookie,
  browserCase: 'Cookie'
}, {
  lowerCase: _builtinHeaderNames.default.origin,
  browserCase: 'Origin'
}];

function transformHeaders(srcHeaders, ctx, transformList, forcedTransforms) {
  const destHeaders = {};

  const applyTransform = function (headerName, headers, transforms) {
    const src = headers[headerName];
    const transform = transforms[headerName];
    const dest = transform ? transform(src, ctx) : src;
    if (dest !== void 0) destHeaders[headerName] = dest;
  };

  Object.keys(srcHeaders).forEach(headerName => applyTransform(headerName, srcHeaders, transformList));
  if (forcedTransforms) Object.keys(forcedTransforms).forEach(headerName => applyTransform(headerName, destHeaders, forcedTransforms));
  return destHeaders;
} // API


function forRequest(ctx) {
  return transformHeaders(ctx.req.headers, ctx, _transforms.requestTransforms, _transforms.forcedRequestTransforms);
}

function forResponse(ctx) {
  return transformHeaders(ctx.destRes.headers, ctx, _transforms.responseTransforms, _transforms.forcedResponseTransforms);
} // NOTE: We doesn't send a cross-domain client request as cross-domain.
// Therefore, the "origin" header can be absent and we cannot decide its case. GH-2382
// The similar situation also occurs with the forced "cookie" header.


function calculateForcedHeadersCase(headers, processedHeaders, headersNames) {
  const isBrowserRefererStartsWithUpperChar = processedHeaders.hasOwnProperty('Referer');

  for (const {
    lowerCase,
    browserCase
  } of FORCED_REQ_HEADERS_BROWSER_CASES) {
    if (isBrowserRefererStartsWithUpperChar && headers.hasOwnProperty(lowerCase)) {
      processedHeaders[browserCase] = headers[lowerCase];
      headersNames[headersNames.indexOf(lowerCase)] = void 0;
    }
  }
}

function transformOriginHeaders(headers, processedHeaders, headersNames, rawHeaders) {
  for (let i = 0; i < rawHeaders.length; i += 2) {
    const rawHeaderName = rawHeaders[i];
    const lowerCasedRawHeaderName = rawHeaderName.toLowerCase();
    const headerIndex = headersNames.indexOf(lowerCasedRawHeaderName);

    if (headerIndex > -1) {
      processedHeaders[rawHeaderName] = headers[lowerCasedRawHeaderName];
      headersNames[headerIndex] = void 0;
    }
  }
}

function addServiceHeaders(headers, processedHeaders, headersNames) {
  for (const headerName of headersNames) {
    if (headerName !== void 0) processedHeaders[headerName] = headers[headerName];
  }
}

function transformHeadersCaseToRaw(headers, rawHeaders) {
  const processedHeaders = {};
  const headersNames = Object.keys(headers);
  transformOriginHeaders(headers, processedHeaders, headersNames, rawHeaders);
  calculateForcedHeadersCase(headers, processedHeaders, headersNames);
  addServiceHeaders(headers, processedHeaders, headersNames);
  return processedHeaders;
}

function setupPreventCachingHeaders(headers) {
  headers[_builtinHeaderNames.default.cacheControl] = _http.PREVENT_CACHING_HEADERS[_builtinHeaderNames.default.cacheControl];
  headers[_builtinHeaderNames.default.pragma] = _http.PREVENT_CACHING_HEADERS[_builtinHeaderNames.default.pragma];
  delete headers[_builtinHeaderNames.default.eTag];
  delete headers[_builtinHeaderNames.default.expires];
}