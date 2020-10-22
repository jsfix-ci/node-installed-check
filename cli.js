#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const chalk = require('chalk');
const dashdash = require('dashdash');

const installedCheck = require('installed-check-core');

const options = [
  {
    names: ['help', 'h'],
    type: 'bool',
    help: 'Print this help and exit.'
  },
  {
    names: ['engine-check', 'e'],
    type: 'bool',
    help: 'Checks that the engine requirements of the main package is compatible that of its dependencies.'
  },
  {
    names: ['engine-ignore', 'i'],
    type: 'arrayOfString',
    help: 'Excludes defined dependency from engine check.'
  },
  {
    names: ['engine-no-dev', 'd'],
    type: 'bool',
    help: 'Excludes dev dependencies from engine check.'
  },
  {
    names: ['version-check', 'c'],
    type: 'bool',
    help: 'Enables check that all dependencies in your package.json have supported versions installed.'
  },
  {
    names: ['strict', 's'],
    type: 'bool',
    help: 'Treat warnings as errors.'
  },
  {
    names: ['verbose', 'v'],
    type: 'bool',
    help: 'Shows warnings and notices.'
  }
];

const parser = dashdash.createParser({ options });

/** @type {{ [option: string]: any }} */
let opts;

try {
  opts = parser.parse(process.argv);
} catch (err) {
  console.error(chalk.bgRed('Error:'), err.message);
  process.exit(1);
}

if (opts.help) {
  const help = parser.help().trimEnd();
  console.log(
    '\n' +
    'Usage: installed-check <path to module folder>\n\n' +
    'Defaults to current folder.\n\n' +
    'Options:\n' +
    help +
    '\n'
  );
  process.exit(0);
}

const checkOptions = {
  path: opts._args[0],
  engineCheck: opts.engine_check,
  engineNoDev: opts.engine_no_dev,
  engineIgnores: opts.engine_ignore,
  versionCheck: opts.version_check
};

if (!checkOptions.engineCheck && !checkOptions.versionCheck) {
  checkOptions.engineCheck = true;
  checkOptions.versionCheck = true;
}

/**
 * @param {{ [key: string]: any }} obj
 * @returns {boolean}
 */
const hasNonEmptyProperties = (obj) => {
  for (const key in obj) {
    const value = obj[key];
    if (value) {
      if (Array.isArray(value) && value.length === 0) continue;
      return true;
    }
  }
  return false;
};

installedCheck(checkOptions).then(result => {
  if (opts.strict) {
    result.errors = result.warnings.concat(result.errors);
    result.warnings = [];
  }
  if (
    result.errors.length ||
    (opts.verbose && hasNonEmptyProperties(result))
  ) {
    console.log('');
  }
  if (opts.verbose && result.notices.length) {
    console.log(chalk.blue('Dependency notices:') + '\n\n' + result.notices.join('\n') + '\n');
  }
  if (opts.verbose && result.warnings.length) {
    console.log(chalk.yellow('Dependency warnings:') + '\n\n' + result.warnings.join('\n') + '\n');
  }
  if (result.errors.length) {
    console.error(chalk.bgRed('Dependency errors:') + '\n\n' + result.errors.join('\n') + '\n');
    process.exit(1);
  }
}).catch(err => {
  console.error(chalk.bgRed('Unexpected error:') + ' ' + err.message + '\n\n' + err.stack + '\n');
  process.exit(1);
});
