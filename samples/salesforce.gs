// You must create a new connected app in your Salesforce org in order to obtain the CLIENT_ID and CLIENT_SECRET
// You must retrieve the Script ID, and supply the callback URL accordingly in your connected app settings

var AUTHORIZE_URL = 'https://login.salesforce.com/services/oauth2/authorize'; 
var TOKEN_URL = 'https://login.salesforce.com/services/oauth2/token';
var CLIENT_ID = "xxxx";
var CLIENT_SECRET = "xxxx";
var REDIRECT_URL = "https://script.google.com/macros/d/{SCRIPT_ID}/usercallback";
var PROPERTY_STORE = PropertiesService.getUserProperties();


function getSalesforceService() {
  // Create a new service with the given name. The name will be used when
  // persisting the authorized token, so ensure it is unique within the
  // scope of the property store
  return OAuth2.createService('Salesforce')

      .setAuthorizationBaseUrl(AUTHORIZE_URL)
      .setTokenUrl(TOKEN_URL)

      // Set the client ID and secret, from the Salesforce Connected App
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function in the script referenced
      // above that should be invoked to complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PROPERTY_STORE)

      // Salesforce specific params
      .setParam('response_type', 'code')
      .setParam('display', 'popup');
}

function showSidebar() {
  var salesforceService = getSalesforceService();
  //if (!salesforceService.hasAccess()) {
    var authorizationUrl = salesforceService.getAuthorizationUrl();
    var template = HtmlService.createTemplate(
        '<a href="<?= authorizationUrl ?>" target="_blank">Authorize</a>. ' +
        'Reopen the sidebar when the authorization is complete.');
    template.authorizationUrl = authorizationUrl;
    var page = template.evaluate();
    SpreadsheetApp.getUi().showSidebar(page);
    //DocumentApp.getUi().showSidebar(page);
  //} else {
  // ...
  //}
}

function authCallback(request) {
  var salesforceService = getSalesforceService();    
  var isAuthorized = salesforceService.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this tab');
  }
}

function whoAmI() {
  var salesforceService = getSalesforceService();
  var token = salesforceService.getAccessToken();
  var instanceURL = salesforceService.getToken_().instance_url;
  var response = UrlFetchApp.fetch(instanceURL + '/services/data/v24.0/chatter/users/me', {
    headers: {
      Authorization: 'Bearer ' + token
    }
  });
  Logger.log(response);
}

function onOpen(e) {
   SpreadsheetApp.getUi()
       .createMenu('Salesforce Connect')
       .addItem('Authorize', 'showSidebar')
       .addItem('WhoAmI', 'whoAmI')
       .addToUi();
 }
