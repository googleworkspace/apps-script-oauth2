/**
 * Yandex Passport https://oauth.yandex.ru
 * 
 */

var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the Yandex Passport API.
 */
function run() {
  var service = getService();
  if (service.hasAccess()) {
    var url = 'https://login.yandex.ru/info';
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
  var service = getService();
  service.reset();
}

/**
 * Configures the service.
 */
function getService() {
  return OAuth2.createService('Yandex')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://oauth.yandex.ru/authorize')
      .setTokenUrl('https://oauth.yandex.ru/token')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to complete
      // the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the scope and additional specific parameters if its are supported
      //.setScope() // There is no need to pass a scope for the passport getting. But you need to provide the scope for specific API
      .setParam('access_type', 'offline')
      .setParam('approval_prompt', 'force');
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
    return HtmlService.createHtmlOutput('Denied');
  }
}

/**
 * Logs the redict URI to register in the Yandex oAuth Page https://oauth.yandex.ru/client/new.
 */
function logRedirectUri() {
  var service = getService();
  Logger.log(service.getRedirectUri());
}
