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
 * @file Contains the Service_ class.
 */

// Disable JSHint warnings for the use of eval(), since it's required to prevent
// scope issues in Apps Script.
// jshint evil:true

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
  this.tokenHeaders_ = null;
  this.tokenMethod_ = 'post';
  this.expirationMinutes_ = 60;
};

/**
 * The number of seconds before a token actually expires to consider it expired
 * and refresh it.
 * @type {number}
 * @private
 */
Service_.EXPIRATION_BUFFER_SECONDS_ = 60;

/**
 * The number of milliseconds that a token should remain in the cache.
 * @type {number}
 * @private
 */
Service_.LOCK_EXPIRATION_MILLISECONDS_ = 30 * 1000;

/**
 * Sets the service's authorization base URL (required). For Google services
 * this URL should be
 * https://accounts.google.com/o/oauth2/auth.
 * @param {string} authorizationBaseUrl The authorization endpoint base URL.
 * @return {!Service_} This service, for chaining.
 */
Service_.prototype.setAuthorizationBaseUrl = function(authorizationBaseUrl) {
  this.authorizationBaseUrl_ = authorizationBaseUrl;
  return this;
};

/**
 * Sets the service's token URL (required). For Google services this URL should
 * be https://accounts.google.com/o/oauth2/token.
 * @param {string} tokenUrl The token endpoint URL.
 * @return {!Service_} This service, for chaining.
 */
Service_.prototype.setTokenUrl = function(tokenUrl) {
  this.tokenUrl_ = tokenUrl;
  return this;
};

/**
 * Sets the service's refresh URL. Some OAuth providers require a different URL
 * to be used when generating access tokens from a refresh token.
 * @param {string} refreshUrl The refresh endpoint URL.
 * @return {!Service_} This service, for chaining.
 */
Service_.prototype.setRefreshUrl = function(refreshUrl) {
  this.refreshUrl_ = refreshUrl;
  return this;
};

/**
 * Sets the format of the returned token. Default: OAuth2.TOKEN_FORMAT.JSON.
 * @param {OAuth2.TOKEN_FORMAT} tokenFormat The format of the returned token.
 * @return {!Service_} This service, for chaining.
 */
Service_.prototype.setTokenFormat = function(tokenFormat) {
  this.tokenFormat_ = tokenFormat;
  return this;
};

/**
 * Sets the additional HTTP headers that should be sent when retrieving or
 * refreshing the access token.
 * @param {Object.<string,string>} tokenHeaders A map of header names to values.
 * @return {!Service_} This service, for chaining.
 */
Service_.prototype.setTokenHeaders = function(tokenHeaders) {
  this.tokenHeaders_ = tokenHeaders;
  return this;
};

/**
 * Sets the HTTP method to use when retrieving or refreshing the access token.
 * Default: "post".
 * @param {string} tokenMethod The HTTP method to use.
 * @return {!Service_} This service, for chaining.
 */
Service_.prototype.setTokenMethod = function(tokenMethod) {
  this.tokenMethod_ = tokenMethod;
  return this;
};

/**
 * @callback tokenHandler
 * @param tokenPayload {Object} A hash of parameters to be sent to the token
 *     URL.
 * @param tokenPayload.code {string} The authorization code.
 * @param tokenPayload.client_id {string} The client ID.
 * @param tokenPayload.client_secret {string} The client secret.
 * @param tokenPayload.redirect_uri {string} The redirect URI.
 * @param tokenPayload.grant_type {string} The type of grant requested.
 * @returns {Object} A modified hash of parameters to be sent to the token URL.
 */

/**
 * Sets an additional function to invoke on the payload of the access token
 * request.
 * @param {tokenHandler} tokenHandler tokenHandler A function to invoke on the
 *     payload of the request for an access token.
 * @return {!Service_} This service, for chaining.
 */
Service_.prototype.setTokenPayloadHandler = function(tokenHandler) {
  this.tokenPayloadHandler_ = tokenHandler;
  return this;
};

/**
 * Sets the name of the authorization callback function (required). This is the
 * function that will be called when the user completes the authorization flow
 * on the service provider's website. The callback accepts a request parameter,
 * which should be passed to this service's <code>handleCallback()</code> method
 * to complete the process.
 * @param {string} callbackFunctionName The name of the callback function.
 * @return {!Service_} This service, for chaining.
 */
Service_.prototype.setCallbackFunction = function(callbackFunctionName) {
  this.callbackFunctionName_ = callbackFunctionName;
  return this;
};

/**
 * Sets the client ID to use for the OAuth flow (required). You can create
 * client IDs in the "Credentials" section of a Google Developers Console
 * project. Although you can use any project with this library, it may be
 * convinient to use the project that was created for your script. These
 * projects are not visible if you visit the console directly, but you can
 * access it by click on the menu item "Resources > Advanced Google services" in
 * the Script Editor, and then click on the link "Google Developers Console" in
 * the resulting dialog.
 * @param {string} clientId The client ID to use for the OAuth flow.
 * @return {!Service_} This service, for chaining.
 */
Service_.prototype.setClientId = function(clientId) {
  this.clientId_ = clientId;
  return this;
};

/**
 * Sets the client secret to use for the OAuth flow (required). See the
 * documentation for <code>setClientId()</code> for more information on how to
 * create client IDs and secrets.
 * @param {string} clientSecret The client secret to use for the OAuth flow.
 * @return {!Service_} This service, for chaining.
 */
Service_.prototype.setClientSecret = function(clientSecret) {
  this.clientSecret_ = clientSecret;
  return this;
};

/**
 * Sets the property store to use when persisting credentials (required). In
 * most cases this should be user properties, but document or script properties
 * may be appropriate if you want to share access across users.
 * @param {PropertiesService.Properties} propertyStore The property store to use
 *     when persisting credentials.
 * @return {!Service_} This service, for chaining.
 * @see https://developers.google.com/apps-script/reference/properties/
 */
Service_.prototype.setPropertyStore = function(propertyStore) {
  this.propertyStore_ = propertyStore;
  return this;
};

/**
 * Sets the cache to use when persisting credentials (optional). Using a cache
 * will reduce the need to read from the property store and may increase
 * performance. In most cases this should be a private cache, but a public cache
 * may be appropriate if you want to share access across users.
 * @param {CacheService.Cache} cache The cache to use when persisting
 *     credentials.
 * @return {!Service_} This service, for chaining.
 * @see https://developers.google.com/apps-script/reference/cache/
 */
Service_.prototype.setCache = function(cache) {
  this.cache_ = cache;
  return this;
};

/**
 * Sets the lock to use when checking and refreshing credentials (optional).
 * Using a lock will ensure that only one execution will be able to access the
 * stored credentials at a time. This can prevent race conditions that arise
 * when two executions attempt to refresh an expired token.
 * @param {LockService.Lock} lock The lock to use when accessing credentials.
 * @return {!Service_} This service, for chaining.
 * @see https://developers.google.com/apps-script/reference/lock/
 */
Service_.prototype.setLock = function(lock) {
  this.lock_ = lock;
  return this;
};

/**
 * Sets the scope or scopes to request during the authorization flow (optional).
 * If the scope value is an array it will be joined using the separator before
 * being sent to the server, which is is a space character by default.
 * @param {string|Array.<string>} scope The scope or scopes to request.
 * @param {string} [optSeparator] The optional separator to use when joining
 *     multiple scopes. Default: space.
 * @return {!Service_} This service, for chaining.
 */
Service_.prototype.setScope = function(scope, optSeparator) {
  var separator = optSeparator || ' ';
  this.params_.scope = Array.isArray(scope) ? scope.join(separator) : scope;
  return this;
};

/**
 * Sets an additional parameter to use when constructing the authorization URL
 * (optional). See the documentation for your service provider for information
 * on what parameter values they support.
 * @param {string} name The parameter name.
 * @param {string} value The parameter value.
 * @return {!Service_} This service, for chaining.
 */
Service_.prototype.setParam = function(name, value) {
  this.params_[name] = value;
  return this;
};

/**
 * Sets the private key to use for Service Account authorization.
 * @param {string} privateKey The private key.
 * @return {!Service_} This service, for chaining.
 */
Service_.prototype.setPrivateKey = function(privateKey) {
  this.privateKey_ = privateKey;
  return this;
};

/**
 * Sets the issuer (iss) value to use for Service Account authorization.
 * If not set the client ID will be used instead.
 * @param {string} issuer This issuer value
 * @return {!Service_} This service, for chaining.
 */
Service_.prototype.setIssuer = function(issuer) {
  this.issuer_ = issuer;
  return this;
};

/**
 * Sets additional JWT claims to use for Service Account authorization.
 * @param {Object.<string,string>} additionalClaims The additional claims, as
 *     key-value pairs.
 * @return {!Service_} This service, for chaining.
 */
Service_.prototype.setAdditionalClaims = function(additionalClaims) {
  this.additionalClaims_ = additionalClaims;
  return this;
};

/**
 * Sets the subject (sub) value to use for Service Account authorization.
 * @param {string} subject This subject value
 * @return {!Service_} This service, for chaining.
 */
Service_.prototype.setSubject = function(subject) {
  this.subject_ = subject;
  return this;
};

/**
 * Sets number of minutes that a token obtained through Service Account
 * authorization should be valid. Default: 60 minutes.
 * @param {string} expirationMinutes The expiration duration in minutes.
 * @return {!Service_} This service, for chaining.
 */
Service_.prototype.setExpirationMinutes = function(expirationMinutes) {
  this.expirationMinutes_ = expirationMinutes;
  return this;
};

/**
 * Sets the OAuth2 grant_type to use when obtaining an access token. This does
 * not need to be set when using either the authorization code flow (AKA
 * 3-legged OAuth) or the service account flow. The most common usage is to set
 * it to "client_credentials" and then also set the token headers to include
 * the Authorization header required by the OAuth2 provider.
 * @param {string} grantType The OAuth2 grant_type value.
 * @return {!Service_} This service, for chaining.
 */
Service_.prototype.setGrantType = function(grantType) {
  this.grantType_ = grantType;
  return this;
};

/**
 * Sets the URI to redirect to when the OAuth flow has completed. By default the
 * library will provide this value automatically, but in some rare cases you may
 * need to override it.
 * @param {string} redirectUri The redirect URI.
 * @return {!Service_} This service, for chaining.
 */
Service_.prototype.setRedirectUri = function(redirectUri) {
  this.redirectUri_ = redirectUri;
  return this;
};

/**
 * Returns the redirect URI that will be used for this service. Often this URI
 * needs to be entered into a configuration screen of your OAuth provider.
 * @return {string} The redirect URI.
 */
Service_.prototype.getRedirectUri = function() {
  return this.redirectUri_ || getRedirectUri();
};

/**
 * Gets the authorization URL. The first step in getting an OAuth2 token is to
 * have the user visit this URL and approve the authorization request. The
 * user will then be redirected back to your application using callback function
 * name specified, so that the flow may continue.
 * @param {Object} optAdditionalParameters Additional parameters that should be
 *     stored in the state token and made available in the callback function.
 * @return {string} The authorization URL.
 */
Service_.prototype.getAuthorizationUrl = function(optAdditionalParameters) {
  validate_({
    'Client ID': this.clientId_,
    'Callback function name': this.callbackFunctionName_,
    'Authorization base URL': this.authorizationBaseUrl_
  });

  var stateTokenBuilder = eval('Script' + 'App').newStateToken()
      .withMethod(this.callbackFunctionName_)
      .withArgument('serviceName', this.serviceName_)
      .withTimeout(3600);
  if (optAdditionalParameters) {
    Object.keys(optAdditionalParameters).forEach(function(key) {
      stateTokenBuilder.withArgument(key, optAdditionalParameters[key]);
    });
  }
  var params = {
    client_id: this.clientId_,
    response_type: 'code',
    redirect_uri: this.getRedirectUri(),
    state: stateTokenBuilder.createToken()
  };
  params = extend_(params, this.params_);
  return buildUrl_(this.authorizationBaseUrl_, params);
};

/**
 * Completes the OAuth2 flow using the request data passed in to the callback
 * function.
 * @param {Object} callbackRequest The request data recieved from the callback
 *     function.
 * @return {boolean} True if authorization was granted, false if it was denied.
 */
Service_.prototype.handleCallback = function(callbackRequest) {
  var code = callbackRequest.parameter.code;
  var error = callbackRequest.parameter.error;
  if (error) {
    if (error == 'access_denied') {
      return false;
    } else {
      throw new Error('Error authorizing token: ' + error);
    }
  }
  validate_({
    'Client ID': this.clientId_,
    'Client Secret': this.clientSecret_,
    'Token URL': this.tokenUrl_
  });
  var payload = {
    code: code,
    client_id: this.clientId_,
    client_secret: this.clientSecret_,
    redirect_uri: this.getRedirectUri(),
    grant_type: 'authorization_code'
  };
  var token = this.fetchToken_(payload);
  this.saveToken_(token);
  return true;
};

/**
 * Determines if the service has access (has been authorized and hasn't
 * expired). If offline access was granted and the previous token has expired
 * this method attempts to generate a new token.
 * @return {boolean} true if the user has access to the service, false
 *     otherwise.
 */
Service_.prototype.hasAccess = function() {
  var token = this.getToken();
  if (token && !this.isExpired_(token)) return true; // Token still has access.
  var canGetToken = (token && this.canRefresh_(token)) ||
      this.privateKey_ || this.grantType_;
  if (!canGetToken) return false;

  return this.lockable_(function() {
    // Get the token again, bypassing the local memory cache.
    token = this.getToken(true);
    // Check to see if the token is no longer missing or expired, as another
    // execution may have refreshed it while we were waiting for the lock.
    if (token && !this.isExpired_(token)) return true; // Token now has access.
    try {
      if (token && this.canRefresh_(token)) {
        this.refresh();
        return true;
      } else if (this.privateKey_) {
        this.exchangeJwt_();
        return true;
      } else if (this.grantType_) {
        this.exchangeGrant_();
        return true;
      } else {
        // This should never happen, since canGetToken should have been false
        // earlier.
        return false;
      }
    } catch (e) {
      this.lastError_ = e;
      return false;
    }
  });
};

/**
 * Gets an access token for this service. This token can be used in HTTP
 * requests to the service's endpoint. This method will throw an error if the
 * user's access was not granted or has expired.
 * @return {string} An access token.
 */
Service_.prototype.getAccessToken = function() {
  if (!this.hasAccess()) {
    throw new Error('Access not granted or expired.');
  }
  var token = this.getToken();
  return token.access_token;
};

/**
 * Gets an id token for this service. This token can be used in HTTP
 * requests to the service's endpoint. This method will throw an error if the
 * user's access was not granted or has expired.
 * @return {string} An id token.
 */
Service_.prototype.getIdToken = function() {
  if (!this.hasAccess()) {
    throw new Error('Access not granted or expired.');
  }
  var token = this.getToken();
  return token.id_token;
};

/**
 * Resets the service, removing access and requiring the service to be
 * re-authorized. Also removes any additional values stored in the service's
 * storage.
 */
Service_.prototype.reset = function() {
  this.getStorage().reset();
};

/**
 * Gets the last error that occurred this execution when trying to automatically
 * refresh or generate an access token.
 * @return {Exception} An error, if any.
 */
Service_.prototype.getLastError = function() {
  return this.lastError_;
};

/**
 * Fetches a new token from the OAuth server.
 * @param {Object} payload The token request payload.
 * @param {string} [optUrl] The URL of the token endpoint.
 * @return {Object} The parsed token.
 */
Service_.prototype.fetchToken_ = function(payload, optUrl) {
  // Use the configured token URL unless one is specified.
  var url = optUrl || this.tokenUrl_;
  var headers = {
    'Accept': this.tokenFormat_
  };
  if (this.tokenHeaders_) {
    headers = extend_(headers, this.tokenHeaders_);
  }
  if (this.tokenPayloadHandler_) {
    payload = this.tokenPayloadHandler_(payload);
  }
  var response = UrlFetchApp.fetch(url, {
    method: this.tokenMethod_,
    headers: headers,
    payload: payload,
    muteHttpExceptions: true
  });
  return this.getTokenFromResponse_(response);
};

/**
 * Gets the token from a UrlFetchApp response.
 * @param {UrlFetchApp.HTTPResponse} response The response object.
 * @return {!Object} The parsed token.
 * @throws If the token cannot be parsed or the response contained an error.
 * @private
 */
Service_.prototype.getTokenFromResponse_ = function(response) {
  var token = this.parseToken_(response.getContentText());
  var resCode = response.getResponseCode();
  if ( resCode < 200 || resCode >= 300 || token.error) {
    var reason = [
      token.error,
      token.message,
      token.error_description,
      token.error_uri
    ].filter(Boolean).map(function(part) {
      return typeof(part) == 'string' ? part : JSON.stringify(part);
    }).join(', ');
    if (!reason) {
      reason = resCode + ': ' + JSON.stringify(token);
    }
    throw new Error('Error retrieving token: ' + reason);
  }
  return token;
};

/**
 * Parses the token using the service's token format.
 * @param {string} content The serialized token content.
 * @return {!Object} The parsed token.
 * @private
 */
Service_.prototype.parseToken_ = function(content) {
  var token;
  if (this.tokenFormat_ == TOKEN_FORMAT.JSON) {
    try {
      token = JSON.parse(content);
    } catch (e) {
      throw new Error('Token response not valid JSON: ' + e);
    }
  } else if (this.tokenFormat_ == TOKEN_FORMAT.FORM_URL_ENCODED) {
    token = content.split('&').reduce(function(result, pair) {
      var parts = pair.split('=');
      result[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
      return result;
    }, {});
  } else {
    throw new Error('Unknown token format: ' + this.tokenFormat_);
  }
  this.setExpiresAt_(token);
  return token;
};

/**
 * Adds expiresAt annotations on the token.
 * @param {string} token A token.
 * @private
 */
Service_.prototype.setExpiresAt_ = function(token) {
  // handle prior migrations
  if (token.expiresAt) {
    return;
  }

  // granted_time was added in prior versions of this library
  var grantedTime = token.granted_time || getTimeInSeconds_(new Date());
  var expiresIn = token.expires_in_sec || token.expires_in || token.expires;
  if (expiresIn) {
    var expiresAt = grantedTime + Number(expiresIn);
    token.expiresAt = expiresAt;
  }
  var refreshTokenExpiresIn = token.refresh_token_expires_in;
  if (refreshTokenExpiresIn) {
    var refreshTokenExpiresAt = grantedTime + Number(refreshTokenExpiresIn);
    token.refreshTokenExpiresAt = refreshTokenExpiresAt;
  }
};

/**
 * Refreshes a token that has expired. This is only possible if offline access
 * was requested when the token was authorized.
 */
Service_.prototype.refresh = function() {
  validate_({
    'Client ID': this.clientId_,
    'Client Secret': this.clientSecret_,
    'Token URL': this.tokenUrl_
  });

  this.lockable_(function() {
    var token = this.getToken();
    if (!token.refresh_token) {
      throw new Error('Offline access is required.');
    }
    var payload = {
      refresh_token: token.refresh_token,
      client_id: this.clientId_,
      client_secret: this.clientSecret_,
      grant_type: 'refresh_token',
    };
    var newToken = this.fetchToken_(payload, this.refreshUrl_);
    if (!newToken.refresh_token) {
      newToken.refresh_token = token.refresh_token;
    }
    this.setExpiresAt_(token);
    if (token.refreshTokenExpiresAt) {
      newToken.refreshTokenExpiresAt = token.refreshTokenExpiresAt;
    }
    this.saveToken_(newToken);
  });
};

/**
 * Gets the storage layer for this service, used to persist tokens.
 * Custom values associated with the service can be stored here as well.
 * The key <code>null</code> is used to to store the token and should not
 * be used.
 * @return {Storage_} The service's storage.
 */
Service_.prototype.getStorage = function() {
  if (!this.storage_) {
    var prefix = STORAGE_PREFIX_ + this.serviceName_;
    this.storage_ = new Storage_(prefix, this.propertyStore_, this.cache_);
  }
  return this.storage_;
};

/**
 * Saves a token to the service's property store and cache.
 * @param {Object} token The token to save.
 * @private
 */
Service_.prototype.saveToken_ = function(token) {
  this.getStorage().setValue(null, token);
};

/**
 * Gets the token from the service's property store or cache.
 * @param {boolean?} optSkipMemoryCheck If true, bypass the local memory cache
 *     when fetching the token.
 * @return {Object} The token, or null if no token was found.
 */
Service_.prototype.getToken = function(optSkipMemoryCheck) {
  // Gets the stored value under the null key, which is reserved for the token.
  return this.getStorage().getValue(null, optSkipMemoryCheck);
};

/**
 * Determines if a retrieved token is still valid. This will return false if
 * either the authorization token or the ID token has expired.
 * @param {Object} token The token to validate.
 * @return {boolean} True if it has expired, false otherwise.
 * @private
 */
Service_.prototype.isExpired_ = function(token) {
  var expired = false;
  var now = getTimeInSeconds_(new Date());

  // Check the authorization token's expiration.
  if (token.expiresAt) {
    if (token.expiresAt - now < Service_.EXPIRATION_BUFFER_SECONDS_) {
      expired = true;
    }
  }

  // Previous code path, provided for migration purpose, can be removed later
  var expiresIn = token.expires_in_sec || token.expires_in || token.expires;
  if (expiresIn) {
    var expiresTime = token.granted_time + Number(expiresIn);
    if (expiresTime - now < Service_.EXPIRATION_BUFFER_SECONDS_) {
      expired = true;
    }
  }

  // Check the ID token's expiration, if it exists.
  if (token.id_token) {
    var payload = decodeJwt_(token.id_token);
    if (payload.exp &&
        payload.exp - now < Service_.EXPIRATION_BUFFER_SECONDS_) {
      expired = true;
    }
  }

  return expired;
};

/**
 * Determines if a retrieved token can be refreshed.
 * @param {Object} token The token to inspect.
 * @return {boolean} True if it can be refreshed, false otherwise.
 * @private
 */
Service_.prototype.canRefresh_ = function(token) {
  if (!token.refresh_token) return false;
  this.setExpiresAt_(token);
  if (!token.refreshTokenExpiresAt) {
    return true;
  } else {
    var now = getTimeInSeconds_(new Date());
    return (
      token.refreshTokenExpiresAt - now < Service_.EXPIRATION_BUFFER_SECONDS_
    );
  }
};

/**
 * Uses the service account flow to exchange a signed JSON Web Token (JWT) for
 * an access token.
 * @private
 */
Service_.prototype.exchangeJwt_ = function() {
  validate_({
    'Token URL': this.tokenUrl_
  });
  var jwt = this.createJwt_();
  var payload = {
    assertion: jwt,
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer'
  };
  var token = this.fetchToken_(payload);
  this.saveToken_(token);
};

/**
 * Creates a signed JSON Web Token (JWT) for use with Service Account
 * authorization.
 * @return {string} The signed JWT.
 * @private
 */
Service_.prototype.createJwt_ = function() {
  validate_({
    'Private key': this.privateKey_,
    'Token URL': this.tokenUrl_,
    'Issuer or Client ID': this.issuer_ || this.clientId_
  });
  var now = new Date();
  var expires = new Date(now.getTime());
  expires.setMinutes(expires.getMinutes() + this.expirationMinutes_);
  var claimSet = {
    iss: this.issuer_ || this.clientId_,
    aud: this.tokenUrl_,
    exp: Math.round(expires.getTime() / 1000),
    iat: Math.round(now.getTime() / 1000)
  };
  if (this.subject_) {
    claimSet.sub = this.subject_;
  }
  if (this.params_.scope) {
    claimSet.scope = this.params_.scope;
  }
  if (this.additionalClaims_) {
    var additionalClaims = this.additionalClaims_;
    Object.keys(additionalClaims).forEach(function(key) {
      claimSet[key] = additionalClaims[key];
    });
  }
  return encodeJwt_(claimSet, this.privateKey_);
};

/**
 * Locks access to a block of code if a lock has been set on this service.
 * @param {function} func The code to execute.
 * @return {*} The result of the code block.
 * @private
 */
Service_.prototype.lockable_ = function(func) {
  var releaseLock = false;
  if (this.lock_ && !this.lock_.hasLock()) {
    this.lock_.waitLock(Service_.LOCK_EXPIRATION_MILLISECONDS_);
    releaseLock = true;
  }
  var result = func.apply(this);
  if (this.lock_ && releaseLock) {
    this.lock_.releaseLock();
  }
  return result;
};

/**
 * Obtain an access token using the custom grant type specified. Most often
 * this will be "client_credentials", and a client ID and secret are set an
 * "Authorization: Basic ..." header will be added using those values.
 */
Service_.prototype.exchangeGrant_ = function() {
  validate_({
    'Grant Type': this.grantType_,
    'Token URL': this.tokenUrl_
  });
  var payload = {
    grant_type: this.grantType_
  };
  payload = extend_(payload, this.params_);

  // For the client_credentials grant type, add a basic authorization header:
  // - If the client ID and client secret are set.
  // - No authorization header has been set yet.
  var lowerCaseHeaders = toLowerCaseKeys_(this.tokenHeaders_);
  if (this.grantType_ === 'client_credentials' &&
      this.clientId_ &&
      this.clientSecret_ &&
      (!lowerCaseHeaders || !lowerCaseHeaders.authorization)) {
    this.tokenHeaders_ = this.tokenHeaders_ || {};
    this.tokenHeaders_.authorization = 'Basic ' +
        Utilities.base64Encode(this.clientId_ + ':' + this.clientSecret_);
  }

  var token = this.fetchToken_(payload);
  this.saveToken_(token);
};
