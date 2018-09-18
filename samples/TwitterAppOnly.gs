/**
 * This sample demonstrates how to configure the library for the Twitter API,
 * using the Application Only authorization flow:
 * https://developer.twitter.com/en/docs/basics/authentication/overview/application-only
 * To authorize access to a user's Twitter account you need to use the OAuth
 * 1.0a library as shown here:
 * https://developer.twitter.com/en/docs/basics/authentication/overview/application-only
 */
var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the Twitter API.
 */
function run() {
  var service = getService();
  if (service.hasAccess()) {
    var url = 'https://api.twitter.com/1.1/users/show.json?screen_name=gsuitedevs';
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
  getService().reset();
}

/**
 * Configures the service.
 */
function getService() {
  return OAuth2.createService('Twitter App Only')
      // Set the endpoint URLs.
      .setTokenUrl('https://api.twitter.com/oauth2/token')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Sets the custom grant type to use.
      .setGrantType('client_credentials')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties());
}
