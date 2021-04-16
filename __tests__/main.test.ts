import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'

// This is the last commit time of the submoduled Kayenta.
const KAYENTA_COMMIT_TIMESTAMP = '2021.3.20.6.5.28'

test('generates astrolabe build conventions as outputs', async () => {
  const env = {...process.env}
  env['INPUT_ARTIFACTORY_ORG'] = 'armory'
  env['INPUT_ARTIFACTORY_DOCKER_REPOSITORY'] = 'docker-local'
  env['INPUT_DOCKER_REPOSITORY_PREFIX'] = 'armory'
  env['INPUT_RED_HAT_SCAN_REGISTRY_HOSTNAME'] = 'scan.connect.redhat.com'
  env['INPUT_RED_HAT_PID'] = 'armory_redhat'
  env['GITHUB_RUN_ID'] = '123'
  env['GITHUB_REF'] = 'refs/heads/master'
  env['GITHUB_REPOSITORY'] = 'spinnaker/kayenta'
  env['GITHUB_SHA'] = 'my-git-sha'

  const outputs = parse(runner(path.join(__dirname, '/kayenta'), env))

  expect(outputs['version']).toEqual(`${KAYENTA_COMMIT_TIMESTAMP}.master`)
  expect(outputs['org']).toEqual('spinnaker')
  expect(outputs['repo']).toEqual('kayenta')
  expect(outputs['build_number']).toEqual('my-git-sha:123')
  expect(outputs['build_name']).toEqual('spinnaker:kayenta')
  expect(outputs['build_url']).toEqual(
    'https://github.com/spinnaker/kayenta/actions/runs/123'
  )
  expect(outputs['image_name']).toEqual(
    `armory/kayenta:${KAYENTA_COMMIT_TIMESTAMP}.master`
  )
  expect(outputs['artifactory_docker_registry_hostname']).toEqual(
    'armory-docker-local.jfrog.io'
  )
  expect(outputs['artifactory_url']).toEqual('armory.jfrog.io/artifactory')
  expect(outputs['artifactory_image_name']).toEqual(
    `armory-docker-local.jfrog.io/armory/kayenta:${KAYENTA_COMMIT_TIMESTAMP}.master`
  )
  expect(outputs['ubi_image_name']).toEqual(
    `armory/kayenta:${KAYENTA_COMMIT_TIMESTAMP}.master-ubi`
  )
  expect(outputs['ubi_scan_image_name']).toEqual(
    `scan.connect.redhat.com/armory_redhat/kayenta:${KAYENTA_COMMIT_TIMESTAMP}.master-ubi`
  )
})

const runner = (testDir: string, env: any): string => {
  return cp
    .execSync(
      `npx ts-node --project ${path.join(
        __dirname,
        '..',
        'tsconfig.json'
      )} ${path.join(__dirname, '..', 'src', 'main.ts')}`,
      {
        env,
        cwd: testDir
      }
    )
    .toString()
}

const parse = (raw: string): {[key: string]: string} => {
  const outputs: {[key: string]: string} = {}
  const lines = raw.split('\n')

  lines
    .filter(line => line.startsWith('::set-output'))
    .forEach(line => {
      const [key, value] = line
        .substring('::set-output name='.length)
        .split('::')
      outputs[key] = value
    })

  return outputs
}
