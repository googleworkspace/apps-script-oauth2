/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var MockBlob = require('./blob');
var URLSafeBase64 = require('urlsafe-base64');
var crypto = require('crypto');

var MockUtilities = function(optCache) {
  this.store = optCache || {};
  this.counter = 0;
};
  
MockUtilities.prototype.base64Encode = function(data) {
return Buffer.from(data).toString('base64');
};

MockUtilities.prototype.base64EncodeWebSafe = function(data) {
  return URLSafeBase64.encode(Buffer.from(data));
}

MockUtilities.prototype.base64DecodeWebSafe = function(data) {
  return URLSafeBase64.decode(data);
};

MockUtilities.prototype.computeRsaSha256Signature = function(data, key) {
  return Math.random().toString(36);
};

MockUtilities.prototype.newBlob = function(data) {
  return new MockBlob(data);
};

MockUtilities.prototype.DigestAlgorithm = {
    SHA_256: 'sha256'
};

MockUtilities.prototype.Charset = {
    US_ASCII: 'us_ascii'
};

MockUtilities.prototype.computeDigest = function(algorithm, data, charSet) {
    const hash = crypto.createHash(algorithm);
    hash.update(data);
    return hash.digest('utf8');
}

module.exports = MockUtilities;