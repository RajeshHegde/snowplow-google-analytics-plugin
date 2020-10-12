## Dblue GA Tracker using GTM

Google Tag Manager does not currently support loading plugins when using Google Analytics tag templates. A common workaround is to use a Custom HTML tag to load the tracker with the plugin, but this has the unfortunate consequence of requiring that _all_ tags to which the plugin should be applied use the same tracker name. This is difficult to do with Google Tag Manager in a way that doesn't compromise data collection quality.

The best way to deploy this using Google Tag Manager is to replicate the plugin functionality by overwriting the relevant task in the GA hit builder task queue. But instead of modifying `sendHitTask` directly, a safer way is to approach it via `customTask`.

### 1. Create a new Custom JavaScript variable for Dblue parallel tracker

Create a new Custom JavaScript variable, and name it `CustomTask - Dblue parallel tracker`. Add the following code within:

```javascript
function() {
  var clientIdDimensionIndex = 1; // Change this number to the index of your ClientID Custom Dimension
  var hitTypeDimensionIndex = 5; // Change this number to the index of your HitType Custom Dimension or set null when not needed

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

### 2. Create `Random GUID` variable

Create a new Custom JavaScript variable, and name it `Random GUID`. Add the following code within:

```javascript
function () {
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}
```

### 3. Create `Hit Timestamp` variable (Optional)

Create a new Custom JavaScript variable, and name it `Hit Timestamp`. Add the following code within:

```javascript
function() {
  // Get local time as ISO string with offset at the end
  var now = new Date();
  var tzo = -now.getTimezoneOffset();
  var dif = tzo >= 0 ? '+' : '-';
  var pad = function(num) {
      var norm = Math.abs(Math.floor(num));
      return (norm < 10 ? '0' : '') + norm;
  };
  return now.getFullYear()
      + '-' + pad(now.getMonth()+1)
      + '-' + pad(now.getDate())
      + 'T' + pad(now.getHours())
      + ':' + pad(now.getMinutes())
      + ':' + pad(now.getSeconds())
      + '.' + pad(now.getMilliseconds())
      + dif + pad(tzo / 60)
      + ':' + pad(tzo % 60);
}
```

### 4. Create `UserId DataLayer` variable (Optional)

Create a new DataLayer variable, and name it `UserId DataLayer`.

- Set Data Layer Variable name to `userId`
- Data Layer Version to `Version 2`
- Do not set any default value

### 5. Create Document Referrer` variable (Optional)

Create a new Javascript variable, and name it Document Referrer`.

- Set Global Variable Name to `document.referrer`

### 6. Set fields on Google Analytics tags

Above variables must be added to every single Google Analytics tag in the GTM container, whose hits you want to duplicate to Dblue or set custom dimensions.

The best way to do this is to leverage the `Google Analytics Settings` variable.

1. Browse to `Variables > Google Analytics Settings` configurations, expand it, and then expand **Fields to set**.

1. Add a new field with:

   - **Field name**: customTask
   - **Value**: {{CustomTask - Dblue parallel tracker}}

1. Expand More settings > Custom Dimensions

1. Add Session Id

   - **Index**: SessionId custom dimension index from Google Analytics admin page
   - **Value**: {{Random GUID}}

1. Add Hit Id

   - **Index**: HitId custom dimension index from Google Analytics admin page
   - **Value**: {{Random GUID}}

1. Add User Id (Optional)

   - **Index**: UserId custom dimension index from Google Analytics admin page
   - **Value**: {{UserId DataLayer}}

1. Add Hit Timestamp (Optional)

   - **Index**: HitTimestamp custom dimension index from Google Analytics admin page
   - **Value**: {{Hit Timestamp}}

1. Add Document Referrer (Optional)

   - **Index**: DocumentReferrer custom dimension index from Google Analytics admin page
   - **Value**: {{Document Referrer}}

1. Add Container Id (Optional)
   - **Index**: ContainerId custom dimension index from Google Analytics admin page
   - **Value**: {{Container ID}}

### 3. Publish the changes

All tags which have this field set will now send the Google Analytics payload to the Dblue endpoint.
