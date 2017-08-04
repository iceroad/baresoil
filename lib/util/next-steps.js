const _ = require('lodash'),
  col = require('./colutil')
;

const NextSteps = {
  runDevEnv() {
    return [
      col.dim('Develop Locally'),
      `Start the Development Environment with ${col.primary('baresoil dev')}.`,
    ];
  },

  documentation() {
    return [
      col.dim('Documentation'),
      'https://www.baresoil.org/',
    ];
  },

  deployApp() {
    return [col.dim('Deploy to Server'), `\
Register a hostname on a server for this project with ${col.primary('baresoil register')}.
Deploy the current project to the server with ${col.primary('baresoil deploy')}.`];
  },
};

if (require.main === module) {
  _.forEach(NextSteps, (stepFn, stepName) => console.log(`${stepName}: ${stepFn()}`));
} else {
  module.exports = NextSteps;
}
