// Copyright 2017 Google Inc. All Rights Reserved.
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
 * @fileoverview Contains classes used to persist data and access it.
 */

/**
 * Creates a new storage instance.
 * @param {string} prefix The prefix to use for keys in the properties and cache.
 * @param {PropertiesService.Properties} properties The properties instance to use.
 * @param {CacheService.Cache} opt_cache The optional cache instance to use.
 * @constructor
 */
function Storage(prefix, properties, opt_cache) {
  this.prefix_ = prefix;
  this.properties_ = properties;
  this.cache_ = opt_cache;
  this.memory_ = {};
}

/**
 * The TTL for cache entries, in seconds.
 * @type {number}
 * @private
 */
Storage.CACHE_EXPIRATION_TIME_SECONDS = 21600;

/**
 * Gets a stored value.
 * @param {string} key The key.
 * @return {*} The stored value.
 */
Storage.prototype.getValue = function(key) { 
  // Check memory.
  if (this.memory_[key]) {
    return this.memory_[key];
  }
  
  var prefixedKey = this.getPrefixedKey_(key);
  var jsonValue, value;
  
  // Check cache.
  if (this.cache_ && (jsonValue = this.cache_.get(prefixedKey))) {
    value = JSON.parse(jsonValue);
    this.memory_[key] = value;
    return value;
  }

  // Check properties.
  if ((jsonValue = this.properties_.getProperty(prefixedKey))) {
    if (this.cache_) {
      this.cache_.put(prefixedKey, jsonValue, Storage.CACHE_EXPIRATION_TIME_SECONDS);
    }
    value = JSON.parse(jsonValue);
    this.memory_[key] = value;
    return value;
  }

  // Not found.
  return null;
};

/**
 * Stores a value.
 * @param {string} key The key.
 * @param {*} value The value.
 */
Storage.prototype.setValue = function(key, value) {
  var prefixedKey = this.getPrefixedKey_(key);
  var jsonValue = JSON.stringify(value);
  this.properties_.setProperty(prefixedKey, jsonValue);
  if (this.cache_) {
    this.cache_.put(prefixedKey, jsonValue, Storage.CACHE_EXPIRATION_TIME_SECONDS);
  }
  this.memory_[key] = value;
};

/**
 * Removes a stored value.
 * @param {string} key The key.
 */
Storage.prototype.removeValue = function(key) {
  var prefixedKey = this.getPrefixedKey_(key);
  this.properties_.deleteProperty(prefixedKey);
  if (this.cache_) {
    this.cache_.remove(prefixedKey);
  }
  delete this.memory_[key];
};

/**
 * Gets a key with the prefix applied.
 * @param {string} key The key.
 * @return {string} The key with the prefix applied.
 * @private
 */
Storage.prototype.getPrefixedKey_ = function(key) {
  if (!key) {
    return this.prefix_;
  } else {
    return this.prefix_ + '.' + key;
  }
};