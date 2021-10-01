#! /usr/bin/env node

const importLocal = require('import-local');
const npmlog = require('@estayjs/util-log');


if (importLocal(__filename)) {
    npmlog.info('cli', 'Using local version of this package1')
} else {
    npmlog.info('cli', 'Using global version of this package2s')
    require('../lib')(process.argv.slice(2))
}