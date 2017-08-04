class SandboxConsoleDumper {
  init(deps, cb) {
    deps.SandboxManager.on('sandbox_stderr', (clientId, stderrData) => {
      console.error('STDERR', stderrData);
    });
    deps.SandboxManager.on('sandbox_stdout', (clientId, stdoutData) => {
      console.error('STDOUT', stdoutData);
    });
    return cb();
  }

  destroy(deps, cb) {
    return cb();
  }
}

SandboxConsoleDumper.prototype.$spec = {
  deps: ['SandboxManager'],
};

module.exports = SandboxConsoleDumper;
