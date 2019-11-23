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
