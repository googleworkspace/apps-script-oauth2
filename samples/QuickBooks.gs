/** 
 * Populate constants with data specific to your application,
 * found at https://developer.intuit.com/v2/ui#/app/appdetail/XXXXXXX
 */
var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

// URLS found at Quickbooks Devloper Portal: https://developer.intuit.com
var BASE_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
var TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

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
        
    // Get company information as a test.
    var url = 'https://sandbox-quickbooks.api.intuit.com/v3/company/'
    + companyId + '/companyinfo/' + companyId;
    
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
      .setAuthorizationBaseUrl(BASE_AUTH_URL)
      .setTokenUrl(TOKEN_URL)
      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)
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
    PropertiesService.getUserProperties()
        .setProperty('QuickBooks.companyId', request.parameter.realmId);
      Logger.log('Success!');
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied');
  }
}
