  /**
 * Authorizes and makes a request to the Docusign API.
 */
function rundocusign() {
     var payload=
 {
  'emailSubject': 'EMAIL-SUBJECT',
  'status': 'sent',
    'emailBlurb': 'EMAIL-CONTENT',
  'templateId': 'TEMPLATE-ID-TO-BE-USED',
  'templateRoles': [
    {
      'email': 'joebloggs@sample.com',
      'name': 'Joe Blogger',
      'roleName': 'role1'
    }
  ]
};
  var service = getService();
  if (service.hasAccess()) {
    var url = 'https://demo.docusign.net/restapi/v2/accounts/[ACCOUNT-ID]/envelopes';
    var response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()

      },
      method: 'post',
    contentType: 'application/json',
    grant_type: 'authorization_code',
    payload: JSON.stringify(payload)
    });
    var result = response.getContentText();
    Logger.log(result, null, 1);
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
  return OAuth2.createService('Docusign')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://account-d.docusign.com/oauth/auth')
      .setTokenUrl('https://account-d.docusign.com/oauth/token')

      // Set the client ID and secret.
      .setClientId('...')
      .setClientSecret('..')

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
      .setCallbackFunction('usercallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())
      .setScope('openid');
};
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
 * Logs the redict URI to register in the Dropbox application settings.
 */
function logRedirectUri() {
  Logger.log(OAuth2.getRedirectUri());
}
