/*
 * This sample demonstrates how to configure the library for Google APIs, using
 * end-user authorization (Web Server flow).
 * https://developers.google.com/identity/protocols/OAuth2WebServer
 */

var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the Google Drive API.
 */
function run() {
  var service = getService_();
  if (service.hasAccess()) {
    var url = 'https://www.googleapis.com/drive/v3/files?pageSize=1';
    var response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      }
    });
    var result = JSON.parse(response.getContentText());
    Logger.log(JSON.stringify(result, null, 2));
  } else {
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
function getService_() {
  return OAuth2.createService('Google')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/v2/auth')
      .setTokenUrl('https://oauth2.googleapis.com/token')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the scope and additional Google-specific parameters.
      .setScope('https://www.googleapis.com/auth/drive')
      .setParam('access_type', 'offline')
      .setParam('prompt', 'consent')
      .setParam('login_hint', Session.getActiveUser().getEmail());
}

/**
 * Handles the OAuth callback.
 */
function authCallback(request) {
  var service = getService_();
  var authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied.');
  }
}

/**
 * Logs the redict URI to register in the Google Developers Console.
 */
function logRedirectUri() {
  Logger.log(OAuth2.getRedirectUri());
}

