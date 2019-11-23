const PnpWebpackPlugin = require(`pnp-webpack-plugin`);

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
async function managerBabel(config, options) {
  // update config here
  return config;
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
async function babel(config, options) {
  return config;
}
async function addons(entry = []) {
  return entry;
}
module.exports = { managerWebpack, managerBabel, webpack, babel, addons };
