const _ = require('lodash'),
  path = require('path')
  ;


const LOG_ROOT = path.resolve(path.join(__dirname, '../../'));


module.exports = function getCallsite(stack, idx) {
  if (!stack) {
    stack = (new Error()).stack.toString().split('\n');
  } else {
    stack = stack.toString().split('\n');
  }
  if (!stack.length) return;

  // Drop first line ('Error')
  if (stack[0] === 'Error') stack.splice(0, 1);
  const stackLocations = _.filter(_.map(stack, (stackLineStr) => {
    stackLineStr = stackLineStr.replace(/^\s+|\s+$/mgi, '');
    let groups = stackLineStr.match(/\((\S+):(\d+):(\d+)\)$/);
    if (!groups) groups = stackLineStr.match(/at (.+):(\d+):(\d+)$/);
    if (groups && groups.length === 4) {
      const absPath = groups[1];
      let relPath;
      if (absPath.substr(0, LOG_ROOT.length) === LOG_ROOT) {
        relPath = absPath.substr(LOG_ROOT.length);
      } else {
        relPath = absPath;
      }
      return {
        file: relPath,
        line: groups[2],
        column: groups[3],
      };
    }
  }));

  return stackLocations[idx || 2];
};
