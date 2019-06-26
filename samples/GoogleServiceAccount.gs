/*
 * This sample demonstrates how to configure the library for Google APIs, using
 * domain-wide delegation (Service Account flow).
 * https://developers.google.com/identity/protocols/OAuth2ServiceAccount#delegatingauthority
 */

// Private key and client email of the service account.
var PRIVATE_KEY =
    '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n';
var CLIENT_EMAIL = '...';

// Email address of the user to impersonate.
var USER_EMAIL = '...';

/**
 * Authorizes and makes a request to the Google Drive API.
 */
function run() {
  var service = getService();
  if (service.hasAccess()) {
    var url = 'https://www.googleapis.com/drive/v3/files?pageSize=1';
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
  return OAuth2.createService('GoogleDrive:' + USER_EMAIL)
      // Set the endpoint URL.
      .setTokenUrl('https://oauth2.googleapis.com/token')

      // Set the private key and issuer.
      .setPrivateKey(PRIVATE_KEY)
      .setIssuer(CLIENT_EMAIL)

      // Set the name of the user to impersonate. This will only work for
      // Google Apps for Work/EDU accounts whose admin has setup domain-wide
      // delegation:
      // https://developers.google.com/identity/protocols/OAuth2ServiceAccount#delegatingauthority
      .setSubject(USER_EMAIL)

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getScriptProperties())

      // Set the scope. This must match one of the scopes configured during the
      // setup of domain-wide delegation.
      .setScope('https://www.googleapis.com/auth/drive');
}
