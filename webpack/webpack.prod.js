const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = merge(common, {
    mode: 'production',

    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                parallel: true,
                terserOptions: {
                    compress: {
                        drop_console: false, // Keep console logs for debugging
                        dead_code: true,
                        unused: true,
                        passes: 2, // Optimize the code more aggressively
                    },
                },
            }),
        ],
    },
});