import * as core from '@actions/core'
import {context} from '@actions/github'
import {exec} from '@actions/exec'
import {Inputs, generateVariables} from './variables'

async function run(): Promise<void> {
  const inputs: Inputs = {
    artifactoryOrg: core.getInput('artifactory_org'),
    artifactoryDockerRepository: core.getInput('artifactory_docker_repository'),
    dockerRepositoryPrefix: core.getInput('docker_repository_prefix'),
    redHatScanRegistryHostname: core.getInput('red_hat_scan_registry_hostname'),
    redHatPid: core.getInput('red_hat_pid') ?? '',
    runId: context.runId,
    ref: context.ref,
    org: core.getInput('org') ?? context.repo.owner,
    repo: core.getInput('repo') ?? context.repo.repo,
    buildOrg: context.repo.owner,
    buildRepo: context.repo.repo
  }

  const outputs = await generateVariables(inputs, {
    resolve: getCommitDate
  })

  Object.entries(outputs).forEach(([key, value]) => {
    core.setOutput(key, value)
  })
}

const getCommitDate = async (): Promise<string> => {
  let commitDateIso = ''
  await exec('git', ['log', '-1', '--date=iso', '--pretty=format:%cd'], {
    listeners: {
      stdout: data => {
        commitDateIso += data.toString()
      }
    }
  })
  return commitDateIso.trim()
}

run().catch(e => core.setFailed(e))
