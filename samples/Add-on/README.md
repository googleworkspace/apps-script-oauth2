# Sample Add-on

This sample add-on for Google Sheets connects to your GitHub account using the
Apps Script OAuth2 library and displays some information about the
repositories you own. It demonstrates some best practices for using this
library in an add-on environment.

## Intercom.js

This add-on uses the [intercom.js library](https://github.com/diy/intercom.js/)
to communicate between tabs / windows. Specifically, the callback page sends a
message to the sidebar letting it know when the authorization flow has
completed, so it can start updating its contents.

## AngularJS

This add-on uses the [AngularJS 1 framework](https://angularjs.org/) to make it
easier to update the sidebar dynamically. It's use is not required, and many
other JavaScript frameworks would work just as well.
