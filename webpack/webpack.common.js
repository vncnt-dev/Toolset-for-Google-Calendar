const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const srcDir = path.join(__dirname, "..", "src");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin') // extract css to files
const tailwindcss = require('tailwindcss')
const autoprefixer = require('autoprefixer') // help tailwindcss to work

module.exports = {
    mode: "production",
    entry: {
        background: path.join(srcDir, "background.ts"),
        content_script: path.join(srcDir, 'contentScripts/content_script.ts'),
        options: path.join(srcDir, 'options/options.tsx'),
    },
    output: {
        path: path.join(__dirname, "../dist/js/",),
        filename: "[name].js",
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                exclude: /node_modules/,
            }, // Styles: Inject CSS into the head with source maps
            {
                test: /\.(css)$/, //|scss|sass
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    //'sass-loader',
                    {
                        loader: 'postcss-loader', // postcss loader needed for tailwindcss
                        options: {
                            postcssOptions: {
                                ident: 'postcss',
                                plugins: [tailwindcss, autoprefixer],
                            },
                        },
                    },
                ],
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new CopyPlugin({
            patterns: [{ from: ".", to: "../", context: "public" }]
        }),
        new MiniCssExtractPlugin({
            filename: '../styles/[name].css',
        }),
    ],
};