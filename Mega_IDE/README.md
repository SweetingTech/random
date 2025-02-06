# MegaIDE

An AI-Assisted Development Environment with LLM Integration, featuring real-time collaboration, plugin support, and intelligent code analysis.

## Features

- 🤖 AI-powered code analysis and suggestions
- 🔄 Real-time collaboration
- 🔌 Plugin system for extensibility
- 📝 Automatic documentation generation
- 🔍 Code review and optimization suggestions
- 📊 Code flow analysis
- 🗂️ Version control integration
- 💻 Both GUI and CLI interfaces

## Prerequisites

- Node.js >= 18.18.0
- npm >= 10.3.0

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd mega_ide
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your API keys:
   ```
   OPENAI_API_KEY=your_openai_key_here
   GOOGLE_API_KEY=your_google_key_here
   CLAUDE_API_KEY=your_claude_key_here
   COLLAB_PORT=4000
   RUN_GUI=1
   ```

## Usage

### Development Mode

Start the development server with hot reloading:
```bash
npm run dev
```

### Production Build

Build for production:
```bash
npm run build
```

Start the production server:
```bash
npm run serve
```

### CLI Mode

Run in CLI mode:
```bash
npm run cli
```

## Project Structure

- `megaIDE.js` - Main application file
- `server.js` - Express server for collaboration
- `plugins/` - Plugin directory
- `dist/` - Production build output

## Available Scripts

- `npm start` - Start webpack dev server
- `npm run dev` - Start development server with GUI
- `npm run cli` - Run in CLI mode
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run serve` - Start production server
- `npm test` - Run tests

## Plugin Development

Create plugins in the `plugins` directory. Each plugin should export:

```javascript
module.exports = {
  name: 'PluginName',
  version: '1.0.0',
  activate: () => {},
  deactivate: () => {},
  getCommands: () => ({})
};
```

See `plugins/codeAnalyzer.js` for an example implementation.

## Environment Variables

- `OPENAI_API_KEY` - OpenAI API key
- `GOOGLE_API_KEY` - Google API key
- `CLAUDE_API_KEY` - Claude API key
- `COLLAB_PORT` - Collaboration server port (default: 4000)
- `RUN_GUI` - Enable GUI mode (1 or 0)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC License
