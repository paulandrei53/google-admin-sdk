# Nodejs Google Admin SDK
This is an unofficial Admin SDK

## Initializing the library
The library support the following resources:
* [`DomainProvisioning`](#DomainProvisioning) for CRUD operations on [Domains](https://developers.google.com/admin-sdk/directory/reference/rest/v1/groups)
* [`GroupProvisioning`](#GroupProvisioning) for CRUD operations on [Groups](https://developers.google.com/admin-sdk/directory/reference/rest/v1/groups)
* [`OrgUnitProvisioning`](#OrgUnitProvisioning) for CRUD operations on [OrgUnits](https://developers.google.com/admin-sdk/directory/reference/rest/v1/orgunits)
* [`UserProvisioning`](#UserProvisioning) for CRUD operations on [Users](https://developers.google.com/admin-sdk/directory/reference/rest/v1/users)

## Installation

```
npm install nodejs-google-admin-sdk
```

To use the library, you must have a refresh token. It can be obtained from [here](https://cloud.google.com/appengine/docs/admin-api/trying-the-api), depending on the purposes you want.
```
const config = {
  client: {
    id: '1234567890-3ds5um9ecm6ecd3nc.apps.googleusercontent.com',
    secret: 'abcdefgh'
  },
  token: {
    refresh: 'your_refresh_token'
  }
};
```

The library is designed such that you can initialize and use any submodule independently of the other three. Any or all submodules can be initialized using the credentials above:
```
const adminSDK = require('nodejs-google-admin-sdk');
const userProvisioning = new adminSDK.UserProvisioning(config);
```

## Example usage
```
const newUser = {
  name: {
    givenName: 'John',
    familyName: 'Doe',
  },
  password: 'password123456',
  primaryEmail: 'john.doe@example.com'
  fields: "kind,nextPageToken,users(id,kind,name,orgUnitPath,primaryEmail)"
};
userProvisioning.insert(newUser, function(err, body) {
  console.log("Received response: " + body);
});
```
Note: it is recommended to use Google's [fields editor](https://developers.google.com/admin-sdk/directory/v1/reference/users/insert) to construct queries with `fields` arguments.

```
const newUser = {
  name: {
    givenName: 'John',
    familyName: 'Doe',
  },
  password: 'password123456',
  primaryEmail: 'john.doe@example.com'
};
query = userProvisioning.insert(newUser);
query.exec(function(err, body){
  // Handle error and body
});
```

## Group Provisioning

<a name="GroupProvisioning+create"></a>

GroupProvisioning supports all functions supported by UserProvisioning except `update`. The function signatures and behaviors are identical, except they accept a unique groupkey instead of a unique userkey.

## OrgUnitProvisioning

<a name="OrgUnitProvisioning+create"></a>

The following provide functionality for querying the orgunits endpoint of the Directory API. For information on constructing queries and parsing responses, see the [official documentation](https://developers.google.com/admin-sdk/directory/v1/reference/orgunits).

### OrgUnitProvisioning.findOrCreate(customer_id, org_unit[, cache, callback])
Creates an OrgUnit and any of its parents that need to be created. Accepts arguments:
* `customer_id`: your Google customer id.
* `org_unit`: an array of the form that specifies the path of the OrgUnit to create. For example, to create the OrgUnit "/Users/Admins/SuperAdmins", pass in `['Users', 'Admins', 'SuperAdmins'].
* `cache` (optional): a map of strings representing OrgUnits that are known to exist. For example, `{'/': 1, 'Users':1, 'Admins':1}
* `callback` (optional): function of the form `callback(error, body)` to call when the response is received.

Note that `findOrCreate` uses [`async.memoize`](https://github.com/caolan/async#memoize). This can cause problems with tests that expect a fresh state at the beginning of each test. You can use [`async.unmemoize`](https://github.com/caolan/async#unmemoizefn) to reset state.

### OrgUnitProvisioning.insert(customer_id, properties[, fields, callback])
Creates an OrgUnit. Accepts arguments:
* `customer_id`: your Google customer id.
* `properties`: an object that specifies the name of the OrgUnit to create. Uses the form `{ name: 'X', parent: 'Y' }`. Note that the parent must already exist; to deep create an OrgUnit, use `OrgUnitProvisioning.findOrCreate`.
* `fields` (optional): fields to return in the response.
* `callback` (optional): function of the form `callback(error, body)` to call when the response is received.

### OrgUnitProvisioning.list(customer_id, params, [, callback])
Lists OrgUnits owned by a customer. Accepts arguments:
* `customer_id`: your Google customer id.
* `params` (optional): object containing querystring arguments.
* `callback` (optional): function of the form `callback(error, body)` to call when the response is received.

### OrgUnitProvisioning.get(customer_id, org_unit_path, [, callback])
Gets a single OrgUnit owned by a customer. Accepts arguments:
* `customer_id`: your Google customer id.
* `org_unit_path`: String representation of the OrgUnit to find.
* `callback` (optional): function of the form `callback(error, body)` to call when the response is received.

### OrgUnitProvisioning.patch(customer_id, org_unit_path[, body, fields, callback])
Updates an OrgUnit using [patch semantics](https://developers.google.com/admin-sdk/directory/v1/guides/performance#patch). Accepts arguments:
* `customer_id`: your Google customer id.
* `org_unit_path`: the full OrgUnit path to update.
* `body` (optional): object containing the fields to update on the OrgUnit and their new values.
* `fields` (optional): fields to return in the response.
* `callback` (optional): function of the form `callback(error, body)` to call when the response is received.

### OrgUnitProvisioning.delete(customer_id, org_unit_path, [, callback])
Deletes an OrgUnit. Accepts arguments:
* `customer_id`: your Google customer id.
* `org_unit_path`: String representation of the OrgUnit to delete.
* `callback` (optional): function of the form `callback(error, body)` to call when the response is received.


## User Provisioning

<a name="UserProvisioning+create"></a>

The following provide functionality for querying the Users endpoint of the Directory API. For information on constructing queries and parsing responses, see the [official documentation](https://developers.google.com/admin-sdk/directory/v1/reference/users).

### UserProvisioning.insert(body[, fields, callback])
Creates a Google Apps user. Accepts arguments:
* `body`: specifies the `name`, `password`, and `primaryEmail` of the user.
* `fields` (optional): specifies which user fields are included in the response.
* `callback` (optional): a function of the form `callback(error, body)` to be called when the response is received.

### UserProvisioning.get(userkey[, callback])
Gets information for a single user. Accepts arguments:
* `userkey`: the unique userkey of the user to find.
* `callback` (optional): function of the form `callback(error, body)` to call when the response is received.

### UserProvisioning.list(params[, callback])
Lists Google Apps users. Accepts arguments:
* `params`: user fields to query by
* `callback` (optional): function of the form `callback(error, body)` to call when the response is received.

#### Example
```
// Get at most 200 users in the domain `example.com`
const params = {
  domain: 'example.com',
  max_results: 200
};

userProvisioning.list(params, function(err, body) {
  // Handle error and do something with users
});
```

### UserProvisioning.patch(userkey, body[, fields, callback])
Updates a user using [patch semantics](https://developers.google.com/admin-sdk/directory/v1/guides/performance#patch). Accepts arguments:
* `userkey`: the unique userkey of the user to update.
* `body`: object containing fields to update on the user and their new values.
* `fields` (optional): fields to return in the response.
* `callback` (optional): function of the form `callback(error, body)` to call when the response is received.

### UserProvisioning.update(userkey, body[, fields, callback])
Same as `patch`, but updates a user without using [patch semantics](https://developers.google.com/admin-sdk/directory/v1/guides/performance#patch).

### UserProvisioning.delete(userkey[, callback])
Deletes a user. Accepts arguments:
* `userkey`: the unique userkey of the user to delete.
* `callback` (optional): function of the form `callback(error, body)` to call when the response is received.