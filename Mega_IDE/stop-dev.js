import { spawn } from 'child_process';

console.log('\x1b[36mStopping development processes...\x1b[0m');

const killProcesses = async () => {
  if (process.platform === 'win32') {
    await Promise.all([
      new Promise(resolve => {
        const kill1 = spawn('taskkill', ['/F', '/IM', 'node.exe'], { stdio: 'ignore' });
        kill1.on('exit', resolve);
      }),
      new Promise(resolve => {
        const kill2 = spawn('taskkill', ['/F', '/IM', 'electron.exe'], { stdio: 'ignore' });
        kill2.on('exit', resolve);
      })
    ]);
  } else {
    await Promise.all([
      new Promise(resolve => {
        const kill1 = spawn('pkill', ['-f', 'node'], { stdio: 'ignore' });
        kill1.on('exit', resolve);
      }),
      new Promise(resolve => {
        const kill2 = spawn('pkill', ['-f', 'electron'], { stdio: 'ignore' });
        kill2.on('exit', resolve);
      })
    ]);
  }
};

killProcesses().then(() => {
  console.log('\x1b[32mAll development processes stopped.\x1b[0m');
  process.exit(0);
}).catch(error => {
  console.error('\x1b[31mError stopping processes:', error, '\x1b[0m');
  process.exit(1);
});
