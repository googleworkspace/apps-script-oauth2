/*
 * This sample demonstrates how to configure the library for the DocuSign API.
 * Instructions on how to generate OAuth credentuals is available here:
 * https://developers.docusign.com/esign-rest-api/guides/authentication/oauth2-code-grant
 */

var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

// To connect to developer sandbox accounts, use the host
// "account-d.docusign.com". For production accounts, use
// "account.docusign.com".
var OAUTH_HOST = 'account-d.docusign.com';

/**
 * Authorizes and makes a request to the Docusign API.
 */
function run() {
  var service = getService_();
  if (service.hasAccess()) {
    // Retrieve the account ID and base URI from storage.
    var storage = service.getStorage();
    var accountId = storage.getValue('account_id');
    var baseUri = storage.getValue('base_uri');

    // Make a request to retrieve the account information.
    var url = baseUri + '/restapi/v2.1/accounts/' + accountId;
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
  getService_().reset();
}

/**
 * Configures the service.
 */
function getService_() {
  return OAuth2.createService('DocuSign')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://' + OAUTH_HOST + '/oauth/auth')
      .setTokenUrl('https://' + OAUTH_HOST + '/oauth/token')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the scope. The "signature" scope is used for all endpoints in the
      // eSignature REST API.
      .setScope('signature')

      // Set the "Authorization" header when requesting tokens, as required by
      // the API.
      .setTokenHeaders({
        'Authorization': 'Basic ' +
            Utilities.base64Encode(CLIENT_ID + ':' + CLIENT_SECRET)
      });
};

/**
 * Handles the OAuth callback.
 */
function authCallback(request) {
  var service = getService_();
  var authorized = service.handleCallback(request);
  if (authorized) {
    // Get the user info to determine the ase URI and account ID needed for
    // future requests.
    var url = 'https://' + OAUTH_HOST + '/oauth/userinfo';
    var response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      }
    });
    var result = JSON.parse(response.getContentText());

    // Find the default account.
    var account = result.accounts.filter(function(account) {
      return account.is_default;
    })[0];

    // Store the base URI and account ID for later.
    var storage = service.getStorage();
    storage.setValue('account_id', account.account_id);
    storage.setValue('base_uri', account.base_uri);

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
