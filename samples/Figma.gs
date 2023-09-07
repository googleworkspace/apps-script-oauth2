var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the Figma API - https://www.figma.com/developers/api#authentication
 */
function run() {
  var service = getService_();
  if (service.hasAccess()) {
    var url = 'https://api.figma.com/v1/me'; // refer https://www.figma.com/developers/api#get-me-endpoint
    var options = {
      'method': 'GET',
      'muteHttpExceptions': true,
      'headers': {
        'Authorization': 'Bearer ' + service.getAccessToken()
      }
    };
    var response = UrlFetchApp.fetch(url, options);
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
  return OAuth2.createService('Figma')
    // Set the endpoint URLs.
    .setAuthorizationBaseUrl('https://www.figma.com/oauth')
    .setTokenUrl('https://www.figma.com/api/oauth/token')
    .setRefreshUrl('https://www.figma.com/api/oauth/refresh')

    // Set the client ID and secret.
    .setClientId(CLIENT_ID)
    .setClientSecret(CLIENT_SECRET)

    // Set the name of the callback function that should be invoked to
    // complete the OAuth flow.
    .setCallbackFunction('authCallback')

    // Set the property store where authorized tokens should be persisted.
    .setPropertyStore(PropertiesService.getUserProperties())

    // Set the scopes to request
    .setScope('files:read,file_variables:read,file_dev_resources:read')
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
