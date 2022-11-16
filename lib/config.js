const yargs = require('yargs')

const config = yargs
  .usage('Usage: $0 [options]')
  .describe('a', 'ville')
  .describe('u', 'mqtt broker url')
  .describe('t', 'mqtt topic prefix')
  .describe('v', 'log verbosity')
  .describe('s', 'allow ssl connections with invalid certs')
  .alias({
    a: 'ville',
    u: 'mqttUrl',
    t: 'mqttTopic',
    v: 'logVerbosity',
    s: 'sslVerify',
    h: 'help'
  })
  .array('ville')
  .boolean('ssl-verify')
  .choices('v', ['error', 'warn', 'info', 'debug'])
  .default({
    u: 'mqtt://127.0.0.1',
    t: 'frenchtools',
    v: 'info'
  })
  .help('help')
  .version()
  .strictOptions(true)
  .parserConfiguration({
    'camel-case-expansion': false,
    'strip-dashed': true,
    'dot-notation': false
  })
  .argv

module.exports = config
