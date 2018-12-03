var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the ChatWork API.
 */
function run() {
  var service = getService();
  if (service.hasAccess()) {
    var response = UrlFetchApp.fetch('https://api.chatwork.com/v2/me', {
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
  var scope = 'users.profile.me:read rooms.messages:read';
  return OAuth2.createService('ChatWork')
    // Set the endpoint URLs.
    .setAuthorizationBaseUrl(
        'https://www.chatwork.com/packages/oauth2/login.php')
    .setTokenUrl('https://oauth.chatwork.com/token')

    // Set the client ID and secret.
    .setClientId(CLIENT_ID)
    .setClientSecret(CLIENT_SECRET)

    // Set the name of the callback function that should be invoked to
    // complete the OAuth flow.
    .setCallbackFunction('authCallback')

    .setScope(scope)

    .setTokenHeaders({
      'Authorization': 'Basic ' +
          Utilities.base64Encode(CLIENT_ID + ':' + CLIENT_SECRET)
    })
    // Avoid "invalid_client error".
    // This service does not support form field authentication.
    .setTokenPayloadHandler(function(tokenPayload) {
      delete tokenPayload.client_id;
      return tokenPayload;
    })
    // Set the property store where authorized tokens should be persisted.
    .setPropertyStore(PropertiesService.getUserProperties())
  ;
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
