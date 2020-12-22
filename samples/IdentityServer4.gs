/**
 * Demonstrates how to authorize access to the IdentityServer4 Demo API using
 * the Authorization Code grant type.
 * @see https://demo.identityserver.io/
 * http://docs.identityserver.io/en/release/topics/grant_types.html#authorization-code
 * @see http://docs.identityserver.io/en/release/endpoints/authorize.html
 * @see http://docs.identityserver.io/en/release/endpoints/token.html
 */

// Test credentials for the Demo API.
// @credentialsOK
var CLIENT_ID = 'server.code';
var CLIENT_SECRET = 'secret';

/**
 * Authorizes and makes a request to the IdentityServer4 Demo API.
 */
function run() {
  var service = getService();
  if (service.hasAccess()) {
    var url = 'https://demo.identityserver.io/api/test';
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
  return OAuth2.createService('IdentityServer4')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://demo.identityserver.io/connect/authorize')
      .setTokenUrl('https://demo.identityserver.io/connect/token')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the scope and additional Google-specific parameters.
      .setScope('openid api offline_access');
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
    return HtmlService.createHtmlOutput('Denied');
  }
}
