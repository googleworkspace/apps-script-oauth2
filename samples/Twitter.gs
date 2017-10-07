
var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the Twitter Application Only API.
 */
function run() {
  var service = getService();
  if (service.hasAccess()) {
    var url = 'ttps://api.twitter.com/1.1/application/rate_limit_status.json?resources=help,users,search,statuses';
    var response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      }
    });
    var result = JSON.parse(response.getContentText());
    Logger.log(JSON.stringify(result, null, 2));
  } else {
    Logger.log(service.getLastError());
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
  return OAuth2.createService('Twitter_Application_Only')
      // Set the endpoint URL.
      .setTokenUrl('https://api.twitter.com/oauth2/token')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getScriptProperties())

      // Set additional headers required by the Twitter Application Only.
      .setTokenHeaders({
        'Authorization': 'Basic ' + Utilities.base64Encode(CLIENT_ID + ':' + CLIENT_SECRET)
      })

      // grant_type REQUIRED for this type requests. Value MUST be set to "client_credentials".
      .setParam('grant_type', 'client_credentials');
}