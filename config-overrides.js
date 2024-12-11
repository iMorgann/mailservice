const webpack = require("webpack");

module.exports = function override(config) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    process: require.resolve("process/browser"),
    stream: require.resolve("stream-browserify"),
    os: require.resolve("os-browserify/browser"),
    util: require.resolve("util"),
    zlib: require.resolve("browserify-zlib"),
    buffer: require.resolve("buffer"),
    net: false, // Browser does not support 'net'
    tls: false, // Browser does not support 'tls'
  };

  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ];

  return config;
};
