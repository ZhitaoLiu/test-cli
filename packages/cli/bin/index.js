#! /usr/bin/env node

const importLocal = require('import-local');
const npmlog = require('npmlog');

if (importLocal(__filename)) {
    npmlog.info('cli', 'Using local version of this package')
} else {
    npmlog.info('cli', 'Using global version of this package')
    console.log(process.argv)
    require('../lib')(process.argv.slice(2))
}