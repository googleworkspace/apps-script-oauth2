/**
 * This sample demonstrates how to connect to an application protected by Google
 * Cloud's Identity-Aware Proxy (IAP), using a service account.
 * @see https://cloud.google.com/iap/docs/authentication-howto#authenticating_from_a_service_account
 */

// A client ID and secret created for this script. It must be in the same Cloud
// Console project as the IAP-secured application.
var PRIVATE_KEY =
    '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n';
var CLIENT_EMAIL = '...';

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
        Authorization: 'Bearer ' + service.getIdToken()
      }
    });
    var result = response.getContentText();
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
  return OAuth2.createService('CloudIAPServiceAccount')
      // Set the endpoint URL.
      .setTokenUrl('https://accounts.google.com/o/oauth2/token')

      // Set the private key and issuer.
      .setPrivateKey(PRIVATE_KEY)
      .setIssuer(CLIENT_EMAIL)
      .setAdditionalClaims({
        target_audience: IAP_CLIENT_ID
      })

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getScriptProperties());
}
