var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the Reddit API - https://www.reddit.com/dev/api
 */
function run() {
  var service = getService_();
  if (service.hasAccess()) {
    var url = 'https://oauth.reddit.com/api/v1/me'; // refer https://www.reddit.com/dev/api#GET_api_v1_me
    var options = {
      'method': 'GET',
      'muteHttpExceptions': true,
      'headers': {
        'Authorization': 'Bearer ' + service.getAccessToken()
      }
    };
    var response = UrlFetchApp.fetch(url, options);
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
  return OAuth2.createService('Reddit')
    // Set the endpoint URLs.
    .setAuthorizationBaseUrl('https://www.reddit.com/api/v1/authorize')
    .setTokenUrl('https://www.reddit.com/api/v1/access_token')

    // Set the client ID and secret.
    .setClientId(CLIENT_ID)
    .setClientSecret(CLIENT_SECRET)

    // Set the name of the callback function that should be invoked to
    // complete the OAuth flow.
    .setCallbackFunction('authCallback')

    // Set the property store where authorized tokens should be persisted.
    .setPropertyStore(PropertiesService.getUserProperties())

    .setTokenHeaders({
      'Authorization': 'Basic ' +
        Utilities.base64Encode(CLIENT_ID + ':' + CLIENT_SECRET)
    })

    .setParam('duration', 'permanent')

    .setScope('identity read wikiread')
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
