var temp = require('temp').track()
  , BaresoilDevenv = require('baresoil-devenv')
  ;


function dev(args) {
  if (!args.data) {
    args.data = temp.mkdirSync();
  }
  return BaresoilDevenv(args);
}


module.exports = dev;
