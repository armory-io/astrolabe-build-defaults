## Armory Build Defaults

Outputs variables for builds that Astrolabe expects.

Outputs:
- `version`
- `org`
- `repo`
- `build_number`
- `build_name`
- `build_url`
- `image_name`
- `artifactory_docker_registry_hostname`
- `artifactory_url`
- `ubi_image_name`
- `ubi_scan_image_name`

## Development

The tests use a submoduled [Kayenta](https://github.com/spinnaker/kayenta).

If you clone this project you should include its git submodules: 

```shell
git clone git@github.com:armory-io/astrolabe-build-defaults.git --recurse-submodules
```
