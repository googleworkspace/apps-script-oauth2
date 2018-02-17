var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the Harvest API.
 */
function run() {
  var service = getService();
  if (service.hasAccess()) {
    // Retrieve the account ID from storage.
    var accountId = service.getStorage().getValue('Harvest-Account-Id');
    var url = 'https://api.harvestapp.com/v2/users/me';
    var response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + service.getAccessToken(),
        'User-Agent': 'Apps Script Sample',
        'Harvest-Account-Id': accountId
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
  return OAuth2.createService('Harvest')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://id.getharvest.com/oauth2/authorize')
      .setTokenUrl('https://id.getharvest.com/api/v1/oauth2/token')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())
      .setCache(CacheService.getUserCache());
}

/**
 * Handles the OAuth callback.
 */
function authCallback(request) {
  var service = getService();
  var authorized = service.handleCallback(request);
  if (authorized) {
    // Gets the authorized account ID from the scope string. Assumes the
    // application is configured to work with single accounts. Has the format
    // "harvest:{ACCOUNT_ID}".
    var scope = request.parameter['scope'];
    var accountId = scope.split(':')[1];
    // Save the account ID in the service's storage.
    service.getStorage().setValue('Harvest-Account-Id', accountId);
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied.');
  }
}

/**
 * Logs the redict URI to register.
 */
function logRedirectUri() {
  Logger.log(getService().getRedirectUri());
}
