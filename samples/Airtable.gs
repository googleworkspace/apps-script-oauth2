/*
 * This sample demonstrates how to configure the library for the Airtable API.
 * Instructions on how to generate OAuth keys is available here:
 * https://airtable.com/developers/web/api/oauth-reference
 */
 
var CLIENT_ID = 'YOUR_CLIENT_ID';
var CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
var AIRTABLE_BASE_ID = 'YOUR_BASE_ID';
var AIRTABLE_TABLE_NAME = 'TABLE_NAME';
var AIRTABLE_VIEW_NAME = 'VIEW';
var AIRTABLE_FIELDS = ["Name", "IP Address", "Serial No", "Product Name", "Location", "Category Type", "Acquisition Date", "Notes"];
var URL_FIELDS = AIRTABLE_FIELDS.map(function (name) {
  return 'fields=' + encodeURIComponent(name);
}).join('&');


/**
 * Authorizes and makes a request to the Airtable API.
 */
function pullRecords() {
  var service = getService_();
  if (service.hasAccess()) {
    var url = 'https://api.airtable.com/v0/' + AIRTABLE_BASE_ID + '/' + encodeURIComponent(AIRTABLE_TABLE_NAME) + '?view=' + encodeURIComponent(AIRTABLE_VIEW_NAME) + '&' + URL_FIELDS;
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
  var service = getService_();
  service.reset();
  PropertiesService.getUserProperties().deleteProperty('code_challenge');
  PropertiesService.getUserProperties().deleteProperty('code_verifier');
}

/**
 * Configures the service.
 * Three required parameters are not specified because
 * the library creates the authorization URL with them
 * automatically: `redirect_url`, `response_type`, and
 * `state`.
 */
function getService_() {
  var userProps = PropertiesService.getUserProperties();
  return OAuth2.createService('Airtable')
    // Set the endpoint URLs.
    .setAuthorizationBaseUrl('https://airtable.com/oauth2/v1/authorize')
    //.setTokenUrl('https://airtable.com/oauth2/v1/token?code_verifier=' + userProps.getProperty('code_verifier'))
    .setTokenUrl('https://airtable.com/oauth2/v1/token')
    // Rest of the configuration
    .setTokenPayloadHandler(function (tokenPayload) {
      tokenPayload.code_verifier = PropertiesService.getUserProperties().getProperty('code_verifier');
      return tokenPayload;
    })


    // Set the client ID and secret.
    .setClientId(CLIENT_ID)
    .setClientSecret(CLIENT_SECRET)

    // Set the name of the callback function that should be invoked to
    // complete the OAuth flow.
    .setCallbackFunction('authCallback_')

    // Set the property store where authorized tokens should be persisted.
    .setPropertyStore(userProps)

    // Set scope (required)
    .setScope('data.records:read')

    // Generate code verifier parameter
    .generateCodeVerifier()

    // Add parameters in the authorization url
    .setParam('response_type', 'code')
    .setParam('code_challenge_method', 'S256')
    .setParam('code_challenge', userProps.getProperty('code_challenge'))

    .setTokenHeaders({
      'Authorization': 'Basic ' + Utilities.base64Encode(CLIENT_ID + ':' + CLIENT_SECRET),
      'Content-Type': 'application/x-www-form-urlencoded'
    });;

}

/**
 * Handles the OAuth callback.
 */
function authCallback_(request) {
  var service = getService_();
  var authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied.');
  }

}

/**
 * Logs the redict URI to register.
 */
function logRedirectUri() {
  Logger.log(OAuth2.getRedirectUri());
}
