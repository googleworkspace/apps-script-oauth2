# OAuth2 for Apps Script [![Build Status](https://travis-ci.org/googleworkspace/apps-script-oauth2.svg?branch=master)](https://travis-ci.org/googleworkspace/apps-script-oauth2)

OAuth2 for Apps Script is a library for Google Apps Script that provides the
ability to create and authorize OAuth2 tokens as well as refresh them when they
expire. This library uses Apps Script's
[StateTokenBuilder](https://developers.google.com/apps-script/reference/script/state-token-builder)
and `/usercallback` endpoint to handle the redirects.

## Connecting to a Google API

If you are trying to connect to a Google API from Apps Script you might not need
to use this library at all. Apps Script has a number of easy-to-use,
[built-in services][built_in], as well as a variety of
[advanced services][advanced] that wrap existing Google REST APIs.

Even if your API is not covered by either, you can still use Apps Script to
obtain the OAuth2 token for you. Simply
[edit the script's manifest][edit_manifest] to
[include the additional scopes][additional_scopes] that your API requires.
When the user authorizes your script they will also be asked to approve those
additional scopes. Then use the method [`ScriptApp.getOAuthToken()`][scriptapp]
in your code to access the OAuth2 access token the script has acquired and pass
it in the `Authorization` header of a `UrlFetchApp.fetch()` call.

Visit the sample [`NoLibrary`](samples/NoLibrary) to see an example of how this
can be done.

[built_in]: https://developers.google.com/apps-script/reference/calendar/
[advanced]: https://developers.google.com/apps-script/advanced/admin-sdk-directory
[edit_manifest]: https://developers.google.com/apps-script/concepts/manifests#editing_a_manifest
[additional_scopes]: https://developers.google.com/apps-script/concepts/scopes#setting_explicit_scopes
[scriptapp]: https://developers.google.com/apps-script/reference/script/script-app#getoauthtoken

## Setup

This library is already published as an Apps Script, making it easy to include
in your project. To add it to your script, do the following in the Apps Script
code editor:

1. Click on the menu item "Resources > Libraries..."
2. In the "Find a Library" text box, enter the script ID
   `1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF` and click the
   "Select" button.
3. Choose a version in the dropdown box (usually best to pick the latest
   version).
4. Click the "Save" button.

Alternatively, you can copy and paste the files in the [`/dist`](dist) directory
directly into your script project.

If you are [setting explicit scopes](https://developers.google.com/apps-script/concepts/scopes#setting_explicit_scopes)
in your manifest file, ensure that the following scope is included:

* `https://www.googleapis.com/auth/script.external_request`

## Redirect URI

Before you can start authenticating against an OAuth2 provider, you usually need
to register your application with that OAuth2 provider and obtain a client ID
and secret. Often a provider's registration screen requires you to enter a
"Redirect URI", which is the URL that the user's browser will be redirected to
after they've authorized access to their account at that provider.

For this library (and the Apps Script functionality in general) the URL will
always be in the following format:

    https://script.google.com/macros/d/{SCRIPT ID}/usercallback

Where `{SCRIPT ID}` is the ID of the script that is using this library. You
can find your script's ID in the Apps Script code editor by clicking on
the menu item "File > Project properties".

Alternatively you can call the service's `getRedirectUri()` method to view the
exact URL that the service will use when performing the OAuth flow:

```js
/**
 * Logs the redirect URI to register.
 */
function logRedirectUri() {
  var service = getService();
  Logger.log(service.getRedirectUri());
}
```

## Usage

Using the library to generate an OAuth2 token has the following basic steps.

### 1. Create the OAuth2 service

The OAuth2Service class contains the configuration information for a given
OAuth2 provider, including its endpoints, client IDs and secrets, etc. This
information is not persisted to any data store, so you'll need to create this
object each time you want to use it. The example below shows how to create a
service for the Google Drive API.

```js
function getDriveService() {
  // Create a new service with the given name. The name will be used when
  // persisting the authorized token, so ensure it is unique within the
  // scope of the property store.
  return OAuth2.createService('drive')

      // Set the endpoint URLs, which are the same for all Google services.
      .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
      .setTokenUrl('https://accounts.google.com/o/oauth2/token')

      // Set the client ID and secret, from the Google Developers Console.
      .setClientId('...')
      .setClientSecret('...')

      // Set the name of the callback function in the script referenced
      // above that should be invoked to complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the scopes to request (space-separated for Google services).
      .setScope('https://www.googleapis.com/auth/drive')

      // Below are Google-specific OAuth2 parameters.

      // Sets the login hint, which will prevent the account chooser screen
      // from being shown to users logged in with multiple accounts.
      .setParam('login_hint', Session.getEffectiveUser().getEmail())

      // Requests offline access.
      .setParam('access_type', 'offline')

      // Consent prompt is required to ensure a refresh token is always
      // returned when requesting offline access.
      .setParam('prompt', 'consent');
}
```

### 2. Direct the user to the authorization URL

Apps Script UI's are not allowed to redirect the user's window to a new URL, so
you'll need to present the authorization URL as a link for the user to click.
The URL is generated by the service, using the function `getAuthorizationUrl()`.

```js
function showSidebar() {
  var driveService = getDriveService();
  if (!driveService.hasAccess()) {
    var authorizationUrl = driveService.getAuthorizationUrl();
    var template = HtmlService.createTemplate(
        '<a href="<?= authorizationUrl ?>" target="_blank">Authorize</a>. ' +
        'Reopen the sidebar when the authorization is complete.');
    template.authorizationUrl = authorizationUrl;
    var page = template.evaluate();
    SpreadsheetApp.getUi().showSidebar(page);
  } else {
  // ...
  }
}
```

### 3. Handle the callback

When the user completes the OAuth2 flow, the callback function you specified
for your service will be invoked. This callback function should pass its
request object to the service's `handleCallback` function, and show a message
to the user.

```js
function authCallback(request) {
  var driveService = getDriveService();
  var isAuthorized = driveService.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this tab');
  }
}
```

If the authorization URL was opened by the Apps Script UI (via a link, button,
etc) it's  possible to automatically close the window/tab using
`window.top.close()`. You can see an example of this in the sample add-on's
[Callback.html](samples/Add-on/Callback.html#L47).

### 4. Get the access token

Now that the service is authorized you can use its access token to make
requests to the API. The access token can be passed along with a `UrlFetchApp`
request in the "Authorization" header.

```js
function makeRequest() {
  var driveService = getDriveService();
  var response = UrlFetchApp.fetch('https://www.googleapis.com/drive/v2/files?maxResults=10', {
    headers: {
      Authorization: 'Bearer ' + driveService.getAccessToken()
    }
  });
  // ...
}
```


### Logout

To logout the user or disconnect the service, perhaps so the user can select a
different account, use the `reset()` method:

```js
function logout() {
  var service = getDriveService()
  service.reset();
}
```

## Best practices

### Token storage

In almost all cases you'll want to persist the OAuth tokens after you retrieve
them. This prevents having to request access from the user every time you want
to call the API. To do so, make sure you set a properties store when you define
your service:

```js
return OAuth2.createService('Foo')
    .setPropertyStore(PropertiesService.getUserProperties())
    // ...
```

Apps Script has [property stores][property_stores] scoped to the user, script,
or document. In most cases you'll want to choose user-scoped properties, as it
is most common to have each user of your script authorize access to their own
account. However there are uses cases where you'd want to authorize access to
a shared resource and then have all users of the script (or on the same
document) share that access.

When using a service account or 2-legged OAuth flow, where users aren't prompted
for authorization, storing tokens is still beneficial as there can be rate
limits on generating new tokens. However there are edge cases where you need to
generate lots of different tokens in a short amount of time, and persisting
those tokens to properties can exceed your `PropertiesService` quota. In those
cases you can omit any form of token storage and just retrieve new ones as
needed.

[property_stores]: https://developers.google.com/apps-script/reference/properties/properties-service

### Caching

Scripts that use the library heavily should enable caching on the service, so as
to not exhaust their `PropertiesService` quotas. To enable caching, simply add
a `CacheService` cache when configuring the service:

```js
return OAuth2.createService('Foo')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setCache(CacheService.getUserCache())
    // ...
```

Make sure to select a cache with the same scope (user, script, or document) as
the property store you configured.

### Locking

A race condition can occur when two or more script executions are both trying to
refresh an expired token at the same time. This is sometimes observed in
[Gmail Add-ons](https://developers.google.com/gmail/add-ons/), where a user
quickly paging through their email can trigger the same add-on multiple times.

To prevent this, use locking to ensure that only one execution is refreshing
the token at a time. To enable locking, simply add a `LockService` lock when
configuring the service:

```js
return OAuth2.createService('Foo')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setCache(CacheService.getUserCache())
    .setLock(LockService.getUserLock())
    // ...
```

Make sure to select a lock with the same scope (user, script, or document) as
the property store and cache you configured.

## Advanced configuration

See below for some features of the library you may need to utilize depending on
the specifics of the OAuth provider you are connecting to. See the [generated
reference documentation](http://googleworkspace.github.io/apps-script-oauth2/Service_.html)
for a complete list of methods available.

#### Setting the token format

OAuth services can return a token in two ways: as JSON or an URL encoded
string. You can set which format the token is in with
`setTokenFormat(tokenFormat)`. There are two ENUMS to set the mode:
`TOKEN_FORMAT.FORM_URL_ENCODED` and `TOKEN_FORMAT.JSON`. JSON is set as default
if no token format is chosen.

#### Setting additional token headers

Some services, such as the FitBit API, require you to set an Authorization
header on access token requests. The `setTokenHeaders()` method allows you
to pass in a JavaScript object of additional header key/value pairs to be used
in these requests.

```js
.setTokenHeaders({
  'Authorization': 'Basic ' + Utilities.base64Encode(CLIENT_ID + ':' + CLIENT_SECRET)
});
```

See the [FitBit sample](samples/FitBit.gs) for the complete code.

#### Setting the token HTTP method

Almost all services use the `POST` HTTP method when retrieving the access token,
but a few services deviate from the spec and use the `PUT` method instead. To
accomodate those cases you can use the `setTokenMethod()` method to specify the
HTTP method to use when making the request.

#### Modifying the access token payload

Some OAuth providers, such as the Smartsheet API, require you to
[add a hash to the access token request payloads](https://smartsheet-platform.github.io/api-docs/#request-an-access-token).
The `setTokenPayloadHandler` method allows you to pass in a function to modify
the payload of an access token request before the request is sent to the token
endpoint:

```js
// Set the handler for modifying the access token request payload:
.setTokenPayloadHandler(myTokenHandler)
```

See the [Smartsheet sample](samples/Smartsheet.gs) for the complete code.

#### Storing token-related data

Some OAuth providers return IDs and other critical information in the callback
URL along with the authorization code. While it's possible to capture and store
these separately, they often have a lifecycle closely tied to that of the token
and it makes sense to store them together. You can use `Service.getStorage()` to
retrieve the token storage system for the service and set custom key-value
pairs.

For example, the Harvest API returns the account ID of the authorized account
in the callback URL. In the following code the account ID is extracted from the
request parameters and saved saved into storage.

```js
function authCallback(request) {
  var service = getService();
  var authorized = service.handleCallback(request);
  if (authorized) {
    // Gets the authorized account ID from the scope string. Assumes the
    // application is configured to work with single accounts. Has the format
    // "harvest:{ACCOUNT_ID}".
    var scope = request.parameter['scope'];
    var accountId = scope.split(':')[1];
    // Save the account ID in the service's storage.
    service.getStorage().setValue('Harvest-Account-Id', accountId);
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied.');
  }
}
```

When making an authorized request the account ID is retrieved from storage and
passed via a header.

```js
if (service.hasAccess()) {
  // Retrieve the account ID from storage.
  var accountId = service.getStorage().getValue('Harvest-Account-Id');
  var url = 'https://api.harvestapp.com/v2/users/me';
  var response = UrlFetchApp.fetch(url, {
    headers: {
      'Authorization': 'Bearer ' + service.getAccessToken(),
      'User-Agent': 'Apps Script Sample',
      'Harvest-Account-Id': accountId
    }
  });
  ```

Note that calling `Service.reset()` will remove all custom values from storage,
in addition to the token.

#### Passing additional parameters to the callback function

There are occasionally cases where you need to preserve some data through the
OAuth flow, so that it is available in your callback function. Although you
could use the token storage mechanism discussed above for that purpose, writing
to the PropertiesService is expensive and not neccessary in the case where the
user doesn't start or fails to complete the OAuth flow.

As an alternative you can store small amounts of data in the OAuth2 `state`
token, which is a standard mechanism for this purpose. To do so, pass an
optional hash of parameter names and values to the `getAuthorizationUrl()`
method:

```js
var authorizationUrl = getService().getAuthorizationUrl({
  // Pass the additional parameter "lang" with the value "fr".
  lang: 'fr'
});
```

These values will be stored along-side Apps Script's internal information in the
encypted `state` token, which is passed in the authorization URL and passed back
to the redirect URI. The `state` token is automatically decrypted in the
callback function and you can access your parameters using the same
`request.parameter` field used in web apps:

```js
function authCallback(request) {
  var lang = request.parameter.lang;
  // ...
}
```

#### Using service accounts

This library supports the service account authorization flow, also known as the
[JSON Web Token (JWT) Profile](https://tools.ietf.org/html/draft-ietf-oauth-jwt-bearer-12).
This is a two-legged OAuth flow that doesn't require a user to visit a URL and
authorize access.

One common use for service accounts with Google APIs is
[domain-wide delegation](https://developers.google.com/identity/protocols/OAuth2ServiceAccount#delegatingauthority).
This process allows a G Suite domain administrator to grant an
application access to all the users within the domain. When the application
wishes to access the resources of a particular user, it uses the service account
authorization flow to obtain an access token. See the sample
[`GoogleServiceAccount.gs`](samples/GoogleServiceAccount.gs) for more
information.

#### Using alternative grant types

Although optimized for the authorization code (3-legged) and service account
(JWT bearer) flows, this library supports arbitrary flows using the
`setGrantType()` method. Use `setParam()` or `setTokenPayloadHandler()` to add
fields to the token request payload, and `setTokenHeaders()` to add any required
headers.

The most common of these is the `client_credentials` grant type, which often
requires that the client ID and secret are passed in the Authorization header.
When using this grant type, if you set a client ID and secret using
`setClientId()` and `setClientSecret()` respectively then an
`Authorization: Basic ...` header will be added to the token request
automatically, since this is what most OAuth2 providers require. If your
provider uses a different method of authorization then don't set the client ID
and secret and add an authorization header manually.

See the sample [`TwitterAppOnly.gs`](samples/TwitterAppOnly.gs) for a working
example.

## Frequently Asked Questions

### How can I connect to multiple OAuth services?

The service name passed in to the `createService` method forms part of the key
used when storing and retrieving tokens in the property store. To connect to
multiple services merely ensure they have different service names. Often this
means selecting a service name that matches the API the user will authorize:

```js
function run() {
  var gitHubService = getGitHubService();
  var mediumService = getMediumService();
  // ...
}

function getGitHubService() {
  return OAuth2.createService('GitHub')
      // GitHub settings ...
}

function getMediumService() {
  return OAuth2.createService('Medium')
      // Medium settings ...
}
```

Occasionally you may need to make multiple connections to the same API, for
example if your script is trying to copy data from one account to another. In
those cases you'll need to devise your own method for creating unique service
names:

```js
function run() {
  var copyFromService = getGitHubService('from');
  var copyToService = getGitHubService('to');
  // ...
}

function getGitHubService(label) {
  return OAuth2.createService('GitHub_' + label)
      // GitHub settings ...
}
```

You can list all of the service names you've previously stored tokens for using
`OAuth2.getServiceNames(propertyStore)`.

## Compatibility

This library was designed to work with any OAuth2 provider, but because of small
differences in how they implement the standard it may be that some APIs
aren't compatible. If you find an API that it doesn't work with, open an issue
or fix the problem yourself and make a pull request against the source code.

This library is designed for server-side OAuth flows, and client-side flows with
implicit grants (`response_type=token`) are not supported.

## Breaking changes

* Version 20 - Switched from using project keys to script IDs throughout the
library. When upgrading from an older version, ensure the callback URL
registered with the OAuth provider is updated to use the format
`https://script.google.com/macros/d/{SCRIPT ID}/usercallback`.
* Version 22 - Renamed `Service.getToken_()` to `Service.getToken()`, since
there OAuth providers that return important information in the token response.

## Troubleshooting

### You do not have permission to call fetch

You are [setting explicit scopes](https://developers.google.com/apps-script/concepts/scopes#setting_explicit_scopes)
in your manifest file but have forgotten to add the
`https://www.googleapis.com/auth/script.external_request` scope used by this library
(and eventually the `UrlFetchApp` request you are making to an API).
