var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the Adobe Sign API.
 */
function run() {
  var service = getService();
  if (service.hasAccess()) {
    // Retrieve the API access point from storage.
    var apiAccessPoint = service.getStorage().getValue('api_access_point');
    var url = apiAccessPoint + 'api/rest/v5/users/me';
    var response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      }
    });
    var result = JSON.parse(response.getContentText());
    Logger.log(JSON.stringify(result, null, 2));
  } else {
    if (service.getLastError()) {
      Logger.log(service.getLastError());
    }
    var authorizationUrl = service.getAuthorizationUrl();
    Logger.log('Open the following URL and re-run the script: %s',
        authorizationUrl);
  }
}

/**
 * Reset the authorization state, so that it can be re-tested.
 */
function reset() {
  var service = getService();
  service.reset();
}

/**
 * Configures the service.
 */
function getService(opt_apiAccessPoint) {
  var service = OAuth2.createService('AdobeSign')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://secure.echosign.com/public/oauth')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())
      .setPropertyStore(PropertiesService.getScriptProperties())

      // Set the scopes.
      .setScope('user_read');
  
  // Set the token and refresh URL using the API access point passed in or 
  // stored in the token.
  var apiAccessPoint = opt_apiAccessPoint ||
      service.getStorage().getValue('api_access_point');
  if (apiAccessPoint) {
    service.setTokenUrl(apiAccessPoint + 'oauth/token');
    service.setRefreshUrl(apiAccessPoint + 'oauth/refresh');
  }
  
  return service;
}

/**
 * Handles the OAuth callback.
 */
function authCallback(request) {
  // Get the API access point specified in the URL parameters.
  var apiAccessPoint = request.parameter.api_access_point;
  var service = getService(apiAccessPoint);
  var authorized = service.handleCallback(request);
  if (authorized) {
    // Save the API access point in the service's storage.
    service.getStorage().setValue('api_access_point', apiAccessPoint);
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied');
  }
}

/**
 * Logs the redict URI to register in the Dropbox application settings.
 */
function logRedirectUri() {
  var service = getService();
  Logger.log(service.getRedirectUri());
}
