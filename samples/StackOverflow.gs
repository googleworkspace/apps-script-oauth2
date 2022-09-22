/*
 * Stack Overflow OAuth 2.0 guides:
 * https://api.stackexchange.com/docs/authentication
 * https://stackapps.com/apps/oauth/register
 */

var CLIENT_ID = '...';
var CLIENT_SECRET = '...';
var KEY = '...';

/**
 * Authorizes and makes a request to the Stack Overflow API.
 */
function run() {
  var service = getService_();
  if (service.hasAccess()) {
    var url = `https://api.stackexchange.com/2.3/me?site=stackoverflow&key=${KEY}&access_token=${service.getAccessToken()}`;
    var response = UrlFetchApp.fetch(url);
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
  return OAuth2.createService('Stack Overflow')
  // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://stackoverflow.com/oauth')
      .setTokenUrl('https://stackoverflow.com/oauth/access_token/json')

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
 * Logs the redict URI to register.
 */
function logRedirectUri() {
  Logger.log(OAuth2.getRedirectUri());
}
