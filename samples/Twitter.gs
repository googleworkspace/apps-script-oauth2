var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

/**
 * Authorizes and makes a request to the Twitter API v2
 * OAuth 2.0 Making requests on behalf of users
 * https://developer.twitter.com/en/docs/authentication/oauth-2-0/user-access-token
 */
function run() {
  var service = getService_();
  if (service.hasAccess()) {
    // https://developer.twitter.com/en/docs/twitter-api/users/lookup/api-reference/get-users-by-username-username
    var url = `https://api.twitter.com/2/users/by/username/workspacedevs?user.fields=verified`;
    var response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      },
      muteHttpExceptions: true
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
  PropertiesService.getUserProperties().deleteProperty("code_challenge");
  PropertiesService.getUserProperties().deleteProperty("code_verifier");
}

/**
 * Configures the service.
 */
function getService_() {
  pkceChallengeVerifier();
  var userProps = PropertiesService.getUserProperties();
  return OAuth2.createService('Twitter')
  // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://twitter.com/i/oauth2/authorize')
      .setTokenUrl(
          'https://api.twitter.com/2/oauth2/token?code_verifier=' + userProps.getProperty('code_verifier'))

  // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

  // Set the name of the callback function that should be invoked to
  // complete the OAuth flow.
      .setCallbackFunction('authCallback')

  // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(userProps)

  // Set the scopes to request (space-separated for Twitter services).
      .setScope('users.read tweet.read offline.access')

  // Add parameters in the authorization url
      .setParam('response_type', 'code')
      .setParam('code_challenge_method', 'S256')
      .setParam('code_challenge', userProps.getProperty('code_challenge'))

      .setTokenHeaders({
        'Authorization': 'Basic ' + Utilities.base64Encode(CLIENT_ID + ':' + CLIENT_SECRET),
        'Content-Type': 'application/x-www-form-urlencoded'
      });
}

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
 * Logs the redict URI to register.
 */
function logRedirectUri() {
  Logger.log(OAuth2.getRedirectUri());
}

/**
 * Generates code_verifier & code_challenge for PKCE
 */
function pkceChallengeVerifier() {
  var userProps = PropertiesService.getUserProperties();
  if (!userProps.getProperty('code_verifier')) {
    var verifier = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

    for (var i = 0; i < 128; i++) {
      verifier += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    var sha256Hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, verifier);

    var challenge = Utilities.base64Encode(sha256Hash)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    userProps.setProperty('code_verifier', verifier);
    userProps.setProperty('code_challenge', challenge);
  }
}
