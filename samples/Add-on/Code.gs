/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @OnlyCurrentDoc  Limits the add-on to only accessing the current spreadsheet.
 */

/*
 * The GitHub OAuth2 client ID and secret.
 */
var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Adds a custom menu with items to show the sidebar.
 * @param {Object} e The event parameter for a simple onOpen trigger.
 */
function onOpen(e) {
  SpreadsheetApp.getUi()
      .createAddonMenu()
      .addItem('Show Sidebar', 'showSidebar')
      .addToUi();
}

/**
 * Runs when the add-on is installed; calls onOpen() to ensure menu creation and
 * any other initializion work is done immediately.
 * @param {Object} e The event parameter for a simple onInstall trigger.
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Opens a sidebar. The sidebar structure is described in the Sidebar.html
 * project file.
 */
function showSidebar() {
  var service = getGitHubService();
  var template = HtmlService.createTemplateFromFile('Sidebar');
  template.email = Session.getEffectiveUser().getEmail();
  template.isSignedIn = service.hasAccess();
  var page = template.evaluate()
      .setTitle('Sidebar')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  SpreadsheetApp.getUi().showSidebar(page);
}

/**
 * Builds and returns the authorization URL from the service object.
 * @return {String} The authorization URL.
 */
function getAuthorizationUrl() {
  return getGitHubService().getAuthorizationUrl();
}

/**
 * Resets the API service, forcing re-authorization before
 * additional authorization-required API calls can be made.
 */
function signOut() {
  getGitHubService().reset();
}

/**
 * Gets the user's GitHub profile.
 */
function getGitHubProfile() {
  var service = getGitHubService();
  if (!service.hasAccess()) {
    throw new Error('Error: Missing GitHub authorization.');
  }
  var url = 'https://api.github.com/user';
  var response = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: 'Bearer ' + service.getAccessToken()
    }
  });
  return JSON.parse(response.getContentText());
}

/**
 * Gets the user's GitHub repos.
 */
function getGitHubRepos() {
  var service = getGitHubService();
  if (!service.hasAccess()) {
    throw new Error('Error: Missing GitHub authorization.');
  }
  var url = 'https://api.github.com/user/repos';
  var response = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: 'Bearer ' + service.getAccessToken()
    }
  });
  return JSON.parse(response.getContentText());
}

/**
 * Gets an OAuth2 service configured for the GitHub API.
 * @return {OAuth2.Service} The OAuth2 service
 */
function getGitHubService() {
  return OAuth2.createService('github')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://github.com/login/oauth/authorize')
      .setTokenUrl('https://github.com/login/oauth/access_token')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties());
}

/**
 * Callback handler that is executed after an authorization attempt.
 * @param {Object} request The results of API auth request.
 */
function authCallback(request) {
  var template = HtmlService.createTemplateFromFile('Callback');
  template.email = Session.getEffectiveUser().getEmail();
  template.isSignedIn = false;
  template.error = null;
  var title;
  try {
    var service = getGitHubService();
    var authorized = service.handleCallback(request);
    template.isSignedIn = authorized;
    title = authorized ? 'Access Granted' : 'Access Denied';
  } catch (e) {
    template.error = e;
    title = 'Access Error';
  }
  template.title = title;
  return template.evaluate()
      .setTitle(title)
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * Logs the redict URI to register in the Google Developers Console.
 */
function logRedirectUri() {
  var service = getGitHubService();
  Logger.log(service.getRedirectUri());
}

/**
 * Includes the given project HTML file in the current HTML project file.
 * Also used to include JavaScript.
 * @param {String} filename Project file name.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
