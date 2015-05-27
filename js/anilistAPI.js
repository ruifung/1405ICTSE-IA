/*jslint browser: true*/
/*global generatePostString*/

var apiPrefix = "http://anilist.co/api/";
var aniListApiToken;

function getAuthToken() {
    var apihttp=new XMLHttpRequest();
    apihttp.onreadystatechange = function() {
        if(apihttp.readyState == 4 && apihttp.status == 200) {
            aniListApiToken = JSON.parse(apihttp.responseText);
        }
    };
    apihttp.open("POST",apiPrefix+"auth/access_token",true);
    apihttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    var postData = {
        grant_type: "client_credentials",
        client_id: "rfctkssparkle-1vxvz",
        client_secret: "TOIVn8wO3obEoxeJPyd"
    };
    apihttp.send(generatePostString(postData));
}