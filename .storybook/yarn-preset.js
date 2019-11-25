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
  const jsRule = newConfig.module.rules.find(rule => rule.test.test(".js"));
  jsRule.exclude = /node_modules/;

  return newConfig;
}

module.exports = { managerWebpack: yarn2Config, webpack: yarn2Config };
