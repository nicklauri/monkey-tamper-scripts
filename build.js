#!/usr/bin/env node

const fs = require("fs")

/**
 * @callback PostProcessFn
 * @param {string} input
 * @returns {string}
 */

/**
 * @function
 * @param {number} amount
 * @param {boolean} [skipTail=false]
 * @returns {PostProcessFn}
 */
const skipLines = (amount, skipTail = false) => input =>
  input.split(/\r\n/)

const buildConfig = {
  html: {
    path: "./index.html",
    postProcess: [],
  },
  js: {
    path: "./index.js",
  },
  css: {
    path: "./index.css",
  },
}

function prepare() {
  const buildMaterial = {
    html: fs.readFileSync(buildConfig.html.path).toString(),
    js: fs.readFileSync(buildConfig.js.path).toString(),
    css: fs.readFileSync(buildConfig.css.path).toString(),
  }

  return buildMaterial
}

console.log(prepare())
