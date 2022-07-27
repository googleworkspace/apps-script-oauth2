/*
 * This sample demonstrates how to configure the library for the eBay API,
 * using the authorization code flow to get a user access token.
 * Instructions on how to generate OAuth credentuals is available here:
 * https://developer.ebay.com/api-docs/static/oauth-qref-auth-code-grant.html
 */

var CLIENT_ID = '...'; // App ID
var CLIENT_SECRET = '...'; // Cert ID
var RU_NAME = '...'; // eBay Redirect URL name.

/**
 * Authorizes and makes a request to the Ebay API.
 */
function run() {
  var service = getService_();
  if (service.hasAccess()) {
    // Sandbox environment.
    var url = 'https://api.sandbox.ebay.com/sell/inventory/v1/inventory_item';
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
  return OAuth2.createService('eBay')
      // Set the endpoint URLs (sandbox environment).
      .setTokenUrl('https://api.sandbox.ebay.com/identity/v1/oauth2/token')
      .setAuthorizationBaseUrl('https://signin.sandbox.ebay.com/authorize')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function in the script referenced
      // above that should be invoked to complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the redirect URI to the RuName (eBay Redirect URL name).
      .setRedirectUri(RU_NAME)

      // Set the require scopes.
      .setScope('https://api.ebay.com/oauth/api_scope/sell.inventory.readonly')

      // Add a Basic Authorization header to token requests.
      .setTokenHeaders({
        Authorization: 'Basic ' +
            Utilities.base64Encode(CLIENT_ID + ':' + CLIENT_SECRET)
      });
}

/**
 * Handles the OAuth2 callback.
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
