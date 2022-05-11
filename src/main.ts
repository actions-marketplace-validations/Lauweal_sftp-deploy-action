import * as core from '@actions/core'
import Client from 'ssh2-sftp-client'
import path from 'path'
import { uploadFile } from './uploadFile'

async function setupClient(options: Client.ConnectOptions) {
  const client = new Client()
  return client
    .connect(options)
    .catch(() => null)
    .then(() => client)
    .catch(() => {
      core.info(`CONNECT ERROR ----> ${options.host}`)
      return null
    })
}

function parseClientOptions() {
  const host = core.getInput('host').split(',')
  const port = core.getInput('port')
  const username = core.getInput('username')
  const password = core.getInput('password')
  return host.reduce((a: Client.ConnectOptions[], b) => {
    return a.concat({
      host: b,
      port: Number(port),
      username,
      password
    })
  }, [])
}

async function run() {
  const local = path.join(process.cwd(), core.getInput('local'))
  const remote = core.getInput('remote')
  const ignore = JSON.parse(core.getInput('ignore'))
  const options = parseClientOptions()
  const clients: Client[] = (await Promise.all(
    options.map(opt => setupClient(opt))
  ).then(cl => cl.filter(c => !!c))) as any
  const status = await Promise.all(
    clients.map(cli => uploadFile(cli, local, remote, ignore))
  )

  if (!status.every(s => !!s)) {
    core.error('Upload Error')
    core.setOutput('message', 'Upload Error')
    core.setFailed('Upload Error')
  }
  core.setOutput('message', 'Upload Success')
}

run()
