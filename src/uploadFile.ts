import * as core from '@actions/core'
import Client from 'ssh2-sftp-client'
import glob from 'glob'
import path from 'path'

export async function uploadFile(
  client: Client,
  local: string,
  remote: string,
  ignore: string[] = []
): Promise<boolean> {
  const exist = await client.exists(remote)
  const files = glob.sync(path.join(local, '**/*'), { ignore: ignore || [] })
  const dirs = files.map(f => path.parse(f.replace(local, remote)).dir)
  if (!exist) {
    await Promise.all(dirs.map(d => client.mkdir(d, true)))
  }
  return Promise.all(
    files.map(file => {
      core.info(`UPLOAD FILE START ----> ${file}`)
      return client
        .put(file, file.replace(local, remote))
        .then(() => {
          core.info(`UPLOAD FILE SUCCESS ----> ${file}`)
          return true
        })
        .catch(() => {
          core.info(`UPLOAD FILE ERROR ----> ${file}`)
          return false
        })
    })
  ).then(sta => {
    client.end()
    return sta.every(s => !!s)
  })
}
