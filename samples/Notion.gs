var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the Notion API - https://developers.notion.com/reference/intro
 */
function run() {
  var service = getService_();
  if (service.hasAccess()) {
    var url = 'https://api.notion.com/v1/search'; // refer https://developers.notion.com/reference/post-search
    var options = {
      'method': 'post',
      'muteHttpExceptions': true,
      'headers': {
        'Notion-Version': '2021-05-13', // refer https://developers.notion.com/reference/versioning
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
  return OAuth2.createService('Notion')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://api.notion.com/v1/oauth/authorize')
      .setTokenUrl('https://api.notion.com/v1/oauth/token')

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
      });
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
