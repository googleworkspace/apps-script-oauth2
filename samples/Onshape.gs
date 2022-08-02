/*
 * This sample demonstrates how to configure the library for the Onshape API.
 * To generate OAuth credentials, create an OAuth application here:
 * https://dev-portal.onshape.com/
 */

// Make sure to include any trailng '=' symbols in the ID and Secret.
var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the Onshape API.
 */
function run() {
  var service = getService_();
  if (service.hasAccess()) {
    // Make a request to retrieve a list of the user's documents.
    // This requires enabling the OAuth2Read scope for the application in the
    // Onshape developer portal. ("Application can read your documents")
    var url = 'https://cad.onshape.com/api/documents';
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
  return OAuth2.createService('Onshape')
      // Set the Onshape OAuth endpoint URLs.
      .setAuthorizationBaseUrl('https://oauth.onshape.com/oauth/authorize')
      .setTokenUrl('https://oauth.onshape.com/oauth/token')

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