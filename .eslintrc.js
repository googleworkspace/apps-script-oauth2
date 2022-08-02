/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
