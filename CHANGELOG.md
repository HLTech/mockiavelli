# 1.0.0 (2020-05-05)


### Features

* Add PATCH method QA-97 ([031f11a](https://github.com/HLTech/mockiavelli/commit/031f11a80fe654bf0723cf865eb30bc3b51a5a30))
* Allow to match requests by body QA-95 ([a429531](https://github.com/HLTech/mockiavelli/commit/a42953190e823f56b57f90cc67ca5abc17f8d3f9))
* FE-132 add mock.waitForRequestsCount() ([142c6b2](https://github.com/HLTech/mockiavelli/commit/142c6b2961ffe5d017fa1be296c0d8c080e6c02e))
* FE-88 initial release ([5593d92](https://github.com/HLTech/mockiavelli/commit/5593d92ec6280d715acbf25a017f42cdecaad2c6))
* QA-111 add "params" to request object passed to mocked response function ([0784782](https://github.com/HLTech/mockiavelli/commit/07847823d1cf6fe6285a0e13957cf9d82cec86e9))
* QA-126 Add compability with playwright ([9970eaf](https://github.com/HLTech/mockiavelli/commit/9970eafdd21f54794a1b4867388f2e591030fa0b))
* QA-126 Add playwright tests + upgrade playwright to 0.12 ([4dc1e8a](https://github.com/HLTech/mockiavelli/commit/4dc1e8a907e0116254087754ab26044affc23288))
* QA-14 Implemented matching most recently added mock first. ([9699ef0](https://github.com/HLTech/mockiavelli/commit/9699ef0ff2fede55bb5891b63fa1cde1ea87b12c))
* QA-15 Added http methods for GET,POST,PUT,DELETE with filter as object or string. Renamed addRestMock to mockREST. ([e4c0444](https://github.com/HLTech/mockiavelli/commit/e4c04449a7743f04348af7421c93e606d0c576d5))
* QA-16 Added path variables handling feature. ([90258be](https://github.com/HLTech/mockiavelli/commit/90258be16a390ae6f591ffc6eb06081475fadd0e))
* QA-17 Added once option. ([9be9418](https://github.com/HLTech/mockiavelli/commit/9be94180ec55d5828854d856410d12749c479b8f))
* QA-20 add support for CORS requests ([4e11645](https://github.com/HLTech/mockiavelli/commit/4e11645c7123d9977b79a73eefb101c85383ab16))
* QA-20 allow to specify responses as functions ([b3c3622](https://github.com/HLTech/mockiavelli/commit/b3c36221338bb5ba984f6b005277b5f1e6676be0))
* QA-20 fixes to CORS ([9986645](https://github.com/HLTech/mockiavelli/commit/9986645a0c25f56039c1300a8611d20f9843d68a))
* QA-20 fixes to CORS [#2](https://github.com/HLTech/mockiavelli/issues/2) ([62d40ab](https://github.com/HLTech/mockiavelli/commit/62d40ab3311fd323a4d602755f74643f17234749))
* QA-20 fixes to CORS [#3](https://github.com/HLTech/mockiavelli/issues/3) ([2ea7efb](https://github.com/HLTech/mockiavelli/commit/2ea7efb265b71c8148f90881b0a29d97c758d4e3))
* **Mocketeer:** QA-12 mocketeer.getRequest throws error when matching request was not found ([6d37898](https://github.com/HLTech/mockiavelli/commit/6d37898376be47f4e557e3d76f1bada8e8cba8cd))
* **Mocketeer:** QA-13 add Mocketeer.setup static method, depracate mocketeer.activate ([a02881a](https://github.com/HLTech/mockiavelli/commit/a02881adc4b0b423e110e8de8a67976cc473e79e))
* **Mocketeer:** QA-20 allow to intercept requests of any type ([4d0a644](https://github.com/HLTech/mockiavelli/commit/4d0a6445a12997b349485457cb5affee976d6b77))


* feat!: QA-96 mocketeer.mock requires HTTP Method as parameter ([b247ea5](https://github.com/HLTech/mockiavelli/commit/b247ea554301c408ae1ed556083825c244faf9b9))
* chore!: Rename mock.getRequest to mock.waitForRequest QA-94 ([a0af628](https://github.com/HLTech/mockiavelli/commit/a0af628b29ada9f65b318898edfc741b67d07627))


### Bug Fixes

* FE-88 improve documentation and debug info ([80128a3](https://github.com/HLTech/mockiavelli/commit/80128a3bc4a24fcaba547bc065b425be8f2c0a10))
* FE-88 minor improvements to debug mode ([5708c58](https://github.com/HLTech/mockiavelli/commit/5708c58cd74a01ab6933d8e1054e288a0244141d))
* QA-100 stalled request when mocked body is empty and using ppter 2.0+ ([a823a61](https://github.com/HLTech/mockiavelli/commit/a823a619248566610cafee9e821dcd582ad8c3a2))
* QA-93 Upgrade path-to-regex ([0c0ffd1](https://github.com/HLTech/mockiavelli/commit/0c0ffd1fd2d3417f08b7b40ed9becb20f7bc58cf))


### BREAKING CHANGES

* - mocketeer.mock no longer defaults to GET method, but requires to be provided with HTTP method explicitly
-  rename RequestMatcherObject to RequestFilter
* For consistency with puppeteer and playwright methods .waitForX rename mock.getRequest => mock.waitForRequest
* **Mocketeer:** remove deprecated API methods
* **Mocketeer:** rename types
* **Mocketeer:** can mock any requests, not just FETCH/XHR calls
* Changed order for adding mocks - newest first.
