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
const PnpWebpackPlugin = require(`pnp-webpack-plugin`);

async function yarn2Config(config, options) {
  const newConfig = {
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

  return newConfig;
}

module.exports = { managerWebpack: yarn2Config, webpack: yarn2Config };
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

After several tries (See https://github.com/crubier/yarnv2-storybook/blob/master/tries.md), @larixer 's solution did work. It is explained there https://github.com/yarnpkg/berry/issues/484#issuecomment-558092180 . Let's apply these fixes:

Upgrade to latest unreleased atm Yarn v2 with PR #600, aka packageExtensions support (this step is optional, but convenient, the same effect can be achieved by editing lockfile instead):

```sh
yarn set version from sources
```

Following https://github.com/yarnpkg/berry/issues/484#issuecomment-558168945, we add these lines to `.yarnrc.yml`:

```yaml
packageExtensions:
  "@storybook/core@*":
    peerDependencies:
      "@babel/core": "*"
  "@storybook/api@*":
    peerDependencies:
      "regenerator-runtime": "*"
  "corejs-upgrade-webpack-plugin@*":
    dependencies:
      core-js: ^2.6.10
      babel-runtime: ^6.26.0
```

To apply `packageExtensions`, install the package again:

```sh
yarn
```

To ensure that `node_modules` will not be transpiled via Babel, add this line to the `yarn2Config` function in `.storybook/yarn-preset.js`:

```javascript
const jsRule = newConfig.module.rules.find(rule => rule.test.test(".js"));
jsRule.exclude = /node_modules/;
```

To avoid an error (See https://github.com/yarnpkg/berry/issues/484#issuecomment-558139921), unplug `@storybook/core`:

```sh
yarn unplug @storybook/core
```

To prevent Storybook from failing to understand where to place babel cache. (See https://github.com/yarnpkg/berry/issues/484#issuecomment-558060185), create an empty `node_modules` folder:

```sh
mkdir node_modules
```

Finally it works 🎉! We can run:

```sh
yarn storybook
# Success
```
