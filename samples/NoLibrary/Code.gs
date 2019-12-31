/**
 * Use the Search Console API to list the URLs of all the sites you have setup.
 * @see {@link https://developers.google.com/webmaster-tools/}
 */
function listSearchConsoleSites() {
  var url = 'https://www.googleapis.com/webmasters/v3/sites/{siteUrl}';
  var token = ScriptApp.getOAuthToken();
  var response = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: 'Bearer ' + token
    }
  });
  var result = JSON.parse(response.getContentText());
  result.siteEntry.forEach(function(siteEntry) {
    Logger.log(siteEntry.siteUrl);
  });
}
