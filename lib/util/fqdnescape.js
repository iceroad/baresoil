
module.exports = function(inStr) {
  var outStr = (inStr || '')
                .replace(/\s/gm, '')
                .replace(/:.*/, '')
                .toLowerCase()
                .trim()
                .substr(0, 64);
  return outStr;
};
