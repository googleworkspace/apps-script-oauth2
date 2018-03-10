module.exports = {
  "extends": "google",
  "parserOptions": {
    "ecmaVersion": 6,
  },
  "globals": {
    "HtmlService": false,
    "Logger": false,
    "OAuth2": false,
    "UrlFetchApp": false,
  },
  "rules": {
    "comma-dangle": "off",
    "no-var": "off",
    "generator-star-spacing": ["error", {"anonymous": "neither"}],
  }
};
