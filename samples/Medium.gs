var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the Medium API.
 */
function run() {
  var service = getService_();
  if (service.hasAccess()) {
    var url = 'https://api.medium.com/v1/me';
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
  var service = getService_();
  service.reset();
}


/**
 * Configures the service.
 * Three required parameters are not specified because
 * the library creates the authorization URL with them
 * automatically: `redirect_url`, `response_type`, and
 * `state`.
 */
function getService_() {

  return OAuth2.createService('Medium')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://medium.com/m/oauth/authorize')
      .setTokenUrl('https://api.medium.com/v1/tokens')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to complete
      // the OAuth flow.
      .setCallbackFunction('authCallback_')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set scope (required)
      .setScope('basicProfile');
}

/**
 * Handles the OAuth callback.
 */
function authCallback_(request) {
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
  var service = getService();
  Logger.log(service.getRedirectUri());
}
