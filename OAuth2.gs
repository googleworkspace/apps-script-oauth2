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
 * @fileoverview Contains the methods exposed by the library, and performs
 * any required setup.
 */

// Load the Underscore.js library. This library was added using the project
// key "MGwgKN2Th03tJ5OdmlzB8KPxhMjh3Sh48".
var _ = Underscore.load();

/**
 * The supported formats for the returned OAuth2 token.
 * @type {Object.<string, string>
 */
var TOKEN_FORMAT = {
  JSON: 'application/json',
  FORM_URL_ENCODED: 'application/x-www-form-urlencoded'
};

/**
 * Creates a new OAuth2 service with the name specified. It's usually best to create and
 * configure your service once at the start of your script, and then reference them during
 * the different phases of the authorization flow.
 * @param {string} serviceName The name of the service.
 * @return {Service_} The service object.
 */
function createService(serviceName) {
  return new Service_(serviceName);
}

/**
 * Returns the redirect URI that will be used for a given script. Often this URI
 * needs to be entered into a configuration screen of your OAuth provider.
 * @param {string} projectKey The project key of your script, which can be found in
 *     the Script Editor UI under "File > Project properties".
 * @return {string} The redirect URI.
 */
function getRedirectUri(projectKey) {
  return Utilities.formatString('https://script.google.com/macros/d/%s/usercallback', projectKey);
}
