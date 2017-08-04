module.exports = function fqdnescape(inStr) {
  return (inStr || '')
    .replace(/\s/gm, '')
    .replace(/:.*/, '')
    .toLowerCase()
    .trim()
    .substr(0, 64);
};
