/**
 * Demonstrates how to authorize access to the RingCentral API using the sandbox
 * environment.
 * @see http://ringcentral-api-docs.readthedocs.io/en/latest/oauth/
 */

var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

// The server to send requests to, currently the sandbox.
var SERVER = 'https://platform.devtest.ringcentral.com';

/**
 * Authorizes and makes a request to the RingCentral API.
 */
function run() {
  var service = getService_();
  if (service.hasAccess()) {
    var url = SERVER + '/restapi/v1.0/account/~';
    var response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + service.getAccessToken()
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
  return OAuth2.createService('RingCentral')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl(SERVER + '/restapi/oauth/authorize')
      .setTokenUrl(SERVER + '/restapi/oauth/token')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the required authorization header.
      .setTokenHeaders({
        'Authorization': 'Basic ' +
            Utilities.base64EncodeWebSafe(CLIENT_ID + ':' + CLIENT_SECRET)
      });
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
    return HtmlService.createHtmlOutput('Denied');
  }
}

/**
 * Logs the redict URI to register.
 */
function logRedirectUri() {
  Logger.log(OAuth2.getRedirectUri());
}
