module.exports = {
  // Project commands
  init: require('./init'),
  status: require('./status'),
  dev: require('./dev'),

  // Server account commands
  signup: require('./signup'),
  login: require('./login'),
  whoami: require('./whoami'),
  logout: require('./logout'),

  // App management commands
  register: require('./register'),
  deploy: require('./deploy'),
  unregister: require('./unregister'),
};
