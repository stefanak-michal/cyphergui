const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/index.tsx',

    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'bundle-[contenthash].js',
        clean: true,
        publicPath: '',
    },

    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: 'ts-loader', // Use ts-loader for these files
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: 'babel-loader',
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: ['style-loader', 'css-loader', 'sass-loader'],
            },
        ],
    },

    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx'],
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html',
            filename: 'index.html',
            inject: 'body',
            scriptLoading: 'defer',
        }),
        new CopyWebpackPlugin({
            patterns: [{ from: 'public/*.{ico,svg,json,txt}', to: '[name][ext]' }],
        }),
    ],

    devServer: {
        static: {
            directory: path.join(__dirname, 'build'),
        },
        compress: true,
        port: 1234,
    },
};
