# Dblue GA Tracker on Shopify

## 1. Create Custom Dimensions

Go to the Google Analytics Admin view, in the Property section, go to Custom Definitions > Custom Dimensions. Add the following dimensions:

1. ClientID with the User scope
   Click the +New Custom Dimension button. Add the name "ClientID" and choose the User scope.
   
   ![ClientId](./images/ga-custom-dimension-clientid.png)

2. SessionID with the Session scope
   Click the +New Custom Dimension button. Add the name "SessionID" and choose the Session scope.
   
   ![SessionId](./images/ga-custom-dimension-sessionid.png)
   
3. (Optional) UserID with the User scope.
   Click the +New Custom Dimension button. Add the name "UserID" and choose the User scope.
   
   ![UserId](./images/ga-custom-dimension-userid.png)
   

After adding all custom dimensions, it will look similar to the below one.

![Custom dimensions](./images/ga-custom-dimensions.png)



## 2. Set up ClientId and SessionId tracking on Shopify Store

1. Go to `Online Store > Themes`.
1. Find Theme libary `Actions` dropdown, click on `Edit code`.
 
   ![Edit code](./images/shopify-theme-edit-code.png)
1. Click on `Add new snippet` from the sidebar. Create the snippet with `dblue-ga-tracker` name.

   ![Add snippet](./images/shopify-add-snippet.png)

1. Change the following variables in the code snippet

   - `GA_TRACKER_ID` - Your Google Analytics Tracking code
   - `CLIENT_ID_DIMENSION_INDEX` - ClientId custom dimension index
   - `SESSION_ID_DIMENSION_INDEX` - SessionId custom dimension index
   - `USER_ID_DIMENSION_INDEX` - UserId custom dimension index

1. Place the modified code snippet in the newly created `dblue-ga-tracker.liquid` file and click on `Save`
   
   ![Save snippet](./images/shopify-dblue-ga-tracker-snippet.png)

1. Select `theme.liquid` file from the sidebar, place `{% include 'dblue-ga-tracker' %}` code just before the closing of `</head>` tag and click on `Save`
   
   ![Include snippet](./images/shopify-include-dblue-ga-tracker-snippet.png)

1. Go back to `Online Store > Themes`, find Theme libary `Actions` dropdown, click on `Publish`.

1. Also, place the content of `dblue-ga-tracker.liquid` in `Settings > Checkount` Additional scripts box, and click on `Save`.
   
   ![Additional scripts](./images/shopify-checkout-additional-scripts.png)

#### Code snippet

```html
<script>

  var GA_TRACKER_ID = "UA-XXXXX-X";
  var CLIENT_ID_DIMENSION_INDEX = 1;
  var SESSION_ID_DIMENSION_INDEX = 2;
  var USER_ID_DIMENSION_INDEX = 3;


  // Create ga object if not exists
  ga = window.ga = window.ga || function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;

  ga('create', GA_TRACKER_ID, 'auto')

  // Set custom dimensions
  ga(function(tracker) {
    var clientId = "GA" + String(tracker.get("clientId"));

    ga("set", "dimension" + CLIENT_ID_DIMENSION_INDEX, clientId);

    ga("set", "dimension" + SESSION_ID_DIMENSION_INDEX, new Date().getTime() + "." + Math.random().toString(36).substring(5));

    if (__st && __st["cid"]) {
        ga("set", "dimension" + USER_ID_DIMENSION_INDEX, "shopify" + String(__st["cid"]));
    }
  });

  // Load Dblue parallel tracker
  ga('require', 'dblueGaPlugin', { endpoint: 'https://us-central1-dblue-data-collector.cloudfunctions.net' })



</script>
<script async src="https://storage.googleapis.com/dblue-ga-plugin/1.0.0/dblue-ga-plugin.js"></script>

```

## 3. Create Google Analytics Reporting API Credentials

This part includes creating API credentials to authenticating the Google Analytics Reporting API and access the data. The setup will need access to [Google Developer Console](https://console.developers.google.com/).

1. Create Google Cloud Project

	- Click on NEW PROJECT button
	
   ![Create project](./images/gcp-create-new-project-1.png)
   
   - Fill in the details as per your organization needs
   
   ![Create project](./images/gcp-create-new-project-2.png)
   
   
   
1. Enable Google Analytics Reporting API
   
   - Search for Google Analytics Reporting API 
   
   ![Create project](./images/gcp-ga-reporting-api.png)
   
   - Click on Enable button
   
   ![Create project](./images/gcp-enable-ga-reporting-api.png)


1. Create API credentials

Going back to the main page of the Google Developers console, go to the Credentials tab and click the Manage service accounts link. This will go to the IAM & Admin console, where you can click the +CREATE SERVICE ACCOUNT button. This will open the Create Service Account dialog. Add a name and select the Role or Project > Viewer.

Check the Furnish a new private key checkbox and choose the JSON format. After saving the form, a JSON file with the API credentials will be downloaded.