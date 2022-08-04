/*
 * This sample demonstrates how to configure the library for the Tink API.
 * Instructions on how to generate OAuth credentuals is available here:
 * https://docs.tink.com/resources/getting-started/connect-tink-link
 */

var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the Tink API.
 */
function run() {
  var service = getService_();
  if (service.hasAccess()) {
    // Make a request to retrieve user information.
    var url = 'https://api.tink.com/api/v1/user';
    var response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      },
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
  getService_().reset();
}

/**
 * Configures the service.
 */
function getService_() {
  var service = OAuth2.createService('Tink')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://link.tink.com/1.0/authorize/')
      .setTokenUrl('https://api.tink.com/api/v1/oauth/token')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the scopes to request from the user.
      // https://docs.tink.com/api/#introduction-authentication-authentication-scopes
      .setScope('identity:read user:read')

      // Use testing providers (instead of real data).
      // https://docs.tink.com/resources/aggregation/use-test-providers
      .setParam('test', 'true');

  // Determine if the user data still exists.
  if (service.hasAccess()) {
    // Make a request to retrieve identity information.
    var url = 'https://api.tink.com/api/v1/identities';
    var response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      },
      muteHttpExceptions: true
    });
    if (response.getResponseCode() == 401) {
      // The user data has been removed after 24 hours. Reset the service.
      // https://docs.tink.com/glossary#permanent-users
      service.reset();
    }
  }

  return service;
};

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
 * Logs the redict URI to register in the Dropbox application settings.
 */
function logRedirectUri() {
  Logger.log(OAuth2.getRedirectUri());
}
