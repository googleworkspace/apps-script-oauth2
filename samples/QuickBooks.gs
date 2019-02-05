/*
 * This sample demonstrates how to configure the library for
 * the Intuit Quickbooks API. Instructions for obtaining your
 * Client ID and Client Secret can be found here:
 * https://developer.intuit.com/app/developer/qbo/docs/get-started
 */

var CLIENT_ID = '';
var CLIENT_SECRET = '';

/**
 * Log the redirect URI to be pasted in the Intuit Dev Center:
 * https://developer.intuit.com/v2/ui#/app/<YOURAPPID>/keys
 */
function logRedirectUri() {
  Logger.log(getService().getRedirectUri());
}

/**
 * Authorizes and makes a request to the QuickBooks API. Assumes the use of a
 * sandbox company.
 */
function run() {
  var service = getService();
  if (service.hasAccess()) {
    // Get the Company ID to be used in the request.
    var companyId = PropertiesService.getUserProperties()
        .getProperty('QuickBooks.companyId');
    // Get Quickbooks Company information to test.
    var url = 'https://sandbox-quickbooks.api.intuit.com/v3/company/' +
        companyId + '/companyinfo/' + companyId;
    var response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken(),
        Accept: 'application/json'
      }
    });
    var result = JSON.parse(response.getContentText());
    Logger.log(JSON.stringify(result, null, 2));
  } else {
    // If not authorized, get authorization URL.
    var authorizationUrl = service.getAuthorizationUrl();
    // View the Log to obtain the URL.
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
function getService() {
  return OAuth2.createService('Quickbooks')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://appcenter.intuit.com/connect/oauth2')
      .setTokenUrl('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer')
      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)
      // Required, set to Accounting for this example,
      // see QB developer portal for additional options.
      .setScope('com.intuit.quickbooks.accounting')
      // Set the name of the callback function in the script referenced
      // above that should be invoked to complete the OAuth flow.
      .setCallbackFunction('authCallback')
      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties());
}

/**
 * Handles the OAuth callback.
 */
function authCallback(request) {
  var service = getService();
  var authorized = service.handleCallback(request);
  if (authorized) {
    // Save the Company ID in the service's storage.
    service.getStorage().setValue('QuickBooks.companyId', 
                                  request.parameter.realmId);
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied');
  }
}
