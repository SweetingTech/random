# Backend Architecture

This document details the backend architecture of Mega IDE, including server setup, API endpoints, and service integrations.

## Server Components

### 1. Express Server (server.js)

```javascript
// Main server architecture
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
```

#### Core Features
- Static file serving
- HTTP request handling
- Socket.IO integration
- Git operations management
- File system operations
- ZIP file creation

#### Middleware Configuration
- Static file middleware
- Error handling middleware
- Request parsing
- CORS configuration

### 2. Socket.IO Integration

#### Event Handlers
```javascript
io.on('connection', (socket) => {
  // File operations
  // Git operations
  // Collaboration features
  // Real-time updates
});
```

#### Supported Events

##### Git Operations
- `gitInit`: Initialize repository
- `gitClone`: Clone repository
- `gitStatus`: Get repository status
- `gitStage`: Stage files
- `gitStageFiles`: Stage multiple files
- `gitCommit`: Create commit
- `gitPush`: Push to remote
- `gitPull`: Pull from remote
- `gitGetCurrentBranch`: Get current branch
- `gitGetBranches`: List branches
- `gitCheckoutBranch`: Switch branches

##### File Operations
- File reading/writing
- Directory management
- ZIP file creation
- File system events

##### Collaboration Events
- Real-time editing
- Cursor synchronization
- User presence

### 3. Git Integration (via simple-git)

#### Repository Operations
```javascript
const simpleGit = require('simple-git');

// Git operation wrapper
async function handleGitOperation(operation, socket) {
  try {
    const result = await operation();
    return { success: true, ...result };
  } catch (error) {
    socket.emit('error', { message: error.message });
    return { success: false, error: error.message };
  }
}
```

#### Supported Operations
- Repository initialization
- Remote operations
- Branch management
- Commit handling
- Status tracking

### 4. File System Operations

#### ZIP File Creation
```javascript
function createZipFile(dirPath) {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    // ZIP file creation logic
  });
}
```

#### File Management
- Directory creation
- File reading/writing
- Path resolution
- Error handling

### 5. AI Integration

#### Service Connections
- OpenAI API integration
- Google AI API integration
- Claude API integration

#### Features
- Code analysis
- Suggestions
- Documentation generation
- Error detection

## Error Handling

### 1. Operation Errors
```javascript
try {
  // Operation logic
} catch (error) {
  socket.emit('error', { message: error.message });
  return { success: false, error: error.message };
}
```

### 2. Socket Error Handling
- Connection errors
- Event errors
- Timeout handling

### 3. File System Errors
- Access errors
- Path errors
- Permission errors

## Security

### 1. API Security
- Environment variable management
- API key validation
- Request validation

### 2. File System Security
- Path sanitization
- Permission checks
- Access control

### 3. Socket Security
- Connection validation
- Event validation
- Rate limiting

## Performance Considerations

### 1. File Operations
- Streaming large files
- Chunked transfers
- Memory management

### 2. Git Operations
- Asynchronous processing
- Operation queuing
- Status caching

### 3. Socket Events
- Event throttling
- Connection pooling
- Message batching

## Configuration

### 1. Environment Variables
```env
PORT=3000
COLLAB_PORT=4000
OPENAI_API_KEY=your_openai_key_here
GOOGLE_API_KEY=your_google_key_here
CLAUDE_API_KEY=your_claude_key_here
RUN_GUI=1
```

### 2. Server Configuration
- Port settings
- CORS configuration
- Socket.IO options
- Static file serving

## Development Tools

### 1. Debugging
- Error logging
- Operation tracking
- Performance monitoring

### 2. Testing
- Unit tests
- Integration tests
- Socket event testing

## Deployment

### 1. Production Setup
- Environment configuration
- Process management
- Error logging
- Performance monitoring

### 2. Development Setup
- Hot reloading
- Debug logging
- Test environment
