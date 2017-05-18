const col = require('colors');

module.exports = {
  name: 'init',
  desc: 'Initializes a directory with a starter Baresoil project.',
  helpPriority: 1,
  helpGroup: 'Baresoil Development',
  argspec: [
    {
      flags: ['template', 't'],
      desc: `Template to use for initializing project:

  * ${col.yellow('minimal').bold} Bare minimum Baresoil project.
  * ${col.yellow('martinet').bold} Webpack-powered build engine.
  * ${col.yellow('static').bold} Simple static website.
  * ${col.yellow('chat').bold} Basic chat demo.
`,
      defVal: 'minimal',
    },
    {
      flags: ['dir'],
      desc: 'Directory to initialize, defaults to working directory.',
      defVal: process.cwd(),
    },
    {
      flags: ['force'],
      desc: 'Overwrite existing files in the directory.',
      defVal: false,
    },
  ],
  impl: require('./init-cmd.js'),
};
