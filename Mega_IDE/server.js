const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git');
const archiver = require('archiver');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the dist directory
app.use(express.static('dist'));

// Handle Git operations
async function handleGitOperation(operation, socket) {
  try {
    const result = await operation();
    return { success: true, ...result };
  } catch (error) {
    socket.emit('error', { message: error.message });
    return { success: false, error: error.message };
  }
}

// Create a ZIP file from a directory
function createZipFile(dirPath) {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks = [];

    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('end', () => {
      const data = Buffer.concat(chunks);
      resolve({
        fileName: path.basename(dirPath) + '.zip',
        data: data.toString('base64')
      });
    });
    archive.on('error', reject);

    archive.directory(dirPath, false);
    archive.finalize();
  });
}

io.on('connection', (socket) => {
  console.log('Client connected');

  // Git operations
  socket.on('gitInit', async ({ path }) => {
    const git = simpleGit(path);
    const result = await handleGitOperation(async () => {
      await git.init();
      return { message: 'Git repository initialized' };
    }, socket);
    socket.emit('gitOperationResult', result);
  });

  socket.on('gitClone', async ({ url, path }) => {
    const git = simpleGit();
    const result = await handleGitOperation(async () => {
      await git.clone(url, path);
      return { message: 'Repository cloned successfully' };
    }, socket);
    socket.emit('gitOperationResult', result);
  });

  socket.on('gitStatus', async ({ path }) => {
    const git = simpleGit(path);
    const result = await handleGitOperation(async () => {
      const status = await git.status();
      return {
        staged: status.staged,
        not_staged: status.modified,
        untracked: status.not_added,
        ahead: status.ahead,
        behind: status.behind
      };
    }, socket);
    if (result.success) {
      socket.emit('gitStatus', result);
    }
  });

  socket.on('gitStage', async ({ path, file }) => {
    const git = simpleGit(path);
    const result = await handleGitOperation(async () => {
      await git.add(file);
      return { message: 'File staged' };
    }, socket);
    socket.emit('gitOperationResult', result);
  });

  socket.on('gitStageFiles', async ({ path, files }) => {
    const git = simpleGit(path);
    const result = await handleGitOperation(async () => {
      await git.add(files);
      return { message: 'Files staged' };
    }, socket);
    socket.emit('gitOperationResult', result);
  });

  socket.on('gitCommit', async ({ path, message }) => {
    const git = simpleGit(path);
    const result = await handleGitOperation(async () => {
      const commit = await git.commit(message);
      return {
        hash: commit.commit,
        message: 'Changes committed successfully'
      };
    }, socket);
    socket.emit('gitCommitResult', result);
  });

  socket.on('gitPush', async ({ path }) => {
    const git = simpleGit(path);
    const result = await handleGitOperation(async () => {
      await git.push();
      return { message: 'Changes pushed to remote' };
    }, socket);
    socket.emit('gitOperationResult', result);
  });

  socket.on('gitPull', async ({ path }) => {
    const git = simpleGit(path);
    const result = await handleGitOperation(async () => {
      await git.pull();
      return { message: 'Changes pulled from remote' };
    }, socket);
    socket.emit('gitOperationResult', result);
  });

  socket.on('gitGetCurrentBranch', async ({ path }) => {
    const git = simpleGit(path);
    const result = await handleGitOperation(async () => {
      const branch = await git.branch();
      return branch.current;
    }, socket);
    if (result.success) {
      socket.emit('gitCurrentBranch', result);
    }
  });

  socket.on('gitGetBranches', async ({ path }) => {
    const git = simpleGit(path);
    const result = await handleGitOperation(async () => {
      const branches = await git.branch();
      return branches.all;
    }, socket);
    if (result.success) {
      socket.emit('gitBranches', result);
    }
  });

  socket.on('gitCheckoutBranch', async ({ path, branch }) => {
    const git = simpleGit(path);
    const result = await handleGitOperation(async () => {
      await git.checkout(branch);
      return { message: `Switched to branch '${branch}'` };
    }, socket);
    socket.emit('gitOperationResult', result);
  });

  // ZIP operations
  socket.on('createZip', async ({ path }) => {
    try {
      const zipData = await createZipFile(path);
      socket.emit('zipCreated', zipData);
    } catch (error) {
      socket.emit('zipError', error.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Serve index.html for all routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
