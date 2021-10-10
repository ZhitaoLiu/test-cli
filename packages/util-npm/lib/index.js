const axios = require('axios');
const urlJoin = require('url-join');
const semver = require('semver');

// 获取npm包的所有信息
function getNpmInfo(npmName, registry) {
  if (!npmName) return;
  const registryURL = registry || getDefaultRegistry();
  const npmInfoURL = urlJoin(registryURL, npmName);
  return axios
    .get(npmInfoURL)
    .then((res) => {
      if (res.status === 200) {
        return res.data;
      }
      return null;
    })
    .catch((err) => {
      return Promise.reject(err);
    });
}

// 获取npm包的所有版本
async function getNpmVersions(npmName, registry) {
  const data = await getNpmInfo(npmName, registry);
  if (data) {
    return Object.keys(data.versions);
  } else {
    return [];
  }
}

// 获取最新的npm包版本
async function getNpmLatestVersion(npmName, registry) {
  let versions = await getNpmVersions(npmName, registry);
  if (versions && versions.length > 0) {
    return versions.sort((a, b) => (semver.gt(b, a) ? 1 : -1))[0];
  }
  return null;
}

// 获取 符合>最低基础版本 的最新版本
async function getNpmSemverVersion(baseVersion, npmName, registry) {
  const versions = await getNpmVersions(npmName, registry);
  const newVersions = (versions || [])
    .filter((v) => semver.satisfies(v, `>${baseVersion}`))
    .sort((a, b) => (semver.gt(b, a) ? 1 : -1));
  if (newVersions && newVersions.length > 0) {
    return newVersions[0];
  }
  return null;
}

// 获取镜像源地址 1
function getDefaultRegistry(isOriginal = false) {
  return isOriginal ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org';
}

module.exports = {
  getDefaultRegistry,
  getNpmInfo,
  getNpmVersions,
  getNpmLatestVersion,
  getNpmSemverVersion,
};
