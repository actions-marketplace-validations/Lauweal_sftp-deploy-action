import * as core from '@actions/core'
import Client from 'ssh2-sftp-client'
import glob from 'glob'
import path from 'path'

async function uploadDir(
  client: Client,
  local: string,
  remote: string,
  ignore: string[] = []
): Promise<boolean> {
  const exist = await client.exists(remote)
  if (!exist) {
    await client.rmdir(remote)
  } else {
    await client.delete(remote)
    await client.rmdir(remote)
  }
  const files = glob.sync(path.join(local, '**/*'), {ignore: ignore || []})
  return Promise.all(
    files.map(file => {
      core.info(`UPLOAD FILE START ----> ${file}`)
      return client
        .fastPut(file, file.replace(local, remote))
        .then(() => {
          core.info(`UPLOAD FILE SUCCESS ----> ${file}`)
          client.end()
          return true
        })
        .catch(() => {
          core.info(`UPLOAD FILE ERROR ----> ${file}`)
          client.end()
          return false
        })
    })
  ).then(sta => sta.every(s => !!s))
}

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
  const prot = core.getInput('port')
  const username = core.getInput('username')
  const password = core.getInput('password')
  return host.reduce((a: Client.ConnectOptions[], b) => {
    return a.concat({
      host: b,
      port: Number(prot),
      username,
      password
    })
  }, [])
}

async function run() {
  const ignore = JSON.parse(core.getInput('ignore') || '[]')
  const local = path.join(process.cwd(), core.getInput('local'))
  const remote = core.getInput('remote')

  const options = parseClientOptions()
  const clients: Client[] = (await Promise.all(
    options.map(opt => setupClient(opt))
  ).then(cl => cl.filter(c => !!c))) as any
  const status = await Promise.all(
    clients.map(cli => uploadDir(cli, local, remote, ignore))
  )

  if (!status.every(s => !!s)) {
    core.error('Upload Error')
    core.setOutput('message', 'Upload Error')
    core.setFailed('Upload Error')
  }
  core.setOutput('message', 'Upload Success')
}

run()
