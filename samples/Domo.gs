/*
 * This sample demonstrates how to configure the library for the Domo API.
 * Instructions on how to generate OAuth credentuals is available here:
 * https://developer.domo.com/docs/authentication/overview-4
 */

var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the Domo API.
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
  getService().reset();
}

/**
 * Configures the service.
 */
function getService() {
  return OAuth2.createService('Domo')
      // Set the endpoint URLs.
      .setTokenUrl('https://api.domo.com/oauth/token')

      // Sets the custom grant type to use.
      .setGrantType('client_credentials')

      // Sets the required Authorization header.
      .setTokenHeaders({
        Authorization: 'Basic ' +
            Utilities.base64Encode(CLIENT_ID + ':' + CLIENT_SECRET)
      })

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties());
}
