/*
* Zendesk OAuth Guide:
* https://support.zendesk.com/hc/en-us/articles/203663836
*/

var CLIENT_ID = '...';
var CLIENT_SECRET = '...';
var SUBDOMAIN = '...';

/**
 * Authorizes and makes a request to the Zendesk API.
 */
function run() {
  var service = getService();
  if (service.hasAccess()) {
    var url = 'https://'
        .concat(SUBDOMAIN, '.zendesk.com/api/v2/tickets/recent.json');
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
  getService().reset();
}

/**
 * Configures the service.
 */
function getService() {
  return OAuth2.createService('Zendesk')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl(
          'https://'.concat(SUBDOMAIN, '.zendesk.com/oauth/authorizations/new'))
      .setTokenUrl('https://'.concat(SUBDOMAIN, '.zendesk.com/oauth/tokens'))

      // Set scope (required by Zendesk)
      .setScope('read')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
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
