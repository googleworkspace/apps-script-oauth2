/*
 * This sample demonstrates how to configure the library for the Mailchimp API.
 * Instructions on how to generate OAuth credentuals is available here:
 * https://mailchimp.com/developer/guides/how-to-use-oauth2/#Step_1%3A_Register_your_application
 */

var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the Docusign API.
 */
function run() {
  var service = getService();
  if (service.hasAccess()) {
    // Retrieve the account ID and base URI from storage.
    var storage = service.getStorage();
    var dc = storage.getValue('dc');

    // Make a request to retrieve the Mailchimp campaigns.
    var url = 'https://' + dc + '.api.mailchimp.com/3.0/campaigns/';
    var response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      }
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
  getService().reset();
}

/**
 * Configures the service.
 */
function getService() {
  return OAuth2.createService('Mailchimp')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://login.mailchimp.com/oauth2/authorize')
      .setTokenUrl('https://login.mailchimp.com/oauth2/token')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the cache store where authorized tokens should be persisted.
      .setCache(CacheService.getUserCache());
};

/**
 * Handles the OAuth callback.
 */
function authCallback(request) {
  var service = getService();
  var authorized = service.handleCallback(request);
  if (authorized) {
    // Get the user info to determine the data center needed for
    // future requests.
    var url = 'https://login.mailchimp.com/oauth2/metadata';
    var response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      }
    });
    var result = JSON.parse(response.getContentText());

    // Store the Mailchimp datacenter for future API calls.
    var storage = service.getStorage();
    storage.setValue('dc', result.dc);

    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied.');
  }
}

/**
 * Logs the redict URI to register in the Mailchimp application settings.
 */
function logRedirectUri() {
  Logger.log(OAuth2.getRedirectUri());
}
