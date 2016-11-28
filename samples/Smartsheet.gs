var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the Smartsheet API.
 */
function run() {
  var service = getService();
  if (service.hasAccess()) {
    var url = 'https://api.smartsheet.com/2.0/users/me';
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
  var service = getService();
  service.reset();
}

/**
 * Configures the service.
 */
function getService() {
  return OAuth2.createService('Smartsheet')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://app.smartsheet.com/b/authorize')
      .setTokenUrl('https://api.smartsheet.com/2.0/token')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to complete
      // the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())
  
      // Scopes to request
      .setScope('READ_SHEETS')
            
      // Set the handler for adding Smartsheet's required SHA hash parameter to the payload:
      .setTokenPayloadHandler(smartsheetTokenHandler)
}

/**
 * Handles the OAuth callback.
 */
function authCallback(request) {
  var service = getService();
  var authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied');
  }
}

/**
 * Adds the Smartsheet API's required SHA256 hash parameter to the access token request payload.
 */
function smartsheetTokenHandler(payload) {
  var codeOrRefreshToken = payload.code ? payload.code : payload.refresh_token;
  var input = CLIENT_SECRET + "|" + codeOrRefreshToken;
  var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
                                          input,
                                          Utilities.Charset.UTF_8);
  hash = hash.map(function(val) {
    // Google appears to treat these as signed bytes, but we need them unsigned...
    if (val < 0)
      val += 256;
    var str = val.toString(16);
    // pad to two hex digits:
    if (str.length == 1)
      str = '0' + str;
    return str;
  });
  payload.hash = hash.join("");
  // The Smartsheet API doesn't need the client secret sent (secret is verified by the hash)
  if (payload.client_secret) {
    delete payload.client_secret;
  }
  return payload;  
}
