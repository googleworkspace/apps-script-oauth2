/*
 * This sample demonstrates how to configure the library for the Etsy API.
 * Instructions on how to generate OAuth credentials is available here:
 * https://developers.etsy.com/documentation/essentials/authentication
 */

const CLIENT_ID = '...';
const CLIENT_SECRET = '...';


/**
 * Authorizes and makes a request to the Etsy API.
 */
function run() {
    var service = getService_();
    if (service.hasAccess()) {
      var url = 'https://openapi.etsy.com/v3/application/users/me';  // Replace with the appropriate Etsy API endpoint
      var settings = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', "Authorization": 'Bearer ' + service.getAccessToken(), 'x-api-key': CLIENT_ID }
      };
  
      var response = UrlFetchApp.fetch(url, settings);
      var result = JSON.parse(response.getContentText());
      Logger.log(JSON.stringify(result, null, 2));
    } else {
      Logger.log(service.getLastError());
    }
  }

/**
 * Configures the service.
 */
function getService_() {
  var userProps = PropertiesService.getUserProperties();

  return OAuth2.createService('Etsy')
    .setAuthorizationBaseUrl('https://www.etsy.com/oauth/connect')
    .setTokenUrl('https://api.etsy.com/v3/public/oauth/token')
    .setClientId(CLIENT_ID)
    .setClientSecret(CLIENT_SECRET)
    .setCallbackFunction('authCallback')
    .setPropertyStore(userProps)
    // Etsy requires the scope to access data
    .setScope('shops_r')
    .setParam('response_type', 'code')
    // Generate the PKCE parameters automatically
    .generateCodeVerifier()
    .setTokenPayloadHandler(function(tokenPayload) {
      // No need to manually set code_verifier here,
      // generateCodeVerifier() takes care of it.
      return tokenPayload;
    });
}

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
 * Reset the authorization state, so that it can be re-tested.
 */
function resetAuth() {
  PropertiesService.getUserProperties().deleteAllProperties();
}
