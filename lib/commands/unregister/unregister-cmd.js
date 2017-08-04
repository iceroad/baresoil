function unregister() {
  delete global.CLI_DATA.projects[process.cwd()];
  return process.exit(0);
}

module.exports = unregister;
