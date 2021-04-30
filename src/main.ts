import * as core from '@actions/core'
import {context} from '@actions/github'
import {exec} from '@actions/exec'

async function run(): Promise<void> {
  const artifactoryOrg = core.getInput('artifactory_org')
  const artifactoryDockerRepository = core.getInput(
    'artifactory_docker_repository'
  )
  const dockerRepositoryPrefix = core.getInput('docker_repository_prefix')
  const redHatScanRegistryHostname = core.getInput(
    'red_hat_scan_registry_hostname'
  )
  const redHatPid = core.getInput('red_hat_pid') ?? ''
  const {runId, ref} = context

  const sanitizedRef = getSanitizedRef(ref)

  const artifactoryDockerRegistryHostname = `${artifactoryOrg}-${artifactoryDockerRepository}.jfrog.io`

  core.setOutput('org', context.repo.owner)
  core.setOutput('repo', context.repo.repo)
  core.setOutput('build_number', `${context.sha}:${context.runId}`)
  core.setOutput('build_name', `${context.repo.owner}:${context.repo.repo}`)
  core.setOutput(
    'build_url',
    `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`
  )
  core.setOutput(
    'artifactory_docker_registry_hostname',
    artifactoryDockerRegistryHostname
  )
  core.setOutput(
    'artifactory_url',
    `https://${artifactoryOrg}.jfrog.io/artifactory`
  )
  core.setOutput('artifactory_docker_repository', artifactoryDockerRepository)

  core.setOutput('red_hat_scan_registry_hostname', redHatScanRegistryHostname)

  // There are some cases where the version is supplied by Astrolabe, rather than inferring from
  // the git repo.
  const commitDate = await (async () => {
    try {
      return await getCommitDate()
    } catch {
      return null
    }
  })()

  if (!commitDate) {
    return
  }

  const version = `${commitDate}.${sanitizedRef}`
  const imageName = `${dockerRepositoryPrefix}/${context.repo.repo}:${version}`
  core.setOutput('version', version)
  core.setOutput('image_name', imageName)
  core.setOutput(
    'artifactory_image_name',
    `${artifactoryDockerRegistryHostname}/${imageName}`
  )
  core.setOutput('ubi_image_name', `${imageName}-ubi`)
  core.setOutput(
    'ubi_scan_image_name',
    `${redHatScanRegistryHostname}/${redHatPid}/${context.repo.repo}:${version}-ubi`
  )
}

// This is sanitized for Docker image tags.
const getSanitizedRef = (ref: string): string => {
  if (ref.startsWith('refs/heads/')) {
    return sanitize(ref.substring('refs/heads/'.length))
  } else if (ref.startsWith('refs/tags/')) {
    return sanitize(ref.substring('refs/tags/'.length))
  } else {
    throw new Error(`Invalid git ref: ${ref}`)
  }
}

const sanitize = (str: string) => str.replace(/[^0-9a-z]/gi, '')

const getCommitDate = async (): Promise<string> => {
  let commitDateIso = ''
  await exec('git', ['log', '-1', '--date=iso', '--pretty=format:%cd'], {
    listeners: {
      stdout: data => {
        commitDateIso += data.toString()
      }
    }
  })
  const commitDate = new Date(commitDateIso.trim())
  return `${commitDate.getUTCFullYear()}.${
    (commitDate.getUTCMonth() + 1).toString().padStart(2, '0')
  }.${
    commitDate.getUTCDate().toString().padStart(2, '0')
  }.${
    commitDate.getUTCHours().toString().padStart(2, '0')
  }.${
    commitDate.getUTCMinutes().toString().padStart(2, '0')
  }.${
    commitDate.getUTCSeconds().toString().padStart(2, '0')
  }`
}

run().catch(e => core.setFailed(e))
