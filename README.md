# Yarn v2 storybook problem

As discussed at https://github.com/yarnpkg/berry/issues/592

And also at https://github.com/yarnpkg/berry/issues/484

## Setup

Start with these versions

```sh
node --version
# v10.15.3

yarn --version
# 1.19.1

create-react-app --version
# 3.2.0
```

Create a react app

```sh
create-react-app yarnv2-storybook
cd yarnv2-storybook
```

Install yarn v2 in that folder as explained at https://next.yarnpkg.com/getting-started/install

```sh
yarn policies set-version v2
yarn --version
# 2.0.0-rc.12
```

We can now remove `node_modules` since it is not needed anymore

```sh
rm -rf node_modules
```

Then install with yarn and run the react app

```sh
yarn install
yarn start
# It works as expected, nice!
```

## Install storybook

Now install storybook using their slow start guide at https://storybook.js.org/docs/guides/guide-react/#manual-setup

### Step 1: Add dependencies

```sh
yarn add --dev @storybook/react
yarn add react react-dom
yarn add --dev babel-loader @babel/core
```

### Step 2: Add an npm script

Add the storybook to scripts in `package.json`:

```json
{
  "scripts": {
    "storybook": "start-storybook"
  }
}
```

### Step 3: Create the config file

For a basic Storybook configuration, the only thing you need to do is tell Storybook where to find stories.

To do that, create a file at `.storybook/config.js` with the following content:

```javascript
import { configure } from "@storybook/react";
configure(require.context("../src", true, /\.stories\.js$/), module);
```

### Step 4: Write your stories

Now create a `../src/index.stories.js` file, and write your first story like this:

```javascript
import React from "react";
import { Button } from "@storybook/react/demo";

export default { title: "Button" };

export const withText = () => <Button>Hello Button</Button>;

export const withEmoji = () => (
  <Button>
    <span role="img" aria-label="so cool">
      😀 😎 👍 💯
    </span>
  </Button>
);
```

### Finally: Run your Storybook

Now everything is ready. Run your storybook with:

```sh
yarn run storybook
# IT FAILS
```

## Apply fixes by creating a ad-hoc a storybook preset.

### Init a new storybook preset

By following the guide at https://storybook.js.org/docs/presets/writing-presets/#advanced-configuration

First, create a file at `.storybook/yarn-preset.js`:

```javascript
async function managerWebpack(config, options) {
  // update config here
  return config;
}
async function managerBabel(config, options) {
  // update config here
  return config;
}
async function webpack(config, options) {
  return config;
}
async function babel(config, options) {
  return config;
}
async function addons(entry = []) {
  return entry;
}
module.exports = { managerWebpack, managerBabel, webpack, babel, addons };
```

Then, load that preset in your `.storybook/presets.js` file:

```javascript
const path = require("path");
module.exports = [path.resolve("./.storybook/yarn-preset")];
```

### Add pnp webpack plugin to storybook via the preset

Add the plugin by following https://github.com/arcanis/pnp-webpack-plugin

Installation

```sh
yarn add --dev pnp-webpack-plugin
```

Then add it to the the preset at `.storybook/yarn-preset.js` in the webpack configs (for both manager and guest config)

```javascript
async function managerWebpack(config, options) {
  // update config here
  return {
    ...(config || {}),
    resolve: {
      ...((config || {}).resolve || {}),
      plugins: [
        ...(((config || {}).resolve || {}).plugins || []),
        PnpWebpackPlugin
      ]
    },
    resolveLoader: {
      ...((config || {}).resolveLoader || {}),
      plugins: [
        ...(((config || {}).resolveLoader || {}).plugins || []),
        PnpWebpackPlugin.moduleLoader(module)
      ]
    }
  };
}
async function webpack(config, options) {
  return {
    ...(config || {}),
    resolve: {
      ...((config || {}).resolve || {}),
      plugins: [
        ...(((config || {}).resolve || {}).plugins || []),
        PnpWebpackPlugin
      ]
    },
    resolveLoader: {
      ...((config || {}).resolveLoader || {}),
      plugins: [
        ...(((config || {}).resolveLoader || {}).plugins || []),
        PnpWebpackPlugin.moduleLoader(module)
      ]
    }
  };
}
```

Now things should work...

```sh
yarn storybook
# Fail
# Error: A package is trying to access a peer dependency that should be provided by its direct ancestor but isn't
# Required package: @babel/core (via "@babel/core")
# Required by: @babel/plugin-proposal-object-rest-spread (via /path/to/yarnv2-storybook/.yarn/virtual/@babel-plugin-proposal-object-rest-spread-virtual-a8a2f1702d/0/cache/@babel-plugin-proposal-object-rest-spread-npm-7.7.4-433eacd5f8-1.zip/node_modules/@babel/plugin-proposal-object-rest-spread/lib/index.js)
```

This does not sound logical at first, it loooks to me that `@storybook/react` is the parent of `@babel/plugin-proposal-object-rest-spread`. https://github.com/storybookjs/storybook/blob/ec8ef5c144e73ce8f762df03da0ac6c2375c223b/app/react/package.json

BUT! After checking it turns out that that `@storybook/core` is the parent of `@babel/plugin-proposal-object-rest-spread`, and this one does NOT list `@babel/core` as a peerDependency. https://github.com/storybookjs/storybook/blob/ec8ef5c144e73ce8f762df03da0ac6c2375c223b/lib/core/package.json

So let's fix this...

## Fix Storybook packages

### Try to fix by forking storybook and installing from git

Add the correct peerDependency to the storybook package: https://github.com/crubier/storybook/commit/267644152e374c56b96c5e42a5e64f3561383bb7

In `package.json`, reference this modified version of storybook:

```json
{
  "devDependencies": {
    "@storybook/react": "https://github.com/crubier/storybook.git#commit:267644152e374c56b96c5e42a5e64f3561383bb7"
  }
}
```

Then install

```sh
yarn install
# YN0000: Failed with errors in 4.36m
#
# ➤ YN0058: │ @storybook/react@https://github.com/crubier/storybook.git#commit:267644152e374c56b96c5e42a5e64f3561383bb7: Installing the package dependencies failed (exit code 1, logs can be found here: /var/folders/2g/totototo/T/logfile-tatata.log)
#
# My Gyp normally works well, but seems to be causing the problem here?
```

This failed for obscure reasons... I opened a PR on storybook to take these changes into account anyway, and hopefully integrate them to the next release. https://github.com/storybookjs/storybook/pull/8933

### Try to fix by modifying yarn cache locally

So, let's try something faster for now... Fixing by modifying the content of the `.yarn/cache/@storybook-react-npm-5.2.6-5715394a3f-1.zip/node_modules/package.json` file and add the correct peerDependency like in the PR above.

At first we get a yn0018 error, but we get the right command by following https://next.yarnpkg.com/advanced/error-codes#yn0018---cache_checksum_mismatch

```sh
YARN_CHECKSUM_BEHAVIOR=update yarn install
yarn storybook
# Fail
# Error: A package is trying to access a peer dependency that should be provided by its direct ancestor but isn't
# Required package: @babel/core (via "@babel/core")
# Required by: @babel/plugin-proposal-object-rest-spread (via /path/to/yarnv2-storybook/.yarn/virtual/@babel-plugin-proposal-object-rest-spread-virtual-a8a2f1702d/0/cache/@babel-plugin-proposal-object-rest-spread-npm-7.7.4-433eacd5f8-1.zip/node_modules/@babel/plugin-proposal-object-rest-spread/lib/index.js)
```

No change, we get the exact same error as before, weird, am I missing something?
