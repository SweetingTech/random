# Frontend Architecture

This document details the frontend architecture of Mega IDE, including component structure, file organization, and key features.

## Directory Structure

```
src/
├── components/         # React components
│   ├── AddonsPage     # Addon management
│   ├── AIAgentPage    # AI integration interface
│   ├── CloneRepositoryDialog  # Git clone UI
│   ├── ContextMenu    # Right-click menu
│   ├── ErrorBoundary  # Error handling
│   ├── FileNameInput  # File creation/rename
│   ├── FileTree       # File explorer
│   ├── GitPanel       # Git operations UI
│   ├── LoadingSpinner # Loading states
│   ├── NavBar         # Navigation
│   ├── SettingsPage   # Configuration UI
│   ├── Toast          # Notifications
│   └── Toolbar        # Main toolbar
├── hooks/             # Custom React hooks
│   ├── useDebounce    # Input debouncing
│   ├── useEditor      # Monaco editor state
│   ├── useGit         # Git operations
│   ├── useSocketHandlers  # Socket.IO events
│   └── useZip         # ZIP file handling
├── lib/               # Utility libraries
│   └── socket.ts      # Socket.IO client setup
├── types/             # TypeScript definitions
│   └── FileSystemNode.ts  # File system types
├── App.tsx           # Main application component
├── client.tsx        # Entry point
├── index.css         # Global styles
├── main.tsx          # Application bootstrap
├── styles.css        # Component styles
└── vite-env.d.ts     # Vite type declarations
```

## Key Components

### 1. Core Components

#### App.tsx
- Main application container
- Routing setup
- Global state management
- Theme provider

#### FileTree.tsx
- Hierarchical file explorer
- File/folder creation
- Context menu integration
- Drag and drop support

#### GitPanel.tsx
- Repository status
- Commit interface
- Branch management
- Push/pull operations

### 2. Editor Integration

#### Monaco Editor Setup
- Syntax highlighting
- IntelliSense
- Multiple language support
- Theme configuration

### 3. Custom Hooks

#### useEditor.ts
```typescript
// Editor state management
const useEditor = () => {
  // Monaco editor configuration
  // File content handling
  // Cursor position tracking
  // Selection management
};
```

#### useGit.ts
```typescript
// Git operations wrapper
const useGit = () => {
  // Repository operations
  // Status tracking
  // Branch management
};
```

#### useSocketHandlers.ts
```typescript
// Socket.IO event handlers
const useSocketHandlers = () => {
  // Real-time updates
  // Collaboration events
  // File change synchronization
};
```

## State Management

### 1. Component State
- Local state for UI components
- Form handling
- User interactions

### 2. Socket State
- Real-time updates
- Collaboration data
- File changes

### 3. Editor State
- File content
- Cursor position
- Selections
- Undo/redo history

## Styling

### 1. Tailwind CSS
- Utility-first CSS framework
- Responsive design
- Dark/light theme support
- Custom components

### 2. Component Styles
- Modular CSS
- Theme variables
- Custom animations

## Event Handling

### 1. User Interactions
- File operations
- Git commands
- Settings changes
- Editor interactions

### 2. Socket Events
- File updates
- Collaboration changes
- Real-time synchronization

### 3. IPC Events
- File system operations
- Native features
- System integration

## Error Handling

### 1. Error Boundaries
- Component error catching
- Fallback UI
- Error reporting

### 2. Form Validation
- Input validation
- Error messages
- User feedback

## Performance Optimizations

### 1. Code Splitting
- Lazy loading
- Dynamic imports
- Route-based splitting

### 2. Memoization
- React.memo
- useMemo
- useCallback

### 3. Virtual Scrolling
- Large file handling
- Efficient rendering
- Memory management

## Build Configuration

### 1. Vite Setup
- Development server
- Hot module replacement
- Build optimization

### 2. TypeScript Configuration
- Strict type checking
- Path aliases
- Type definitions

## Testing Considerations

### 1. Component Testing
- Unit tests
- Integration tests
- Snapshot testing

### 2. Hook Testing
- Custom hook tests
- Mock implementations
- Test utilities
