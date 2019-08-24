# Unique validation for Objection.js

This plugin adds a unique validation for [Objection.js](https://github.com/Vincit/objection.js/) models.

**NOTE:** Unique validation at update only works with `$query` methods.

Forked from [seegno/objection-unique](https://github.com/seegno/objection-unique) with patch from [nicolaracco](https://github.com/nicolaracco).
 
## Installation

### NPM

```sh
npm i @zooxsmart/objection-unique --save
```

### Yarn

```sh
yarn add @zooxsmart/objection-unique
```

## Usage

### Mixin the plugin

```js
// Import objection model.
const Model = require('objection').Model;

// Import the plugin.
const unique = require('objection-unique')({
  fields: ['email', 'username', ['phone_prefix','phone_number']],
  identifiers: ['id']
});

// Mixin the plugin.
class User extends unique(Model) {
  static get tableName() {
    return 'User';
  }
}
```

### Validate insert

```js
/**
 * Insert.
 */

// Insert one user.
await User.query().insert({ email: 'foo', username: 'bar' });

try {
  // Try to insert another user with the same data.
  await User.query().insert({ email: 'foo', username: 'bar' });
} catch (e) {
    // Exception with the invalid unique fields
    //
    // {
    //   email: [{
    //     keyword: 'unique',
    //     message: 'email already in use.'
    //   }],
    //   username: [{
    //     keyword: 'unique',
    //     message: 'username already in use.'
    //   }
    // }
}
```

### Validate update/patch

```js
/**
 * Update/Patch.
 */

// Insert one user.
await User.query().insert({ email: 'foo', username: 'bar' });

// Insert the user that we want to update.
const user = await User.query().insertAndFetch({ email: 'biz', username: 'buz' });

try {
  user.$query().update({ email: 'foo', username: 'buz' });
  // user.$query().patch({ email: 'foo' });
} catch (e) {
  // Exception with the invalid unique fields
  //
  // {
  //   email: [{
  //     keyword: 'unique',
  //     message: 'email already in use.'
  //   }]
  // }
}
```

## Options

**fields:** The unique fields. Compound fields can be specified as an array

**identifiers:** The fields that identifies the model. (Default: ['id'])

These options can be provided when instantiating the plugin:

```js
const unique = require('objection-unique')({
  fields: ['email', 'username', ['phone_prefix', 'phone_number']],
  identifiers: ['id']
});
```

## Tests

Run the tests from the root directory:

```sh
npm test
```
