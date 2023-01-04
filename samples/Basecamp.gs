var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the Basecamp 3 API.
 */
function run() {
  var service = getService_();
  if (service.hasAccess()) {
    var url = 'https://launchpad.37signals.com/authorization.json';
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
  return OAuth2.createService('Basecamp')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://launchpad.37signals.com/authorization/new')
      .setTokenUrl('https://launchpad.37signals.com/authorization/token')

      // Set the required type param
      .setParam('type', 'web_server')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the handler for adding Basecamp's required type parameter to the
      // payload:
      .setTokenPayloadHandler(basecampTokenHandler);
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
 * Adds the Basecamp API's required type parameter to the access token
 * request payload.
 */
function basecampTokenHandler(payload) {
  // If it's refresh request from library
  if (payload.grant_type === 'refresh_token')
  {
    // Basecamp refresh token API returns error if type is not specified
    payload.type = 'refresh';
  }
  else
  {
    // Basecamp token API returns error if type is not specified
    payload.type = 'web_server';
  }

  return payload;
}

/**
 * Logs the redict URI to register.
 */
function logRedirectUri() {
  Logger.log(OAuth2.getRedirectUri());
}
