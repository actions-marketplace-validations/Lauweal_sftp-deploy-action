import * as process from 'process'
import Client from 'ssh2-sftp-client'
import path from 'path'
import {expect, test} from '@jest/globals'
import {uploadFile} from '../src/uploadFile'
const {
  host,
  port,
  username,
  password,
  local,
  remote,
  ignore = []
} = require('minimist')(process.argv.slice(2))

test('test runs', () => {
  const client = new Client()
  client
    .connect({
      host,
      port: Number(port),
      username,
      password
    })
    .then(() => {
      return uploadFile(client, path.join(process.cwd(), local), remote)
    })
    .then(res => {
      expect(res).toEqual(true)
    })
})
