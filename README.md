# Sails Ember.js Responses

A pack to change default sails.js responses to ember.js compatible responses

> It comes with a custom sails.js hook how parses que controller result in res.ok and format the response based in req.options
> and add res.emberjs() function to respond requests with ember.js format if you dont whant to use default res.ok()

## Installation

1 - Download it inside your sails.js project with:

```sh
npm install sails-emberjs-responses --save
```

2 - Create one hook with:

```js
// api/hooks/emberjs/index.js

module.exports = require('sails-emberjs-responses').hook;

```

3 - In your controllers use:

```js
// ... controller logic
res.ok(record);
```

## Configs:

Enable of disable module res.ok ( boolean )

```js
sails.config.emberjs.loadDefaultOkResponse
```

## ROADMAP:

- ADD suport to res.negotiate custom responses
- ADD suport to res.serverError custom responses
- ADD suport to others formats
- ADD more configs

## Credits
[Alberto Souza](https://github.com/albertosouza/) and contributors - MIT
