## Dblue GA Tracker using GTM

Google Tag Manager does not currently support loading plugins when using Google Analytics tag templates. A common workaround is to use a Custom HTML tag to load the tracker with the plugin, but this has the unfortunate consequence of requiring that _all_ tags to which the plugin should be applied use the same tracker name. This is difficult to do with Google Tag Manager in a way that doesn't compromise data collection quality.

The best way to deploy this using Google Tag Manager is to replicate the plugin functionality by overwriting the relevant task in the GA hit builder task queue. But instead of modifying `sendHitTask` directly, a safer way is to approach it via `customTask`.

### 1. Create a new Custom JavaScript variable

Create a new Custom JavaScript variable, and name it `CustomTask - Dblue parallel tracker`. Add the following code within:

```javascript
function() {
  var clientIdDimensionIndex = 1;
  var hitTypeDimensionIndex = 5;
  var endpoint = 'https://us-central1-dblue-data-collector.cloudfunctions.net/c';

  return function(model) {

    var clientId = model.get('clientId')

    // Set GA client Id
    if (typeof clientIdDimensionIndex === 'number') {
      model.set('dimension' + clientIdDimensionIndex, clientId)
    }

    if (typeof hitTypeDimensionIndex === 'number') {
      model.set('dimension' + hitTypeDimensionIndex, model.get('hitType'));
    }

    if (endpoint) {
      var vendor = 'com.google.analytics';
      var version = 'v1';

      var globalSendTaskName = '_' + model.get('trackingId') + '_sendHitTask';

      var originalSendHitTask = window[globalSendTaskName] = window[globalSendTaskName] || model.get('sendHitTask');

      model.set('sendHitTask', function(sendModel) {
        var payload = sendModel.get('hitPayload');
        originalSendHitTask(sendModel);

        var request = new XMLHttpRequest();
        request.open('POST', endpoint, true);
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

        payload += '&vendor=' + vendor + '&version=' + version;
        request.send(payload);
      });
    }
  };
}
```

This stores a reference to the original `sendHitTask` in a globally scoped variable (e.g. `window['_UA-12345-1_sendHitTask']`) to avoid multiple runs of this `customTask` from cascading on each other.

### 2. Add `CustomTask - Dblue parallel tracker` to Google Analytics tags

This variable must be added to every single Google Analytics tag in the GTM container, whose hits you want to duplicate to Dblue.

The best way to do this is to leverage the `Google Analytics Settings` variable.

1. Browse to `Variables > Google Analytics Settings` configurations, expand it, and then expand **Fields to set**.

2. Add a new field with:

   - **Field name**: customTask
   - **Value**: {{CustomTask - Dblue parallel tracker}}

3. Publish the changes

All tags which have this field set will now send the Google Analytics payload to the Dblue endpoint.
