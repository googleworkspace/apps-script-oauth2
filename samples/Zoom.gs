/*
 * This sample demonstrates how to configure the library for the Zoom API, using
 * a User Managed App. Instructions on how to generate OAuth credentuals is
 * available here:
 * https://marketplace.zoom.us/docs/guides/authorization/oauth-with-zoom
 */

var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the Zoom API.
 */
function run() {
  var service = getService();
  if (service.hasAccess()) {
    var url = 'https://api.zoom.us/v2/users/me';
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
  getService().reset();
}

/**
 * Configures the service.
 */
function getService() {
  return OAuth2.createService('Zoom')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://zoom.us/oauth/authorize')
      .setTokenUrl('https://zoom.us/oauth/token')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the required scopes:
      // https://marketplace.zoom.us/docs/guides/zoom-app-marketplace/permissions#user-managed-app-scopes
      .setScope('user:read')

      // Set the Authorization header for token requests.
      // https://marketplace.zoom.us/docs/guides/authorization/oauth-with-zoom#step-3-exchange-the-authorization-code-for-an-access-token
      .setTokenHeaders({
        'Authorization': 'Basic ' +
          Utilities.base64Encode(CLIENT_ID + ':' + CLIENT_SECRET),
      });
}

/**
 * Handles the OAuth callback.
 */
function authCallback(request) {
  var service = getService();
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
