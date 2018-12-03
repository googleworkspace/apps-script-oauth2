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
 * @file Contains the methods exposed by the library, and performs
 * any required setup.
 */

/**
 * The supported formats for the returned OAuth2 token.
 * @enum {string}
 */
var TOKEN_FORMAT = {
  /** JSON format, for example <code>{"access_token": "..."}</code> **/
  JSON: 'application/json',
  /** Form URL-encoded, for example <code>access_token=...</code> **/
  FORM_URL_ENCODED: 'application/x-www-form-urlencoded'
};

/**
 * The supported locations for passing the state parameter.
 * @enum {string}
 */
var STATE_PARAMETER_LOCATION = {
  /**
   * Pass the state parameter in the authorization URL.
   * @default
   */
  AUTHORIZATION_URL: 'authorization-url',
  /**
   * Pass the state token in the redirect URL, as a workaround for APIs that
   * don't support the state parameter.
   */
  REDIRECT_URL: 'redirect-url'
};

/**
 * Creates a new OAuth2 service with the name specified. It's usually best to
 * create and configure your service once at the start of your script, and then
 * reference them during the different phases of the authorization flow.
 * @param {string} serviceName The name of the service.
 * @return {Service_} The service object.
 */
function createService(serviceName) {
  return new Service_(serviceName);
}

/**
 * Returns the redirect URI that will be used for a given script. Often this URI
 * needs to be entered into a configuration screen of your OAuth provider.
 * @param {string} [optScriptId] The script ID of your script, which can be
 *     found in the Script Editor UI under "File > Project properties". Defaults
 *     to the script ID of the script being executed.
 * @return {string} The redirect URI.
 */
function getRedirectUri(optScriptId) {
  var scriptId = optScriptId || eval('Script' + 'App').getScriptId();
  return 'https://script.google.com/macros/d/' + encodeURIComponent(scriptId) +
      '/usercallback';
}

if (typeof module === 'object') {
  module.exports = {
    createService: createService,
    getRedirectUri: getRedirectUri,
    TOKEN_FORMAT: TOKEN_FORMAT,
    STATE_PARAMETER_LOCATION: STATE_PARAMETER_LOCATION
  };
}
