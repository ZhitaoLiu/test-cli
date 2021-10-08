'use strict';

const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')
const inquirer = require('inquirer');
const semver = require('semver');
const Command = require("@estayjs/command")
const npmlog = require("@estayjs/util-log")
const { isValidProjectName } = require("@estayjs/utils")



class InitCommand extends Command {
    // 重写
    init() {
        this.projectName = (this._argv || []).length > 0 ? this._argv[0] : ''
        this.force = (this._options || {}).force
    }
    // 重写
    async exec() {
        try {
            // 
            const projectInfo = await this.prepare()
            npmlog.verbose('projectInfo', projectInfo);
        } catch (e) {
            npmlog.error(e.message);
            if (this._options.debug || process.env.LOG_LEVEL === 'verbose') {
              console.log(e);
            }
        }
    }

    async prepare() {
        // TODO: 接入模版服务接口
        const template = [
            {
                "_id" : '60dd5af21f683b5c176f0b4e',
                "name" : "React H5模板",
                "npmName" : "test-cli-template-react-h5",
                "version" : "1.0.0",
                "type" : "normal",
                "installCommand" : "npm install --registry=https://registry.npm.taobao.org",
                "startCommand" : "npm run start",
                "tag" : [ 
                    "project"
                ],
                "ignore" : [ 
                    "**/public/**"
                ]
            }
        ]
        if(!template || template.length === 0) {
            throw new Error('项目模版不存在');
        }
        this.template = template
        const cwdPath = process.cwd()
        if(!this.isDirEmpty(cwdPath)) {
            // 当前目录不为空
            let isContinue = false
            if(!this.force) {
                isContinue = (await inquirer.prompt([{
                    type: 'confirm',
                    name: 'isContinue',
                    default: false,
                    message: '当前文件夹不为空，是否继续创建项目？',
                  }])).isContinue;
                if(!isContinue) {
                    return 
                }
            }
            if(this.force || isContinue) {
                const { confirmDelete } = await inquirer.prompt([{
                    type: 'confirm',
                    name: 'confirmDelete',
                    default: false,
                    message: '是否确认清空当前目录下的文件？',
                }]);
                if(confirmDelete) {
                    fse.emptyDirSync(cwdPath);
                }
            }

        }

        return new Promise(async (resolve, reject) => {
            let projectInfo = {};
            let isProjectNameValid = false
            if(isValidProjectName(this.projectName)) {
                isProjectNameValid = true
                projectInfo.name = this.projectName
            }
            // 选择创建项目或组件
            const { type } = await inquirer.prompt([{
                type: 'list',
                name: 'type',
                message: '请选择初始化类型',
                default: 'project',
                choices: [{
                    name: '项目',
                    value: 'project',
                }, {
                    name: '组件',
                    value: 'component',
                }],
            }])
            // 筛选对应类型的模版
            this.template = this.template.filter(template =>
                template.tag.includes(type))
            const title = type === 'project' ? '项目' : '组件'
            // 输入信息收集
            const projectPrompt = [];
            if(!isProjectNameValid) {
                projectPrompt.push({
                    type: 'input',
                    name: 'name',
                    message: `请输入${title}名称`,
                    default: '',
                    validate: function(v) {
                      const done = this.async()
                      setTimeout(function() {
                        if (!isValidProjectName(v)) {
                          done(`请输入合法的${title}名称`)
                          return
                        }
                        done(null, true);
                      }, 0)
                    },
                    filter: function(v) {
                      return v
                    },
                })
            }
            projectPrompt.push(
                {
                    type: 'input',
                    name: 'version',
                    message: `请输入${title}版本号`,
                    default: '1.0.0',
                    validate: function(v) {
                        const done = this.async();
                        setTimeout(function() {
                            if (!(!!semver.valid(v))) {
                            done('请输入合法的版本号');
                            return;
                            }
                            done(null, true);
                        }, 0);
                    },
                    filter: function(v) {
                        if (!!semver.valid(v)) {
                            return semver.valid(v);
                        } else {
                            return v;
                        }
                    },
                },
                {
                    type: 'list',
                    name: 'projectTemplate',
                    message: `请选择${title}模板`,
                    choices: this.template.map(item => ({
                                value: item.npmName,
                                name: item.name,
                             }))
                }
            )

            const project = await inquirer.prompt(projectPrompt)
            projectInfo = {
                type,
                ...projectInfo,
                ...project
            }
            if(projectInfo.name) {
                projectInfo.className = require('kebab-case')(projectInfo.name).replace(/^-/, '');
            }
            resolve(projectInfo)
        })

    }

    // 判断当前目录是否为空
    isDirEmpty(localPath) {
        let fileList = fs.readdirSync(localPath)
        fileList = fileList.filter(file => !file.startsWith('.') && ['node_modules'].indexOf(file) < 0)
        return !fileList || fileList.length <= 0
    }
}

function commandInit(argv) {
    return new InitCommand(argv)
}

module.exports = commandInit
module.exports.InitCommand = InitCommand

