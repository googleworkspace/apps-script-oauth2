var PRIVATE_KEY =
    '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n';
var CLIENT_EMAIL = '...';

/**
 * Authorizes and makes a request to the Hangouts Chat API
 * for sending a text message to all DMs bot has been added.
 * For a more detailed guide on building bots, follow the codelab:
 * https://codelabs.developers.google.com/codelabs/chat-apps-script/
 */
function sendPushMessage() {
  var service = getChatbotService();
  if (service.hasAccess()) {
    // We retrieve all the spaces bot has been added
    var url = 'https://chat.googleapis.com/v1/spaces';
    var response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      }
    });
    var rep = JSON.parse(response.getContentText());
    if (rep.spaces && rep.spaces.length > 0) {
      for (var i = 0; i < rep.spaces.length; i++) {
        var space = rep.spaces[i];
        if (space.type == 'DM') {
          // We send message only to Direct Message (DM)
          var url = 'https://chat.googleapis.com/v1/'+space.name+'/messages';
          var options = {
            method: 'POST',
            contentType: 'application/json',
            headers: {
              Authorization: 'Bearer ' + service.getAccessToken()
            },
            payload: JSON.stringify({text: 'Hello world !'})
          };
          // We send message to the DM
          UrlFetchApp.fetch(url, options);
        } else {
          // If Type is 'ROOM' or 'TYPE_UNSPECIFIED' we don't send notification.
        }
      }
    } else {
      Logger.log('Bot is not added to any spaces');
    }
  } else {
    Logger.log(service.getLastError());
  }
}

/**
 * Reset the authorization state, so that it can be re-tested.
 */
function reset() {
  getChatbotService().reset();
}


/**
 * Configures the Chatbot service.
 * For service account setup follow Step 1 on this page
 * https://developers.google.com/hangouts/chat/how-tos/service-accounts
 */
function getChatbotService() {
  return OAuth2.createService('MyChatBot')
      // Set the endpoint URL.
      .setTokenUrl('https://accounts.google.com/o/oauth2/token')

      // Set the private key and issuer.
      .setPrivateKey(PRIVATE_KEY)
      .setIssuer(CLIENT_EMAIL)

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getScriptProperties())

      // Set the scope. This must match one of the scopes configured during the
      .setScope('https://www.googleapis.com/auth/chat.bot');
}
