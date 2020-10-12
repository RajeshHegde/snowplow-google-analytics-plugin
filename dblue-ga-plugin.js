/*
 * Dblue Google Analytics plugin.
 *
 * Copyright (c) 2020 Dblue, Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the Apache License Version 2.0 is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Apache License Version 2.0 for the specific language governing permissions and
 * limitations there under.
 */

function DblueGaPlugin(tracker, config) {
  var clientId = tracker.get('clientId')

  // Set GA client Id
  if (typeof config.clientIdDimensionIndex === 'number') {
    tracker.set('dimension' + config.clientIdDimensionIndex, clientId)
  }

  // Store the original custom task
  var customTaskName = 'customTask'
  var globalCustomTaskName = '_' + tracker.get('trackingId') + '_' + customTaskName
  var originalCustomTask = (window[globalCustomTaskName] = window[globalCustomTaskName] || tracker.get(customTaskName))

  // Add custom task to set custom dimensions
  tracker.set(customTaskName, function (model) {
    // Call original custom task

    if (typeof originalCustomTask === 'function') {
      originalCustomTask(model)
    }

    var uniqueId = getUniqueId()

    // Set hitId
    if (typeof config.hitIdDimensionIndex === 'number') {
      model.set('dimension' + config.hitIdDimensionIndex, uniqueId)
    }

    // Set sessionId
    if (typeof config.sessionIdDimensionIndex === 'number') {
      model.set('dimension' + config.sessionIdDimensionIndex, uniqueId)
    }

    // Set hit timestamp
    if (typeof config.hitTimestampDimensionIndex === 'number') {
      model.set('dimension' + config.hitTimestampDimensionIndex, getHitTimestamp())
    }

    // Set hit type
    if (typeof config.hitTypeDimensionIndex === 'number') {
      model.set('dimension' + config.hitTypeDimensionIndex, model.get('hitType'))
    }
  })

  if (config.endpoint) {
    var endpoint = config.endpoint.substr(-1) != '/' ? config.endpoint + '/' : config.endpoint

    var vendor = 'com.google.analytics'
    var version = 'v1'
    var path = endpoint + 'c'

    // Store original send hit task
    var sendHitTask = 'sendHitTask'

    var globalSendTaskName = '_' + tracker.get('trackingId') + '_' + sendHitTask

    var originalSendHitTask = (window[globalSendTaskName] = window[globalSendTaskName] || tracker.get(sendHitTask))

    // Set Dblue send hit task for parallel tracking
    tracker.set(sendHitTask, function (model) {
      var payload = model.get('hitPayload')

      // Send original Google Analytics hit
      originalSendHitTask(model)

      // Send hit to Dblue Parallel Tracker
      var request = new XMLHttpRequest()
      request.open('POST', path, true)
      request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')

      payload += '&vendor=' + vendor + '&version=' + version
      request.send(payload)
    })
  }
}

function getHitTimestamp() {
  // Get local time as ISO string with offset at the end
  var now = new Date()
  var tzo = -now.getTimezoneOffset()
  var dif = tzo >= 0 ? '+' : '-'
  var pad = function (num) {
    var norm = Math.abs(Math.floor(num))
    return (norm < 10 ? '0' : '') + norm
  }
  return (
    now.getFullYear() +
    '-' +
    pad(now.getMonth() + 1) +
    '-' +
    pad(now.getDate()) +
    'T' +
    pad(now.getHours()) +
    ':' +
    pad(now.getMinutes()) +
    ':' +
    pad(now.getSeconds()) +
    '.' +
    pad(now.getMilliseconds()) +
    dif +
    pad(tzo / 60) +
    ':' +
    pad(tzo % 60)
  )
}

function getUniqueId() {
  var d = new Date().getTime()
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    d += performance.now() //use high-precision timer if available
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0
    d = Math.floor(d / 16)
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function providePlugin(pluginName, pluginConstructor) {
  var ga = getGA()

  if (typeof ga == 'function') {
    ga('provide', pluginName, pluginConstructor)
  }
}

function getGA() {
  return window[window['GoogleAnalyticsObject'] || 'ga']
}
providePlugin('DblueGaPlugin', DblueGaPlugin)
