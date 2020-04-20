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
 * @file Contains classes used to persist data and access it.
 */

/**
 * Creates a new Storage_ instance, which is used to persist OAuth tokens and
 * related information.
 * @param {string} prefix The prefix to use for keys in the properties and
 *     cache.
 * @param {PropertiesService.Properties} optProperties The optional properties
 *     instance to use.
 * @param {CacheService.Cache} [optCache] The optional cache instance to use.
 * @constructor
 */
function Storage_(prefix, optProperties, optCache) {
  this.prefix_ = prefix;
  this.properties_ = optProperties;
  this.cache_ = optCache;
  this.memory_ = {};
}

/**
 * The TTL for cache entries, in seconds.
 * @type {number}
 * @private
 */
Storage_.CACHE_EXPIRATION_TIME_SECONDS = 21600; // 6 hours.

/**
 * The special value to use in the cache to indicate that there is no value.
 * @type {string}
 * @private
 */
Storage_.CACHE_NULL_VALUE = '__NULL__';

/**
 * Gets a stored value.
 * @param {string} key The key.
 * @param {boolean?} optSkipMemoryCheck Whether to bypass the local memory cache
 *     when fetching the value (the default is false).
 * @return {*} The stored value.
 */
Storage_.prototype.getValue = function(key, optSkipMemoryCheck) {
  var prefixedKey = this.getPrefixedKey_(key);
  var jsonValue;
  var value;

  if (!optSkipMemoryCheck) {
    // Check in-memory cache.
    if (value = this.memory_[prefixedKey]) {
      if (value === Storage_.CACHE_NULL_VALUE) {
        return null;
      }
      return value;
    }
  }

  // Check cache.
  if (this.cache_ && (jsonValue = this.cache_.get(prefixedKey))) {
    value = JSON.parse(jsonValue);
    this.memory_[prefixedKey] = value;
    if (value === Storage_.CACHE_NULL_VALUE) {
      return null;
    }
    return value;
  }

  // Check properties.
  if (this.properties_ &&
      (jsonValue = this.properties_.getProperty(prefixedKey))) {
    if (this.cache_) {
      this.cache_.put(prefixedKey,
          jsonValue, Storage_.CACHE_EXPIRATION_TIME_SECONDS);
    }
    value = JSON.parse(jsonValue);
    this.memory_[prefixedKey] = value;
    return value;
  }

  // Not found. Store a special null value in the memory and cache to reduce
  // hits on the PropertiesService.
  this.memory_[prefixedKey] = Storage_.CACHE_NULL_VALUE;
  if (this.cache_) {
    this.cache_.put(prefixedKey, JSON.stringify(Storage_.CACHE_NULL_VALUE),
        Storage_.CACHE_EXPIRATION_TIME_SECONDS);
  }
  return null;
};

/**
 * Stores a value.
 * @param {string} key The key.
 * @param {*} value The value.
 */
Storage_.prototype.setValue = function(key, value) {
  var prefixedKey = this.getPrefixedKey_(key);
  var jsonValue = JSON.stringify(value);
  if (this.properties_) {
    this.properties_.setProperty(prefixedKey, jsonValue);
  }
  if (this.cache_) {
    this.cache_.put(prefixedKey, jsonValue,
        Storage_.CACHE_EXPIRATION_TIME_SECONDS);
  }
  this.memory_[prefixedKey] = value;
};

/**
 * Removes a stored value.
 * @param {string} key The key.
 */
Storage_.prototype.removeValue = function(key) {
  var prefixedKey = this.getPrefixedKey_(key);
  this.removeValueWithPrefixedKey_(prefixedKey);
};

/**
 * Resets the storage, removing all stored data.
 * @param {string} key The key.
 */
Storage_.prototype.reset = function() {
  var prefix = this.getPrefixedKey_();
  var prefixedKeys = Object.keys(this.memory_);
  if (this.properties_) {
    var props = this.properties_.getProperties();
    prefixedKeys = Object.keys(props).filter(function(prefixedKey) {
      return prefixedKey === prefix || prefixedKey.indexOf(prefix + '.') === 0;
    });
  }
  for (var i = 0; i < prefixedKeys.length; i++) {
    this.removeValueWithPrefixedKey_(prefixedKeys[i]);
  };
};

/**
 * Removes a stored value.
 * @param {string} prefixedKey The key.
 */
Storage_.prototype.removeValueWithPrefixedKey_ = function(prefixedKey) {
  if (this.properties_) {
    this.properties_.deleteProperty(prefixedKey);
  }
  if (this.cache_) {
    this.cache_.remove(prefixedKey);
  }
  delete this.memory_[prefixedKey];
};

/**
 * Gets a key with the prefix applied.
 * @param {string} key The key.
 * @return {string} The key with the prefix applied.
 * @private
 */
Storage_.prototype.getPrefixedKey_ = function(key) {
  if (key) {
    return this.prefix_ + '.' + key;
  } else {
    return this.prefix_;
  }
};
