/*
 * This sample demonstrates how to configure the library for the Xero API.
 * Instructions on how to generate OAuth2 credentuals is available here:
 * https://developer.xero.com/documentation/oauth2/auth-flow
 */

var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the Xero API.
 */
function run() {
  var service = getService();
  if (service.hasAccess()) {
    // Retrieve the tenantId from storage.
    var tenantId = service.getStorage().getValue('tenantId');
    // Make a request to retrieve user information.
    var url = 'https://api.xero.com/api.xro/2.0/Organisations';
    var response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + service.getAccessToken(),
        'Xero-tenant-id': tenantId
      },
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
  return OAuth2.createService('Xero')
    // Set the endpoint URLs.
    .setAuthorizationBaseUrl(
        'https://login.xero.com/identity/connect/authorize')
    .setTokenUrl('https://identity.xero.com/connect/token')

    // Set the client ID and secret.
    .setClientId(CLIENT_ID)
    .setClientSecret(CLIENT_SECRET)

    // Set the name of the callback function that should be invoked to
    // complete the OAuth flow.
    .setCallbackFunction('authCallback')

    // Set the property store where authorized tokens should be persisted.
    .setPropertyStore(PropertiesService.getScriptProperties())

    // Set the scopes to request from the user. The scope "offline_access" is
    // required to refresh the token. The full list of scopes is available here:
    // https://developer.xero.com/documentation/oauth2/scopes
    .setScope('accounting.settings.read offline_access');
};

/**
 * Handles the OAuth callback.
 */
function authCallback(request) {
  var service = getService();
  var authorized = service.handleCallback(request);
  if (authorized) {
    // Retrieve the connected tenants.
    var response = UrlFetchApp.fetch('https://api.xero.com/connections', {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      },
    });
    var connections = JSON.parse(response.getContentText());
    // Store the first tenant ID in the service's storage. If you want to
    // support multiple tenants, store the full list and then let the user
    // select which one to operate against.
    service.getStorage().setValue('tenantId', connections[0].tenantId);
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied.');
  }
}

/**
 * Logs the redict URI to register in the Dropbox application settings.
 */
function logRedirectUri() {
  Logger.log(OAuth2.getRedirectUri());
}
