var CONSUMER_KEY = 'tYRP6vIZuY8K7yzy2vBnnhRxB';
var CONSUMER_SECRET = 'YoUMS8YOR9UxPEX0ZwYx5esV7rqHXRMnuqPV0xwDGkkAKqEu0G';

/**
 * Authorizes and makes a request to the Twitter Application Only API.
 */
function run() {
  var service = getService();
  if (service.hasAccess()) {
    var url = 'https://api.twitter.com/1.1/application/rate_limit_status.json?resources=help,users,search,statuses';
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

      // Set the consumer key and secret.
      .setConsumerKey(CONSUMER_KEY)
      .setConsumerSecret(CONSUMER_SECRET)

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getScriptProperties());
}