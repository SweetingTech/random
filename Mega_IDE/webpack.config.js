import path from 'path';
import { fileURLToPath } from 'url';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/client.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/dist/'
  },
  target: 'web',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    fallback: {
      "path": "path-browserify",
      "crypto": "crypto-browserify",
      "stream": "stream-browserify",
      "buffer": "buffer",
      "util": "util",
      "url": "url",
      "querystring": "querystring-es3",
      "zlib": "browserify-zlib",
      "http": "stream-http",
      "https": "https-browserify",
      "os": "os-browserify/browser",
      "assert": "assert",
      "fs": false,
      "net": false,
      "tls": false,
      "child_process": false
    }
  },
  devServer: {
    static: {
      directory: path.join(__dirname, '/'),
    },
    compress: true,
    port: 3000,
    hot: true,
    historyApiFallback: true,
    devMiddleware: {
      publicPath: '/dist/'
    }
  },
  plugins: [
    new MonacoWebpackPlugin({
      languages: ['javascript', 'typescript', 'html', 'css', 'json']
    })
  ]
};
