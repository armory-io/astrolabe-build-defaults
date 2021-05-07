export interface Inputs {
  artifactoryOrg: string
  artifactoryDockerRepository: string
  dockerRepositoryPrefix: string
  redHatScanRegistryHostname: string
  redHatPid: string

  runId: number
  ref: string
  sha: string

  org: string
  repo: string

  // In some cases, the build is happening in a different repo from
  // the code source repo.
  // For example, if we are building spinnaker/deck
  // inside of armory-io/oss-artifact-builder.
  buildOrg: string
  buildRepo: string
}

export interface TimestampResolver {
  // Retuns build timestamp in ISO 8601.
  resolve(): Promise<string>
}

export const generateVariables = async (
  inputs: Inputs,
  resolver: TimestampResolver
): Promise<{ [key: string]: string }> => {
  const {
    artifactoryOrg,
    artifactoryDockerRepository,
    dockerRepositoryPrefix,
    redHatScanRegistryHostname,
    redHatPid,
    runId,
    ref,
    sha,
    org,
    repo,
    buildOrg,
    buildRepo,
  } = inputs

  const outputs: {[key: string]: string} = {}

  const artifactoryDockerRegistryHostname = `${artifactoryOrg}-${artifactoryDockerRepository}.jfrog.io`

  outputs['org'] = org,
  outputs['repo'] = repo,
  outputs['build_number'] = `${sha}:${runId}`
  outputs['build_name'] = `${org}:${repo}`
  outputs['build_url'] = `https://github.com/${buildOrg}/${buildRepo}/actions/runs/${runId}`
  outputs['artifactory_docker_registry_hostname'] = artifactoryDockerRegistryHostname
  outputs['artifactory_url'] = `https://${artifactoryOrg}.jfrog.io/artifactory`
  outputs['artifactory_docker_repository'] = artifactoryDockerRepository
  outputs['red_hat_scan_registry_hostname'] = redHatScanRegistryHostname

  // There are some cases where the version is supplied by Astrolabe, rather than inferring from
  // the git repo.
  let versionTimestamp;
  try {
    versionTimestamp = convertIso(await resolver.resolve())
  } catch {
    return outputs
  }

  const sanitizedRef = getSanitizedRef(ref)
  const version = `${versionTimestamp}.${sanitizedRef}`
  const imageName = `${dockerRepositoryPrefix}/${repo}:${version}`

  outputs['version'] = version
  outputs['image_name'] = imageName
  outputs['artifactory_image_name'] = `${artifactoryDockerRegistryHostname}/${imageName}`
  outputs['ubi_image_name'] = `${imageName}-ubi`
  outputs['ubi_scan_image_name'] = `${redHatScanRegistryHostname}/${redHatPid}/${repo}:${version}-ubi`

  return outputs
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

const sanitize = (str: string) => str.replace(/[^0-9a-z\-\.]/gi, '')

const convertIso = (iso: string): string =>  {
  const date = new Date(iso)

  return `${date.getUTCFullYear()}.${(date.getUTCMonth() + 1)
    .toString()
    .padStart(2, '0')}.${date
    .getUTCDate()
    .toString()
    .padStart(2, '0')}.${date
    .getUTCHours()
    .toString()
    .padStart(2, '0')}.${date
    .getUTCMinutes()
    .toString()
    .padStart(2, '0')}.${date
    .getUTCSeconds()
    .toString()
    .padStart(2, '0')}`
}
