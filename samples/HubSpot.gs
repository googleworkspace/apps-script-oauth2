/*
 * This sample demonstrates how to configure the library for the HubSpot API.
 * Instructions on how to generate OAuth credentuals is available here:
 * https://developers.hubspot.com/docs/api/oauth-quickstart-guide
 */

var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the HubSpot API.
 */
function run() {
  var service = getService();
  if (service.hasAccess()) {
    // Make a request to retrieve the list of CRM owners.
    var url = 'https://api.hubapi.com/crm/v3/owners/';
    var response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
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
  return OAuth2.createService('HubSpot')
    // Set the endpoint URLs.
    .setAuthorizationBaseUrl('https://app.hubspot.com/oauth/authorize')
    .setTokenUrl('https://api.hubapi.com/oauth/v1/token')

    // Set the client ID and secret.
    .setClientId(CLIENT_ID)
    .setClientSecret(CLIENT_SECRET)

    // Set the name of the callback function that should be invoked to
    // complete the OAuth flow.
    .setCallbackFunction('authCallback')

    // Set the property store where authorized tokens should be persisted.
    .setPropertyStore(PropertiesService.getUserProperties())

    // Set the scopes to request from the user. The full list of scopes is
    // available here:
    // https://developers.hubspot.com/docs/api/working-with-oauth#scopes
    .setScope('contacts');
};

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
 * Logs the redirect URI to register.
 */
function logRedirectUri() {
  Logger.log(OAuth2.getRedirectUri());
}
