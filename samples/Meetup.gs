/**
 * Meetup API Guides:
 * http://www.meetup.com/meetup_api/
 * http://www.meetup.com/meetup_api/auth/#oauth2
 */

var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the Meetup API.
 */

function run() {
  var service = getService();
  if (service.hasAccess()) {
    var url = 'https://api.meetup.com/dashboard';
    var response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + service.getAccessToken()
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
  return OAuth2.createService('Meetup')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://secure.meetup.com/oauth2/authorize')
      .setTokenUrl('https://secure.meetup.com/oauth2/access')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
        .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to complete
      // the OAuth flow.
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
    return HtmlService.createHtmlOutput('Denied');
  }
}
