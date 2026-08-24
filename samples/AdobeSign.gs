/*
 * This sample demonstrates how to configure the library for the Adobe Sign API.
 * Instructions on how to generate OAuth keys is available here:
 * https://www.adobe.io/apis/documentcloud/sign/docs/step-by-step-guide/configure-oauth.html
 */

var CLIENT_ID = '...';
var CLIENT_SECRET = '...';
var API_ACCESS_POINT_KEY = 'api_access_point';

/**
 * Authorizes and makes a request to the Adobe Sign API.
 */
function run() {
  var service = getService_();
  if (service.hasAccess()) {
    // Retrieve the API access point from storage.
    var apiAccessPoint = service.getStorage().getValue(API_ACCESS_POINT_KEY);
    var url = apiAccessPoint + 'api/rest/v5/users/me';
    var response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      }
    });
    var result = JSON.parse(response.getContentText());
    Logger.log(JSON.stringify(result, null, 2));
  } else {
    if (service.getLastError()) {
      Logger.log(service.getLastError());
    }
    var authorizationUrl = service.getAuthorizationUrl();
    Logger.log('Open the following URL and re-run the script: %s',
        authorizationUrl);
  }
}

/**
 * Reset the authorization state, so that it can be re-tested.
 */
function reset() {
  getService_().reset();
}

/**
 * Configures the service.
 */
function getService_(optApiAccessPoint) {
  var service = OAuth2.createService('AdobeSign')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://secure.echosign.com/public/oauth')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      // Use per-user properties only: script properties are shared by every
      // user of a deployment, which would leak one user's tokens and stored
      // API access point to all other users.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the scopes.
      .setScope('user_read');

  // Set the token and refresh URL using the API access point passed in or
  // stored in the token.
  var apiAccessPoint = optApiAccessPoint ||
      service.getStorage().getValue(API_ACCESS_POINT_KEY);
  if (apiAccessPoint) {
    service.setTokenUrl(apiAccessPoint + 'oauth/token');
    service.setRefreshUrl(apiAccessPoint + 'oauth/refresh');
  }

  return service;
}

/**
 * Handles the OAuth callback.
 */
function authCallback(request) {
  // Get the API access point specified in the URL parameters.
  var apiAccessPoint = request.parameter[API_ACCESS_POINT_KEY];
  // Only accept API access points on Adobe-owned hosts. This parameter is
  // attacker-controllable in web-app/add-on deployments, and an unchecked
  // value sends the token exchange (code, client_id, client_secret) and all
  // later refreshes to an arbitrary host.
  if (apiAccessPoint && !isValidApiAccessPoint_(apiAccessPoint)) {
    return HtmlService.createHtmlOutput('Denied.');
  }
  var service = getService_(apiAccessPoint);
  var authorized = service.handleCallback(request);
  if (authorized) {
    // Save the API access point in the service's storage.
    service.getStorage().setValue(API_ACCESS_POINT_KEY, apiAccessPoint);
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied.');
  }
}

/**
 * Determines whether the given API access point is on an Adobe-owned host.
 * @param {string} apiAccessPoint The API access point URL to validate.
 * @return {boolean} True if the host is an Adobe domain served over HTTPS.
 */
function isValidApiAccessPoint_(apiAccessPoint) {
  var match = /^https:\/\/([a-zA-Z0-9.-]+)(\/|$)/.exec(apiAccessPoint);
  if (!match) {
    return false;
  }
  var host = match[1].toLowerCase();
  return /(^|\.)adobe\.com$/.test(host) || /(^|\.)adobesign\.com$/.test(host) ||
      /(^|\.)echosign\.com$/.test(host);
}

/**
 * Logs the redict URI to register in the Dropbox application settings.
 */
function logRedirectUri() {
  Logger.log(OAuth2.getRedirectUri());
}
