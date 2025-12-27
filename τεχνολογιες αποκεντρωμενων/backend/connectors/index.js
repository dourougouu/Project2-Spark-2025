const edxConnector = require('./edxConnector');
const courseraConnector = require('./courseraConnector');

module.exports = {
  edx: edxConnector,
  coursera: courseraConnector
};

