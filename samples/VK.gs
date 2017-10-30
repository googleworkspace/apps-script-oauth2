/**
 * VK's Auth flow https://vk.com/dev/authcode_flow_user
 * Scopes list https://vk.com/dev/permissions
 */

var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the VK API.
 */
function run() {
  var service = getService();
  if (service.hasAccess()) {
    // GET requests require access_token parameter
    var url = 'https://api.vk.com/method/groups.get?access_token=' + service.getAccessToken();
    var response = UrlFetchApp.fetch(url);
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
  var service = getService();
  service.reset();
}

/**
 * Configures the service.
 */
function getService() {
  return OAuth2.createService('VK')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://oauth.vk.com/authorize')
      .setTokenUrl('https://oauth.vk.com/access_token')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to complete
      // the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the scope and additional specific parameters if its are supported
      .setScope('groups,offline');
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
 * Logs the redict URI to register in the VK Aps Page https://vk.com/apps?act=manage.
 */
function logRedirectUri() {
  var service = getService();
  Logger.log(service.getRedirectUri());
}
