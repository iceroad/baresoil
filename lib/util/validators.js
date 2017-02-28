var _ = require('lodash')
  , e164 = require('e164')
  , fmt = require('util').format
  , validator = require('validator')
  ;


module.exports = {
  email: function(v) {
    v = v || '';
    if (_.isString(v) && validator.isEmail(v)) {
      return true;
    }
    return fmt('"%s" is not a valid email address.', v);
  },
  cellphone: function (v) {
    v = v || '';
    if (!v.match(/^\+?[0-9]{8,15}$/)) {
      return 'Please enter a string of numbers without any '+
             'special characters or spaces, starting with a "+" ' +
             'and the country code.';
    }
    if (v[0] === '+') v = v.substr(1);  // drop leading '+'
    var location = e164.lookup(v);
    if (!location || !location.code || !location.country) {
      return 'Unrecognized phone number (did you include a country code?)';
    }
    return true;
  },
  security_code: function(v) {
    var x = _.toInteger(v);
    if (x >= 1000 && x <= 999999) {
      return true;
    }
    return fmt('"%s" is not a valid security code', v);
  },
  password: function(v) {
    if (!v || v.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    return true;
  },
  app_name: function(v) {
    if (!_.isString(v) || v.length > 120) {
      return 'Application name must be a string less than 120 characters.';
    }
    return true;
  },
  fqdn: function(v) {
    if (!validator.isFQDN(v)) {
      return fmt('"%s" is not a valid Baresoil Cloud subdomain.', v);
    }
    return true;
  },
  varchar: function(maxLen) {
    return function(v) {
      if (_.isString(v) && v.length <= maxLen) {
        return true;
      }
      return fmt('Require a string of up to %d characters.', maxLen);
    };
  },
};
