const _ = require('lodash'),
  e164 = require('e164'),
  domains = require('./domains'),
  fmt = require('util').format,
  validator = require('validator')
  ;


module.exports = {
  email(v) {
    v = v || '';
    if (_.isString(v) && validator.isEmail(v)) {
      return true;
    }
    return fmt('"%s" is not a valid email address.', v);
  },
  cellphone(v) {
    v = v || '';
    if (!v.match(/^\+?[0-9]{8,15}$/)) {
      return 'Please enter a string of numbers without any ' +
             'special characters or spaces, starting with a "+" ' +
             'and the country code.';
    }
    if (v[0] === '+') v = v.substr(1);  // drop leading '+'
    const location = e164.lookup(v);
    if (!location || !location.code || !location.country) {
      return 'Unrecognized phone number (did you include a country code?)';
    }
    return true;
  },
  security_code(v) {
    const x = _.toInteger(v);
    if (x >= 1000 && x <= 999999) {
      return true;
    }
    return fmt('"%s" is not a valid security code', v);
  },
  password(v) {
    if (!v || v.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    return true;
  },
  app_name(v) {
    if (!_.isString(v) || v.length > 120) {
      return 'Application name must be a string less than 120 characters.';
    }
    return true;
  },
  varchar(maxLen) {
    return (v) => {
      if (_.isString(v) && v.length <= maxLen) {
        return true;
      }
      return fmt('Require a string of up to %d characters.', maxLen);
    };
  },
  boolean(v) {
    if (!_.isBoolean(v)) {
      return 'Require a boolean value.';
    }
    return true;
  },
  baresoil_subdomain(v) {
    const generic = [
      'Please specify a subdomain of one of the following top-level domains:',
      _.map(domains, (domain) => {
        return `  * ${domain.yellow}`;
      }).join('\n'),
      [
        'Example:',
        'my-app.baresoil.cloud'.bold,
        'or',
        'my-app.proj.live'.bold,
      ].join(' '),
    ].join('\n');

    if (!validator.isFQDN(v)) {
      return fmt(`"%s" is not a valid Fully-Qualified Domain Name (FQDN).\n${generic}`, v);
    }
    const domain = v;
    const matchingTld = _.find(_.concat(domains, ['baresoil.io']), (tld) => {
      const suffix = domain.substr(domain.length - tld.length);
      return suffix === tld;
    });
    if (!matchingTld) {
      return fmt(
          `Unsupported Baresoil Cloud domain: %s\n${generic}`, domain.bold);
    }
    const prefix = domain.substr(0, domain.length - matchingTld.length - 1);
    if (!prefix.match(/^[0-9A-Z-]{4,30}$/i)) {
      return fmt(
          'Unsupported subdomain "%s", subdomains must be alphanumeric (and "-") ' +
          'strings of between 4 and 30 characters.', prefix);
    }

    return true;
  },
};
