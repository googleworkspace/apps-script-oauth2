/**
 * This sample demonstrates how to connect to the Zoho CRM API.
 * @see https://www.zoho.com/crm/developer/docs/api/oauth-overview.html
 */

var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

var CLIENT_ID = '1000.7ETQMTBW3CZ8904161FVI075OUAH9H';
var CLIENT_SECRET = 'ff6ccb4c2e10105c1ba90ae92729570a7a783d918c';

/**
 * Authorizes and makes a request to the Zoho CRM API.
 */
function run() {
  var service = getService();
  if (service.hasAccess()) {
    // Retrieve the API server from the token.
    var apiServer = service.getToken().api_domain;
    var url = apiServer + '/crm/v2/org';
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
  getService().reset();
}

/**
 * Configures the service.
 * @param {string} optAccountServer The account server to use when requesting
 *     tokens.
 */
function getService(optAccountServer) {
  var service = OAuth2.createService('Zoho')
      // Set the authorization base URL.
      .setAuthorizationBaseUrl('https://accounts.zoho.com/oauth/v2/auth')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set scopes. See
      // https://www.zoho.com/crm/developer/docs/api/oauth-overview.html#scopes.
      .setScope('ZohoCRM.org.all')

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the access type to "offline" to get a refresh token.
      .setParam('access_type', 'offline')
      // Set prompt to "consent" to ensure a refresh token is retrieved.
      .setParam('prompt', 'consent')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())
      .setCache(CacheService.getUserCache());

  // Set the token URL using the account server passed in or previously stored.
  var accountServer = optAccountServer ||
      service.getStorage().getValue('account-server');
  if (accountServer) {
    service.setTokenUrl(accountServer + '/oauth/v2/token');
  }
  return service;
}

/**
 * Handles the OAuth callback.
 */
function authCallback(request) {
  var accountServer = request.parameter['accounts-server'];
  var service = getService(accountServer);
  var authorized = service.handleCallback(request);
  if (authorized) {
    // Save the account server in the service's storage.
    service.getStorage().setValue('account-server', accountServer);
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
