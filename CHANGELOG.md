# Changelog

## [1.43.1](https://github.com/googleworkspace/apps-script-oauth2/compare/v1.43.0...v1.43.1) (2025-11-18)


### Bug Fixes

* **basecamp:** type parameter ([#427](https://github.com/googleworkspace/apps-script-oauth2/issues/427)) ([9499dba](https://github.com/googleworkspace/apps-script-oauth2/commit/9499dba62922538cb65f28cdfbefa5848e9aaa09))
* Dropbox sample not getting refresh token ([#435](https://github.com/googleworkspace/apps-script-oauth2/issues/435)) ([91d7aa3](https://github.com/googleworkspace/apps-script-oauth2/commit/91d7aa320dd15760417c43628944b5b5b8cf0778))
* issue with refreshing token when client_secret is not set ([#513](https://github.com/googleworkspace/apps-script-oauth2/issues/513)) ([aae9287](https://github.com/googleworkspace/apps-script-oauth2/commit/aae9287bbe2fc35c302ed61ef520e5fa09fc5b4d))
* **Twitter:** Use builtin code verifier capability ([#457](https://github.com/googleworkspace/apps-script-oauth2/issues/457)) ([f57c727](https://github.com/googleworkspace/apps-script-oauth2/commit/f57c727da61be0c51e12a465368bb669216996ff))

## [1.43.0](https://github.com/googleworkspace/apps-script-oauth2/compare/v1.42.1...v1.43.0) (2022-12-01)


### Features

* Allow usage without client_secret for services that only rely on PKCE ([e6afdfb](https://github.com/googleworkspace/apps-script-oauth2/commit/e6afdfb52d613f4e99002bf72228b32a7299cfc7))

## [1.42.1](https://github.com/googleworkspace/apps-script-oauth2/compare/v1.42.0...v1.42.1) (2022-09-23)


### Bug Fixes

* Remove use of 'let' for Rhino compatibility ([f6fdc9a](https://github.com/googleworkspace/apps-script-oauth2/commit/f6fdc9ac98bb4c099c002c60b1a5ddced66f95f1))
* Remove use of 'let' for Rhino compatibility ([089a3e4](https://github.com/googleworkspace/apps-script-oauth2/commit/089a3e4af8c06b82156e76ef2b78b5f202a0a0e5))

## 1.42.0 (2022-09-22)

### Features

* PKCE code verifier support ([#339](https://github.com/googleworkspace/apps-script-oauth2/pull/339))

### Bug Fixes

* "Prompt" property for auth URL in sample ([#317](https://github.com/googleworkspace/apps-script-oauth2/issues/317)) ([6da6876](https://github.com/googleworkspace/apps-script-oauth2/commit/6da68763a98586ae0bc916e5258ea7f0bebf4cb2))
* prevent samples from leaking OAuth client ID + Secret to users ([#379](https://github.com/googleworkspace/apps-script-oauth2/issues/379)) ([a5480c1](https://github.com/googleworkspace/apps-script-oauth2/commit/a5480c177386a807461b84d1b84627e272bc2355))
