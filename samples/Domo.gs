var CONSUMER_KEY = '60e79f78-696e-4977-b8af-22584dee428a';
var CONSUMER_SECRET = '4bc8eb4d4db6a3b594177c334c4916799d463594c6771dae14a3644ecb3ebc01';

/**
 * Authorizes and makes a request to the Twitter Application Only API.
 */
function run() {
  var service = getService();
  if (service.hasAccess()) {
    var url = 'https://api.domo.com/v1/users';
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
  return OAuth2.createService('Domo')
      // Set the endpoint URL.
      .setTokenUrl('https://api.domo.com/oauth/token')

      // Set the consumer key and secret.
      .setConsumerKey(CONSUMER_KEY)
      .setConsumerSecret(CONSUMER_SECRET)

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getScriptProperties())
      
      // Set the scope and additional headers required by the Domo API.
      .setScope('data user');
}