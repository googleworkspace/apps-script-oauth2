/*
 * This sample demonstrates how to configure the library for the RiteKit API.
 * Instructions on how to generate OAuth credentuals is available here:
 * https://ritekit.docs.apiary.io/#introduction/options-for-authorizing-api-calls
 */

var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the RitKit API.
 */
function run() {
  var service = getService();
  if (service.hasAccess()) {
    console.log(service.getAccessToken());
    var url = 'https://api.ritekit.com/v1/stats/multiple-hashtags?tags=php&access_token=' + service.getAccessToken();
    var response = UrlFetchApp.fetch(url);
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
  return OAuth2.createService('RiteKit')
      // Set the endpoint URLs.
      .setTokenUrl('https://ritekit.com/oauth/token')

      // Sets the custom grant type to use.
      .setGrantType('client_credentials')

      // Set the client ID and secret as params.
      .setParam('client_id', CLIENT_ID)
      .setParam('client_secret', CLIENT_SECRET)

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // [required] scope (always use scope=data)
      .setScope('data');
}
