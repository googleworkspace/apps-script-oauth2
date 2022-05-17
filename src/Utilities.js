// Copyright 2014 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @file Contains utility methods used by the library.
 */

/* exported buildUrl_ */
/**
 * Builds a complete URL from a base URL and a map of URL parameters.
 * @param {string} url The base URL.
 * @param {Object.<string, string>} params The URL parameters and values.
 * @return {string} The complete URL.
 * @private
 */
function buildUrl_(url, params) {
  var paramString = Object.keys(params).map(function(key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
  }).join('&');
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + paramString;
}

/* exported validate_ */
/**
 * Validates that all of the values in the object are non-empty. If an empty
 * value is found, and error is thrown using the key as the name.
 * @param {Object.<string, string>} params The values to validate.
 * @private
 */
function validate_(params) {
  Object.keys(params).forEach(function(name) {
    var value = params[name];
    if (!value) {
      throw new Error(name + ' is required.');
    }
  });
}

/* exported getTimeInSeconds_ */
/**
 * Gets the time in seconds, rounded down to the nearest second.
 * @param {Date} date The Date object to convert.
 * @return {number} The number of seconds since the epoch.
 * @private
 */
function getTimeInSeconds_(date) {
  return Math.floor(date.getTime() / 1000);
}

/* exported extend_ */
/**
 * Copy all of the properties in the source objects over to the
 * destination object, and return the destination object.
 * @param {Object} destination The combined object.
 * @param {Object} source The object who's properties are copied to the
 *     destination.
 * @return {Object} A combined object with the desination and source
 *     properties.
 * @see http://underscorejs.org/#extend
 */
function extend_(destination, source) {
  var keys = Object.keys(source);
  for (var i = 0; i < keys.length; ++i) {
    destination[keys[i]] = source[keys[i]];
  }
  return destination;
}

/* exported toLowerCaseKeys_ */
/**
 * Gets a copy of an object with all the keys converted to lower-case strings.
 *
 * @param {Object} obj The object to copy.
 * @return {Object} A shallow copy of the object with all lower-case keys.
 */
function toLowerCaseKeys_(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  // For each key in the source object, add a lower-case version to a new
  // object, and return it.
  return Object.keys(obj).reduce(function(result, k) {
    result[k.toLowerCase()] = obj[k];
    return result;
  }, {});
}

/* exported encodeJwt_ */
/**
 * Encodes and signs a JWT.
 *
 * @param {Object} payload The JWT payload.
 * @param {string} key The key to use when generating the signature.
 * @return {string} The encoded and signed JWT.
 */
function encodeJwt_(payload, key) {
  var header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  var toSign = Utilities.base64EncodeWebSafe(JSON.stringify(header)) + '.' +
      Utilities.base64EncodeWebSafe(JSON.stringify(payload));
  var signatureBytes =
      Utilities.computeRsaSha256Signature(toSign, key);
  var signature = Utilities.base64EncodeWebSafe(signatureBytes);
  return toSign + '.' + signature;
}

/* exported decodeJwt_ */
/**
 * Decodes and returns the parts of the JWT. The signature is not verified.
 *
 * @param {string} jwt The JWT to decode.
 * @return {Object} The decoded payload.
 */
function decodeJwt_(jwt) {
  var payload = jwt.split('.')[1];
  var blob = Utilities.newBlob(Utilities.base64DecodeWebSafe(payload));
  return JSON.parse(blob.getDataAsString());
}

/* exported encodeUrlSafeBase64NoPadding_ */
/**
 * Wrapper around base64 encoded to strip padding.
 * @param {string} value
 * @return {string} Web safe base64 encoded with padding removed.
 */
function encodeUrlSafeBase64NoPadding_(value) {
  let encodedValue = Utilities.base64EncodeWebSafe(value);
  encodedValue = encodedValue.slice(0, encodedValue.indexOf('='));
  return encodedValue;
}

/* exported encodeChallenge_ */
/**
 * Encodes a challenge string for PKCE.
 *
 * @param {string} method Encoding method (S256 or plain)
 * @param {string} codeVerifier String to encode
 * @return {string} BASE64(SHA256(ASCII(codeVerifier)))
 */
function encodeChallenge_(method, codeVerifier) {
  method = method.toLowerCase();

  if (method === 'plain') {
    return codeVerifier;
  }

  if (method === 's256') {
    const hashedValue = Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        codeVerifier,
        Utilities.Charset.US_ASCII);
    return encodeUrlSafeBase64NoPadding_(hashedValue);
  }

  throw new Error('Unsupported challenge method: ' + method);
}
