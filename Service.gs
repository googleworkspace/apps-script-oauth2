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
 * @fileoverview Contains the Service_ class.
 */

/**
 * Creates a new OAuth2 service.
 * @param {string} serviceName The name of the service.
 * @constructor
 */
var Service_ = function(serviceName) {
  validate_({
    'Service name': serviceName
  });
  this.serviceName_ = serviceName;
  this.params_ = {};
  this.tokenFormat_ = TOKEN_FORMAT.JSON;
};

/**
 * The number of seconds before a token actually expires to consider it expired and refresh it.
 * @type {number}
 * @private
 */
Service_.EXPIRATION_BUFFER_SECONDS_ = 60;

/**
 * Sets the service's authorization base URL (required). For Google services this URL should be
 * https://accounts.google.com/o/oauth2/auth.
 * @param {string} authorizationBaseUrl The authorization endpoint base URL.
 * @return {Service_} This service, for chaining.
 */
Service_.prototype.setAuthorizationBaseUrl = function(authorizationBaseUrl) {
  this.authorizationBaseUrl_ = authorizationBaseUrl;
  return this;
};

/**
 * Sets the service's token URL (required). For Google services this URL should be
 * https://accounts.google.com/o/oauth2/token.
 * @param {string} tokenUrl The token endpoint URL.
 * @return {Service_} This service, for chaining.
 */
Service_.prototype.setTokenUrl = function(tokenUrl) {
  this.tokenUrl_ = tokenUrl;
  return this;
};

/**
 * Sets the format of the returned token. Default: Service_.TOKEN_FORMAT.JSON.
 * @param {TOKEN_FORMAT} tokenFormat The format of the returned token.
 * @return {Service_} This service, for chaining.
 */
Service_.prototype.setTokenFormat = function(tokenFormat) {
  this.tokenFormat_ = tokenFormat;
  return this;
};

/**
 * Sets the project key of the script that contains the authorization callback function (required).
 * The project key can be found in the Script Editor UI under "File > Project properties".
 * @param {string} projectKey The project key of the project containing the callback function.
 * @return {Service_} This service, for chaining.
 */
Service_.prototype.setProjectKey = function(projectKey) {
  this.projectKey_ = projectKey;
  return this;
};

/**
 * Sets the name of the authorization callback function (required). This is the function that will be
 * called when the user completes the authorization flow on the service provider's website.
 * The callback accepts a request parameter, which should be passed to this service's
 * <code>handleCallback()</code> method to complete the process.
 * @param {Object} callbackFunction The callback function.
 * @return {Service_} This service, for chaining.
 */
Service_.prototype.setCallbackFunction = function(callbackFunction) {
  this.callbackFunction_ = callbackFunction;
  return this;
};

/**
 * Sets the client ID to use for the OAuth flow (required). You can create client IDs in the
 * "Credentials" section of a Google Developers Console project. Although you can
 * use any project with this library, it may be convinient to use the project that
 * was created for your script. These projects are not visible if you visit the
 * console directly, but you can access it by click on the menu item
 * "Resources > Advanced Google services" in the Script Editor, and then click on the link
 * "Google Developers Console" in the resulting dialog.
 * @param {string} clientId The client ID to use for the OAuth flow.
 * @return {Service_} This service, for chaining.
 */
Service_.prototype.setClientId = function(clientId) {
  this.clientId_ = clientId;
  return this;
};

/**
 * Sets the client secret to use for the OAuth flow (required). See the documentation for
 * <code>setClientId()</code> for more information on how to create client IDs
 * and secrets.
 * @param {string} clientSecret The client secret to use for the OAuth flow.
 * @return {Service_} This service, for chaining.
 */
Service_.prototype.setClientSecret = function(clientSecret) {
  this.clientSecret_ = clientSecret;
  return this;
};

/**
 * Sets the property store to use when persisting credentials (required). In most cases this should
 * be user properties, but document or script properties may be appropriate if you want
 * to share access across users.
 * @param {PropertiesService.Properties} propertyStore The property store to use when persisting credentials.
 * @return {Service_} This service, for chaining.
 */
Service_.prototype.setPropertyStore = function(propertyStore) {
  this.propertyStore_ = propertyStore;
  return this;
};

/**
 * Sets the cache to use when persisting credentials (optional). Using a cache will reduce the need to
 * read from the property store and may increase performance. In most cases this should be a private cache,
 * but a public cache may be appropriate if you want to share access across users.
 * @param {CacheService.Cache} cache The cache to use when persisting credentials.
 * @return {Service_} This service, for chaining.
 */
Service_.prototype.setCache = function(cache) {
  this.cache_ = cache;
  return this;
};

/**
 * Sets the scope or scopes to request during the authorization flow (optional). If the scope value
 * is an array it will be joined using the separator before being sent to the server, which is
 * is a space character by default.
 * @param {string|Array.<string>} scope The scope or scopes to request.
 * @param {string} opt_separator The optional separator to use when joining multiple scopes. Default: space.
 * @return {Service_} This service, for chaining.
 */
Service_.prototype.setScope = function(scope, opt_separator) {
  var separator = opt_separator || ' ';
  this.params_['scope'] = _.isArray(scope) ? scope.join(separator) : scope;
  return this;
};

/**
 * Sets an additional parameter to use when constructing the authorization URL (optional). See the documentation
 * for your service provider for information on what parameter values they support.
 * @param {string} name The parameter name.
 * @param {string} value The parameter value.
 * @return {Service_} This service, for chaining.
 */
Service_.prototype.setParam = function(name, value) {
  this.params_[name] = value;
  return this;
};

/**
 * Gets the authorization URL. The first step in getting an OAuth2 token is to
 * have the user visit this URL and approve the authorization request. The
 * user will then be redirected back to your application using the
 * project key and callback function name specified, so that the flow may continue.
 * @returns {string} The authorization URL.
 */
Service_.prototype.getAuthorizationUrl = function() {
  validate_({
    'Client ID': this.clientId_,
    'Project key': this.projectKey_,
    'Callback function name': this.callbackFunction_,
    'Authorization base URL': this.authorizationBaseUrl_
  });

  var redirectUri = getRedirectUri(this.projectKey_);
  var state = ScriptApp.newStateToken()
      .withMethod(this.callbackFunction_)
      .withArgument('serviceName', this.serviceName_)
      .withTimeout(3600)
      .createToken();
  var params = {
    client_id: this.clientId_,
    response_type: 'code',
    redirect_uri: redirectUri,
    state: state
  };
  params = _.extend(params, this.params_);
  return buildUrl_(this.authorizationBaseUrl_, params);
};

/**
 * Completes the OAuth2 flow using the request data passed in to the callback function.
 * @param {Object} callbackRequest The request data recieved from the callback function.
 * @return {boolean} True if authorization was granted, false if it was denied.
 */
Service_.prototype.handleCallback = function(callbackRequest) {
  var code = callbackRequest.parameter.code;
  var error = callbackRequest.parameter.error;
  if (error) {
    if (error == 'access_denied') {
      return false;
    } else {
      throw 'Error authorizing token: ' + error;
    }
  }
  validate_({
    'Client ID': this.clientId_,
    'Client Secret': this.clientSecret_,
    'Project key': this.projectKey_,
    'Token URL': this.tokenUrl_
  });
  var redirectUri = getRedirectUri(this.projectKey_);
  var response = UrlFetchApp.fetch(this.tokenUrl_, {
    method: 'post',
    payload: {
      code: code,
      client_id: this.clientId_,
      client_secret: this.clientSecret_,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    },
    muteHttpExceptions: true
  });
  var token = this.parseToken_(response.getContentText());
  if (response.getResponseCode() != 200) {
    var reason = token.error ? token.error : response.getResponseCode();
    throw 'Error retrieving token: ' + reason;
  }
  this.saveToken_(token);
  return true;
};

/**
 * Determines if the service has access (has been authorized and hasn't expired).
 * If offline access was granted and the previous token has expired this method attempts to
 * generate a new token.
 * @return {boolean} true if the user has access to the service, false otherwise.
 */
Service_.prototype.hasAccess = function() {
  var token = this.getToken_();
  if (!token) {
    return false;
  }
  var expires_in = token.expires_in || token.expires;
  if (expires_in) {
    var expires_time = token.granted_time + expires_in;
    var now = getTimeInSeconds_();
    if (expires_time - now < Service_.EXPIRATION_BUFFER_SECONDS_) {
      if (token.refresh_token) {
        this.refresh_();
      } else {
        return false;
      }
    }
  }
  return true;
};

/**
 * Gets an access token for this service. This token can be used in HTTP requests
 * to the service's endpoint. This method will throw an error if the user's
 * access was not granted or has expired.
 * @return {string} An access token.
 */
Service_.prototype.getAccessToken = function() {
  if (!this.hasAccess()) {
    throw 'Access not granted or expired.';
  }
  var token = this.getToken_();
  return token.access_token;
};

/**
 * Resets the service, removing access and requiring the service to be re-authorized.
 */
Service_.prototype.reset = function() {
  validate_({
    'Property store': this.propertyStore_
  });
  this.propertyStore_.deleteProperty(this.getPropertyKey(this.serviceName_));
};

/**
 * Parses the token using the service's token format.
 * @param {string} content The serialized token content.
 * @return {Object} The parsed token.
 * @private
 */
Service_.prototype.parseToken_ = function(content) {
  var token;
  if (this.tokenFormat_ == TOKEN_FORMAT.JSON) {
    try {
      token = JSON.parse(content);
    } catch (e) {
      throw 'Token response not valid JSON: ' + e;
    }
  } else if (this.tokenFormat_ = TOKEN_FORMAT.FORM_URL_ENCODED) {
    token = content.split('&').reduce(function(result, pair) {
      var parts = pair.split('=');
      result[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
      return result;
    }, {});
  } else {
    throw 'Unknown token format: ' + this.tokenFormat_;
  }
  token.granted_time = getTimeInSeconds_();
  return token;
};

/**
 * Refreshes a token that has expired. This is only possible if offline access was
 * requested when the token was authorized.
 * @private
 */
Service_.prototype.refresh_ = function() {
  validate_({
    'Client ID': this.clientId_,
    'Client Secret': this.clientSecret_,
    'Token URL': this.tokenUrl_
  });
  var token = this.getToken_();
  if (!token.refresh_token) {
    throw 'Offline access is required.';
  }
  var response = UrlFetchApp.fetch(this.tokenUrl_, {
    method: 'post',
    payload: {
      refresh_token: token.refresh_token,
      client_id: this.clientId_,
      client_secret: this.clientSecret_,
      grant_type: 'refresh_token'
    },
    muteHttpExceptions: true
  });
  var newToken = this.parseToken_(response.getContentText());
  if (response.getResponseCode() != 200) {
    var reason = newToken.error ? newToken.error : response.getResponseCode();
    throw 'Error refreshing token: ' + reason;
  }
  if (!newToken.refresh_token) {
    newToken.refresh_token = token.refresh_token;
  }
  this.saveToken_(newToken);
};

/**
 * Saves a token to the service's property store and cache.
 * @param {Object} token The token to save.
 * @private
 */
Service_.prototype.saveToken_ = function(token) {
  validate_({
    'Property store': this.propertyStore_
  });
  var key = this.getPropertyKey(this.serviceName_);
  var value = JSON.stringify(token);
  this.propertyStore_.setProperty(key, value);
  if (this.cache_) {
    this.cache_.put(key, value, 21600);
  }
};

/**
 * Gets the token from the service's property store or cache.
 * @return {Object} The token, or null if no token was found.
 * @private
 */
Service_.prototype.getToken_ = function() {
  validate_({
    'Property store': this.propertyStore_
  });
  var key = this.getPropertyKey(this.serviceName_);
  var token;
  if (this.cache_) {
    token = this.cache_.get(key);
  }
  if (!token) {
    token = this.propertyStore_.getProperty(key);
  }
  if (token) {
    if (this.cache_) {
      this.cache_.put(key, token, 21600);
    }
    return JSON.parse(token);
  } else {
    return null;
  }
};

/**
 * Generates the property key for a given service name.
 * @param {string} serviceName The name of the service.
 * @return {string} The property key.
 * @private
 */
Service_.prototype.getPropertyKey = function(serviceName) {
  return 'oauth2.' + serviceName;
};

