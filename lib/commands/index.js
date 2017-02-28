
module.exports = {
  // Baresoil Development Environment
  init: require('./init'),
  dev: require('./dev'),

  // Baresoil Cloud account
  signup: require('./signup'),
  verify: require('./verify'),
  deploy: require('./deploy'),
  login: require('./login'),
  logout: require('./logout'),
  whoami: require('./whoami'),

  // Baresoil app
  register: require('./register'),
};
