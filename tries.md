## For info, previous tries that where triied to fix this.

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

### Try to fix by using @larixer method

As described here https://github.com/yarnpkg/berry/issues/484#issuecomment-558092180

Upgrade to latest unreleased atm Yarn v2 with PR #600, aka packageExtensions support (this step is optional, but convenient, the same effect can be achieved by editing lockfile instead)

```sh
yarn set version from sources
```

Add these lines to `.yarnrc.yml`:

```yaml
packageExtensions:
  "@storybook/core@*":
    peerDependencies:
      "@babel/core": "*"
  "corejs-upgrade-webpack-plugin@*":
    dependencies:
      babel-runtime: ^6.26.0
```

To apply `packageExtensions`, run:

```sh
yarn
```

Then create empty `node_modules` folder, otherwise Storybook fails to understand where to place babel cache.

```sh
mkdir node_modules
```

Then

```sh
yarn storybook
# Error: EROFS: read-only filesystem, mkdir '/node_modules/@storybook/core/dist/public'
# ERR!     at makeError (/Users/vincent/yarnv2-storybook/.pnp.js:25485:24)
```

Get a strange error about read only filesystem...

But you can easily work around it by doing

```sh
yarn unplug @storybook/core
```

Then

```sh
yarn storybook
# ModuleNotFoundError: Module not found: Error: A package is trying to access another package without the second one being listed as a dependency of the first one
# Required package: core-js (via "core-js/library/fn/object/assign")
# Required by: corejs-upgrade-webpack-plugin@npm:2.2.0 (via /Users/vincent/yarnv2-storybook/.yarn/cache/corejs-upgrade-webpack-plugin-npm-2.2.0-93680a64ba-1.zip/node_modules/corejs-upgrade-webpack-plugin/dist/index.js)
```

Following this message from larixer, https://github.com/yarnpkg/berry/issues/484#issuecomment-558168945, we add these lines to `.yarnrc.yml`:

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

Then

```sh
yarn
```

And

```sh
yarn
# Success
```

Works 🎉
