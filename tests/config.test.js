/* eslint-disable no-undef */
let yargs

describe('yargs default tests', () => {
  test('should start with default values', () => {
    process.argv = ['/usr/local/bin/app']
    yargs = require('../lib/config')
    expect(yargs.$0).toStrictEqual('/usr/local/bin/app')
    expect(yargs.u).toStrictEqual('mqtt://127.0.0.1')
    expect(yargs.t).toStrictEqual('frenchtools')
    expect(yargs.v).toStrictEqual('info')
  })
})
