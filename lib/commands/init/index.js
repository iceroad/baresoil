const col = require('colors'),
  path = require('path')
;

module.exports = {
  name: 'init',
  desc: 'Initialize working directory with a new project template.',
  helpPriority: 1,
  helpGroup: 'Project',
  argSpec: [
    {
      flags: ['template', 't'],
      desc: `Template to use for initializing project:

  * ${col.bold('bare')}: Minimal Baresoil project.
  * ${col.bold('martinet')}: Webpack-powered static site generator.
`,
      defVal: 'bare',
    },
    {
      flags: ['dir'],
      desc: 'Directory to initialize, defaults to working directory.',
      defVal: '.',
    },
    {
      flags: ['force'],
      desc: 'Overwrite existing files in the directory.',
      defVal: false,
    },
  ],
  impl: path.join(__dirname, 'init-cmd'),
};
