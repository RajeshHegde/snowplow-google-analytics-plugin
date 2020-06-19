# Google Analytics plugin for Snowplow

[![Build Status][travis-image]][travis] [![License][license-image]][license]

## Overview

[dblue-ga-plugin.js](dblue-ga-plugin.js) lets you fork the payloads sent to Google Analytics to your
Snowplow endpoint.

|   **[Technical Docs][tech-docs]**   |   **[Setup Guide][setup-guide]**  | **Roadmap & contributing** |
|:-----------------------------------:|:---------------------------------:|:--------------------------:|
| [![i1][tech-docs-image]][tech-docs] | [![i2][setup-image]][setup-guide] |    ![i3][roadmap-image]    |

## Deployment with Google Analytics

Place the following lines along with Google Analytics code.

```html
<script>
  // usual GA code
  
  ga('create', 'UA-XXXXX-Y', 'auto');
  ga('require', 'dblueGaPlugin', { endpoint: 'https://us-central1-dblue-dev-235513.cloudfunctions.net' });
  ga('send', 'pageView');
</script>
<scipt async src="https://storage.googleapis.com/dblue-ga-plugin/1.0.0/dblue-ga-plugin.js"></script>
```

Where `https://us-central1-dblue-dev-235513.cloudfunctions.net` is your Dblue Collector endpoint.

## Deployment with Google Tag Manager

Google Tag Manager does not currently support loading plugins when using Google Analytics tag templates. A common workaround is to use a Custom HTML tag to load the tracker with the plugin, but this has the unfortunate consequence of requiring that _all_ tags to which the plugin should be applied use the same tracker name. This is difficult to do with Google Tag Manager in a way that doesn't compromise data collection quality.

The best way to deploy this using Google Tag Manager is to replicate the plugin functionality by overwriting the relevant task in the GA hit builder task queue. But instead of modifying `sendHitTask` directly, a safer way is to approach it via `customTask`. 

### 1. Create a new Custom JavaScript variable

Create a new Custom JavaScript variable, and name it {{customTask - Dblue duplicator}}. Add the following code within:

```javascript
function() {
  // Add your Dblue collector endpoint here
  var endpoint = 'https://us-central1-dblue-dev-235513.cloudfunctions.net';
  
  return function(model) {
    var vendor = 'com.google.analytics';
    var version = 'v1';
    var path = ((endpoint.substr(-1) !== '/') ? endpoint + '/' : endpoint);
    
    var globalSendTaskName = '_' + model.get('trackingId') + '_sendHitTask';
    
    var originalSendHitTask = window[globalSendTaskName] = window[globalSendTaskName] || model.get('sendHitTask');
    
    model.set('sendHitTask', function(sendModel) {
      var payload = sendModel.get('hitPayload');
      originalSendHitTask(sendModel);
      
      var request = new XMLHttpRequest();
      request.open('POST', path, true);
      request.setRequestHeader('Content-type', 'text/plain; charset=UTF-8');

      payload += '&vendor=' + vendor + '&version=' + version;
      request.send(payload);
    });
  };
}
```

This stores a reference to the original `sendHitTask` in a globally scoped variable (e.g. `window['_UA-12345-1_sendHitTask']`) to avoid multiple runs of this `customTask` from cascading on each other.

### 2. Add {{customTask - Dblue duplicator}} to Google Analytics tags

This variable must be added to every single Google Analytics tag in the GTM container, whose hits you want to duplicate to Dblue. 

The best way to do this is to leverage the Google Analytics Settings variable.

Regardless of whether you choose to add this variable directly to the tags' settings or into a Google Analytics Settings variable, you need to do the following.

1. Browse to the tags' **More Settings** option, expand it, and then expand **Fields to set**. If you are editing the tag directly (i.e. not using a Google Analytics Settings variable), you will need to check "Enable overriding settings in this tag" first.

2. Add a new field with:

    - **Field name**: customTask
    - **Value**: {{customTask - Dblue duplicator}}
    
All tags which have this field set will now send the Google Analytics payload to the Dblue endpoint.

Further reading on the topic:

* [_Google Analytics Settings Variable_](https://www.simoahava.com/analytics/google-analytics-settings-variable-in-gtm/)

* [_GTMTips: Automatically Duplicate Google Analytics Hits To Snowplow_](https://www.simoahava.com/analytics/automatically-fork-google-analytics-hits-snowplow/)

## Questions or need help?

Check out the **[Talk to us][talk-to-us]** page on our wiki.

## Copyright and license

Google Analytics plugin for Snowplow is copyright 2018-2018 Snowplow Analytics Ltd.

Licensed under the **[Apache License, Version 2.0][license]** (the "License");
you may not use this software except in compliance with the License.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

[travis]: https://travis-ci.org/snowplow-incubator/snowplow-google-analytics-plugin
[travis-image]: https://travis-ci.org/snowplow-incubator/snowplow-google-analytics-plugin.png?branch=master

[license]: http://www.apache.org/licenses/LICENSE-2.0
[license-image]: http://img.shields.io/badge/license-Apache--2-blue.svg?style=flat

[tech-docs]: https://github.com/snowplow/snowplow/wiki/Setting-up-google-analytics-integration
[setup-guide]: https://github.com/snowplow/snowplow/wiki/Setting-up-google-analytics-integration

[tech-docs-image]: https://d3i6fms1cm1j0i.cloudfront.net/github/images/techdocs.png
[setup-image]: https://d3i6fms1cm1j0i.cloudfront.net/github/images/setup.png
[roadmap-image]: https://d3i6fms1cm1j0i.cloudfront.net/github/images/roadmap.png

[talk-to-us]: https://github.com/snowplow/snowplow/wiki/Talk-to-us
