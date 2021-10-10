const path = require('path');
const fse = require('fs-extra');
const pathExists = require('path-exists').sync;
const pkgDir = require('pkg-dir').sync;
const npminstall = require('npminstall');

const { isObject, systemPathFormat } = require('@estayjs/utils');

const { getNpmLatestVersion, getDefaultRegistry } = require('@estayjs/util-npm');

class Package {
  constructor(options) {
    if (!options) {
      throw new Error('Package类的options参数不能为空！');
    }
    if (!isObject(options)) {
      throw new Error('Package类的options参数必须为对象！');
    }
    // package name
    this.packageName = options.packageName;
    // package version
    this.packageVersion = options.packageVersion;
    // package的目标路径
    this.targetPath = options.targetPath;
    // 缓存package的路径
    this.storeDir = options.storeDir;
    // package的缓存目录前缀
    this.cacheFilePathPrefix = this.packageName.replace('/', '_');
  }

  get cacheFilePath() {
    return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`);
  }

  getSpecificCacheFilePath(packageVersion) {
    return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`);
  }

  async prepare() {
    // 有路径的值，但是路径不存在，就创建路径
    // mkdirp区别mkdir是创建整1条路径的文件夹，如果不存在的话
    if (this.storeDir && !pathExists(this.storeDir)) {
      fse.mkdirp(this.storeDir);
    }
    // 获取最新版本的版本号
    if (this.packageVersion === 'latest') {
      this.packageVersion = await getNpmLatestVersion(this.packageName);
    }
  }

  async exists() {
    if (this.storeDir) {
      await this.prepare();
      return pathExists(this.cacheFilePath);
    } else {
      // 本地路径调试
      return pathExists(this.targetPath);
    }
  }
  // 安装
  async install() {
    await this.prepare();
    return npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: getDefaultRegistry(),
      pkgs: [
        {
          name: this.packageName,
          version: this.packageVersion,
        },
      ],
    });
  }
  // 更新
  async update() {
    await this.prepare();
    // 获取最新的npm模块版本号
    const latestPackageVersion = await getNpmLatestVersion(this.packageName);
    // 查询最新版本号对应的路径是否存在
    const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion);
    // 如果不存在，则直接安装最新版本
    if (!pathExists(latestFilePath)) {
      await npminstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: getDefaultRegistry(),
        pkgs: [
          {
            name: this.packageName,
            version: latestPackageVersion,
          },
        ],
      });
      this.packageVersion = latestPackageVersion;
    }
  }

  // 获取入口文件的路径
  getRootFilePath() {
    function _getRootFile(targetPath) {
      // 获取package.json所在目录
      const dir = pkgDir(targetPath);
      if (dir) {
        const pkgFile = require(path.resolve(dir, 'package.json'));
        if (pkgFile && pkgFile.main) {
          // 路径的兼容(macOS/windows)
          return systemPathFormat(path.resolve(dir, pkgFile.main));
        }
      }
      return null;
    }
    if (this.storeDir) {
      return _getRootFile(this.cacheFilePath);
    } else {
      return _getRootFile(this.targetPath);
    }
  }
}

module.exports = Package;
