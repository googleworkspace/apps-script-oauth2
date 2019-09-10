# Connect to a Google API without this library

This sample demonstrates how to connect to a Google Search Console API, which is
not available natively in Apps Script. The
[script's manifest file][edit_manifest]
has been edited to [include the additional scope][additional_scopes] that the
API requires. When a user authorizes the script they will also be asked to
approve that additional scope. We can then use the method
[`ScriptApp.getOAuthToken()`][scriptapp] to access the OAuth2 access token the
script has acquired and pass it in the `Authorization` header of a
`UrlFetchApp.fetch()` call to the API.

[edit_manifest]: https://developers.google.com/apps-script/concepts/manifests#editing_a_manifest
[additional_scopes]: https://developers.google.com/apps-script/concepts/scopes#setting_explicit_scopes
[scriptapp]: https://developers.google.com/apps-script/reference/script/script-app#getoauthtoken
