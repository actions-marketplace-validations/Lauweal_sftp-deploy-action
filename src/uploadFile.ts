import * as core from '@actions/core'
import Client from 'ssh2-sftp-client'
import glob from 'glob'
import path from 'path'
import fs from 'fs'

export async function uploadFile(
  client: Client,
  local: string,
  remote: string,
  ignore: string[] = []
): Promise<boolean> {
  const paths = glob.sync(path.join(local, '**/*'), { ignore: ignore || [] })
  const files = paths.filter((f) => fs.statSync(f).isFile());
  const dirs = paths.filter((f) => fs.statSync(f).isDirectory());
  await Promise.all(dirs.map((d) => client.mkdir(d.replace(local, remote), true)))
  return Promise.all(files.map((f) => {
    return client.fastPut(f, f.replace(local, remote)).then((res) => {
      core.info(`UPLOAD FILE SUCCESS ----> ${res}`)
      return true
    })
      .catch((e) => {
        core.info(`UPLOAD FILE ERROR ----> ${e.message}`)
        return false
      })
  })).then((status) => status.every((s) => !!s)).then((re) => {
    client.end()
    return re
  })
}
