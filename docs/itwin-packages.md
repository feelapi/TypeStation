## https://github.com/iTwin/itwinjs-core

- [`@itwin/imodels-access-backend-tests`](tests/imodels-access-backend-tests/README.md) package is used internally for API client testing.
- 

## https://github.com/iTwin/imodels-clients

- [`@itwin/imodels-client-management`](clients/imodels-client-management/README.md) is an API client that exposes a subset of iModels API operations and is intended to use in iModel management applications. Such applications do not edit the iModel file itself, they allow user to perform administrative tasks - create Named Versions, view Changeset metadata and such. An example of iTwin management application is the [iTwin Demo Portal](https://itwindemo.bentley.com/).
- [`@itwin/imodels-client-authoring`](clients/imodels-client-authoring/README.md) is an API client that extends `@itwin/imodels-client-management` and exposes additional API operations to facilitate iModel editing workflows. This client should not be used directly as the operations it exposes can only be used meaningfully via [iTwin.js](https://www.itwinjs.org/) library.
- [`@itwin/imodels-access-frontend`](itwin-platform-access/imodels-access-frontend/README.md) package contains an implementation of [`FrontendHubAccess`](https://github.com/iTwin/itwinjs-core/blob/master/core/frontend/src/FrontendHubAccess.ts) interface which enables the iTwin.js platform to use iModels API.
- [`@itwin/imodels-access-backend`](itwin-platform-access/imodels-access-backend/README.md) package contains an implementation of [`BackendHubAccess`](https://github.com/iTwin/itwinjs-core/blob/master/core/backend/src/BackendHubAccess.ts) interface which enables the iTwin.js platform to use iModels API. 
- [`@itwin/imodels-client-common-config`](utils/imodels-client-common-config/README.md) package is used internally to share common configuration across the API clients.
- [`@itwin/imodels-clients-tests`](tests/imodels-clients-tests/README.md) package is used internally for `@itwin/imodels-client-management` and `@itwin/imodels-client-authoring` package testing.
- [`@itwin/imodels-access-backend-tests`](tests/imodels-access-backend-tests/README.md) package is used internally for API client testing.