/**
 * Demonstrates how to authorize access to the Jira API using the authorization
 * code grants (3LO) for apps flow.
 * @see {@link https://developer.atlassian.com/cloud/jira/platform/oauth-2-authorization-code-grants-3lo-for-apps/}
 */

var CLIENT_ID = '...';
var CLIENT_SECRET = '...';

// The key to use when storing the cloudid.
var CLOUDID_KEY = 'cloudid';

/**
 * Authorizes and makes a request to the UltraCart API.
 */
function run() {
  var service = getService_();
  if (service.hasAccess()) {
    var cloudid = getCloudId(service);
    var url = 'https://api.atlassian.com/ex/jira/' + cloudid +
        '/rest/api/3/myself';
    var response = UrlFetchApp.fetch(url, {
      headers: {
        Accept: 'application/json',
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
 * Gets the cloudid of the Jira site to operate against. This implementation
 * selects the first authorized site, but in a real application you'd probably
 * want to let the user select which site to operate against. After the first
 * run the cloudid is saved into the service's storage layer for easy retrieval.
 * @param {OAuth.Service_} service The authorized service.
 * @returns {string} The cloudid of the site to operate on.
 */
function getCloudId(service) {
  var cloudid = service.getStorage().getValue(CLOUDID_KEY);
  if (cloudid) return cloudid;
  // Get the cloudid of the first site the user has access to.
  var url = 'https://api.atlassian.com/oauth/token/accessible-resources';
  var response = UrlFetchApp.fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: 'Bearer ' + service.getAccessToken()
    }
  });
  var result = JSON.parse(response.getContentText());
  cloudid = result[0].id;
  service.getStorage().setValue(CLOUDID_KEY, cloudid);
  return cloudid;
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
  return OAuth2.createService('Jira')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://auth.atlassian.com/authorize')
      .setTokenUrl('https://auth.atlassian.com/oauth/token')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the scope and other paramaeters required by Atlassian.
      .setScope('read:jira-user')
      .setParam('audience', 'api.atlassian.com')
      .setParam('prompt', 'consent');
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
    return HtmlService.createHtmlOutput('Denied');
  }
}

/**
 * Logs the redict URI to register.
 */
function logRedirectUri() {
  Logger.log(OAuth2.getRedirectUri());
}
