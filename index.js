const fs = require('fs').promises;
const nodeExec = require('util').promisify(require('child_process').exec);

const core = require('@actions/core');
const exec = require('@actions/exec');
const io = require('@actions/io');

const reVariables = /^(?<name>SSH_AUTH_SOCK|SSH_AGENT_PID)=(?<value>[^;]+);/;

const run = async () => {
  let exitCode;

  const key = core.getInput('ssh-private-key', { required: true });
  const encoding = core.getInput('encoding');

  exitCode = await io.mkdirP('~/.ssh');
  if (exitCode) {
    core.setFailed('Unable to create ~/.ssh directory');
    return;
  }

  // working around a GitHub toolkit bug
  // https://github.com/actions/toolkit/issues/649
  try {
    const { stdout } = await nodeExec('ssh-keyscan -t rsa github.com');

    await fs.writeFile('~/.ssh/known_hosts', stdout, { flags: 'a' });
  }
  catch (e) {
    core.setFailed('ssh-keyscan failed');
    return;
  }

  let stdout = '';
  exitCode = await exec.exec('ssh-agent', [], {
    listeners: {
      stdout: data => {
        stdout += data.toString();
      }
    }
  });
  if (exitCode) {
    core.setFailed('ssh-agent failed to start');
    return;
  }

  stdout.trim().split('\n').forEach(line => {
    const match = line.match(reVariables);

    if (match) {
      core.exportVariable(match.groups.name, match.groups.value);
      core.info(`exported environment variable: ${match.groups.name}=${match.groups.value}`);
    }
  });

  exitCode = await exec.exec('ssh-add', ['-'], {
    input: Buffer.from(encoding ? Buffer.from(key, encoding).toString('ascii') : key),
  });
  if (exitCode) {
    core.setFailed('ssh-add failed');
  }
};

const cleanup = async () => {
  const exitCode = await exec.exec('ssh-agent', ['-k']);
  if (exitCode) {
    core.setFailed('ssh-agent was not stopped');
  }
};

if (core.getState('isPost') === 'true') {
  cleanup();
}
else {
  core.saveState('isPost', 'true');
  run();
}
