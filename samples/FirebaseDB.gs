/**
 * This sample uses the Firebase Admin SDK to read from a Firebase Realtime
 * Database.
 * https://firebase.google.com/docs/reference/rest/database/
 * https://firebase.google.com/docs/admin/setup
 */

var PROJECT_ID = '...';
var PRIVATE_KEY = '...';
var CLIENT_EMAIL = '...';

/**
 * Authorizes and makes a request to a Firebase Database.
 */
function run() {
  var service = getService();
  if (service.hasAccess()) {
    var url = 'https://' + PROJECT_ID + '.firebaseio.com/.json?shallow=true';
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
  var service = getService();
  service.reset();
}

/**
 * Configures the service.
 */
function getService() {
  return OAuth2.createService('FirebaseDB')
      // Set the endpoint URL.
      .setTokenUrl('https://accounts.google.com/o/oauth2/token')

      // Set the private key and issuer.
      .setPrivateKey(PRIVATE_KEY)
      .setIssuer(CLIENT_EMAIL)

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getScriptProperties())

      // Set the scope and additional Google-specific parameters.
      .setScope([
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/firebase.database'
      ]);
}
