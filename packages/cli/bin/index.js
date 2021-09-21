#! /usr/bin/env node

const importLocal = require('import-local');
const npmlog = require('npmlog');

if (importLocal(__filename)) {
    npmlog.info('cli', 'damon: Using local version of this package')
} else {
    npmlog.info('cli', 'damon: Using global version of this package')
    console.log(process.argv)
    require('../lib')(process.argv.slice(2))
}