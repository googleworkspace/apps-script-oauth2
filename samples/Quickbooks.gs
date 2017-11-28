var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the QBO API.
 */
function run() {
  var service = getService_();
  if (service.hasAccess()) {
    var companyId = PropertiesService.getUserProperties()
        .getProperty('QuickBooks.companyId');
    var url = 'https://sandbox-quickbooks.api.intuit.com/v3/company/' + companyId + '/companyinfo/' + companyId;
    var response = UrlFetchApp.fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + service.getAccessToken()
      }
    });
    var result = JSON.parse(response.getContentText());
    Logger.log(JSON.stringify(result, null, 2));
  } else {
    var authorizationUrl = service.getAuthorizationUrl();
    Logger.log('Open the following URL and re-run the script: %s', authorizationUrl);
  }
}

/**
 * Reset the authorization state, so that it can be re-tested.
 */
function reset() {
  var service = getService_();
  service.reset();
}


/**
 * Configures the service.
 * Three required parameters are not specified because
 * the library creates the authorization URL with them
 * automatically: `redirect_url`, `response_type`, and
 * `state`.
 */
function getService_() {

  return OAuth2.createService('QuickBooks')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://appcenter.intuit.com/connect/oauth2')
      .setTokenUrl('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to complete
      // the OAuth flow.
      .setCallbackFunction('authCallback_')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set scope (required)
      .setScope('com.intuit.quickbooks.accounting');
}

/**
 * Handles the OAuth callback.
 */
function authCallback_(request) {
  var service = getService_();
  var authorized = service.handleCallback(request);
  if (authorized) {
    PropertiesService.getUserProperties()
        .setProperty('QuickBooks.companyId', request.parameter.realmId);
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied.');
  }
}

/**
 * Logs the redict URI to register.
 */
function logRedirectUri() {
  var service = getService_();
  Logger.log(service.getRedirectUri());
}
