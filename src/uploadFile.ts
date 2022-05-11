import * as core from '@actions/core'
import Client from 'ssh2-sftp-client'

export async function uploadFile(
  client: Client,
  local: string,
  remote: string,
): Promise<boolean> {
  return client.uploadDir(local, remote).then((res) => {
    core.info(`UPLOAD FILE SUCCESS ----> ${res}`)
    return true
  })
    .catch((e) => {
      core.info(`UPLOAD FILE ERROR ----> ${e.message}`)
      return false
    })
}
