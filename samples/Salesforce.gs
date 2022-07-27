/**
 * Saleforce Auth flow
 * @see https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/quickstart_oauth.htm
 */

var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the Saleforce API.
 */
function run() {
  var service = getService_();
  if (service.hasAccess()) {
    var url = service.getToken().instance_url +
        '/services/data/v24.0/chatter/users/me';
    // Make the HTTP request using a wrapper function that handles expired
    // sessions.
    var response = withRetry(service, function() {
      return UrlFetchApp.fetch(url, {
        headers: {
          Authorization: 'Bearer ' + service.getAccessToken(),
        }
      });
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
 * Wrapper function that detects an expired session, refreshes the access token,
 * and retries the request again.
 * @param {OAuth2.Service_} service The service to refresh.
 * @param {Function} func The function that makes the UrlFetchApp request
                          and returns the response.
 * @return {UrlFetchApp.HTTPResponse} The HTTP response.
 */
function withRetry(service, func) {
  var response;
  var content;
  try {
    response = func();
    content = response.getContentText();
  } catch (e) {
    content = e.toString();
  }
  if (content.indexOf('INVALID_SESSION_ID') !== -1) {
    service.refresh();
    return func();
  }
  return response;
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
  return OAuth2.createService('Saleforce')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl(
          'https://login.salesforce.com/services/oauth2/authorize')
      .setTokenUrl('https://login.salesforce.com/services/oauth2/token')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the scopes to be requested.
      .setScope('chatter_api refresh_token');
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
