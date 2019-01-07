/**
 * This sample demonstrates how to connect to an application protected by Google
 * Cloud's Identity-Aware Proxy (IAP).
 * @see https://cloud.google.com/iap/docs/authentication-howto
 */

// A client ID and secret created for this script. It must be in the same Cloud
// Console project as the IAP-secured application.
var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

// The OAuth client created automatically when you enabled IAP on your
// applicaiton. Can be found by clicking "Edit OAuth Client" in the IAP
// interface.
var IAP_CLIENT_ID = '...';

// A URL endpoint for your IAP-secured application.
var IAP_URL = '...';

/**
 * Authorizes and makes a request to an endpoint protected by the Cloud
 * Identity-Aware Proxy.
 */
function run() {
  var service = getService();
  if (service.hasAccess()) {
    var response = UrlFetchApp.fetch(IAP_URL, {
      headers: {
        // As per the IAP documentation, use the id_token, not the access_token,
        // to authorize the request.
        Authorization: 'Bearer ' + service.getToken().id_token
      }
    });
    var result = response.getContentText();
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
  return OAuth2.createService('CloudIAP')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
      .setTokenUrl('https://www.googleapis.com/oauth2/v4/token')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the scope and additional Google-specific parameters.
      .setScope('openid email')
      .setParam('access_type', 'offline')
      .setParam('approval_prompt', 'force')
      .setParam('login_hint', Session.getActiveUser().getEmail())

      // Modify the token request payload to specify the "audience" parameter,
      // which must be set to the IAP client ID.
      .setTokenPayloadHandler(function(payload) {
        payload.audience = IAP_CLIENT_ID;
        return payload;
      });
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
    return HtmlService.createHtmlOutput('Denied.');
  }
}

/**
 * Logs the redict URI to register in the Google Developers Console.
 */
function logRedirectUri() {
  Logger.log(OAuth2.getRedirectUri());
}
