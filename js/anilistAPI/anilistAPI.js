/*jslint browser: true,-W018*/

// Reference for usage: http://anilist-api.readthedocs.org/en/stable/anime.html

function aniListAPI() {
    var postData;
    
    this.authToken = {};
    this.anime = {};
    this.apiPrefix = "https://anilist.co/api/";
    
    this.generateRequestString = function (postData) {
        var postString = "";
        for(var key in postData) {
            postString = postString.concat(key+'='+encodeURIComponent(postData[key])+'&');
        }
        return postString.substring(0, postString.length - 1);
    };
    
    this.getAuthToken = function () {
        var apihttp = new XMLHttpRequest();
        apihttp.onreadystatechange = function () {
            if ((apihttp.readyState === 3 || apihttp.readyState === 4 ) && apihttp.status === 200) {
                this.authToken = JSON.parse(apihttp.responseText);
            }
        };
        apihttp.open("POST", this.apiPrefix + "auth/access_token", false);
        apihttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        postData = {
            grant_type: "client_credentials",
            client_id: "rfctkssparkle-1vxvz",
            client_secret: "TOIVn8wO3obEoxeJPyd"
        };
        apihttp.send(this.generateRequestString(postData));
    };
    
    this.renewToken = function () {
        if (this.authToken.expires <= Math.floor(Date.now() / 1000)) {
            this.getAuthToken();
        }
    };
    
    /*
    Used to send API requests to anilist.
    
    Valid Methods are same as XMLHttpRequest.
    Has no return value, use callbacks instead.
    Despite the formal function definition, postData can be ommited
    when using GET.
    
    Syntax:
        apiRequest("GET", urlSuffix, callback);
        apiRequest("GET", urlSuffix, requestData, callback);
        apiRequest("POST", urlSuffix, requestData, callback);
        
    Callback:
        First parameter is succeed status (true/false);
        If succeded, second parameter is returned data.
        If failed, second parameter is XMLHttpRequest object for additional information.
    */
    this.apiRequest = function (method, urlSuffix, requestData, callback) {
        var apihttp = new XMLHttpRequest();
        apihttp.onreadystatechange = function () {
            if (apihttp.readyState === 4 && apihttp.status === 200 && typeof callback === 'function') {
                callback(true, JSON.parse(apihttp.responseText));
            } else {
                callback(false, apihttp);
            }
        };
        this.renewToken();
        apihttp.setRequestHeader("access_token", this.authToken.access_token);
        try {
            if (!(method.toUpperCase === "POST" || method.toUpperCase === "GET")) {
                throw "InvalidRequestMethodException";
            }
            if (method.toUpperCase === "GET" && typeof requestData === 'function') {
                callback = requestData;
                requestData = undefined;
            }
            if (method.toUpperCase === "POST" && !(typeof requestData === 'object')) {
                throw "InvalidPostDataException";
            }
            switch (method) {
                case "GET":
                    apihttp.open(method.toUpperCase, this.apiPrefix + this.apiPath + '?' + generateRequestString(requestData) , true);
                    apihttp.send();
                    break;
                case "POST":
                    apihttp.open(method.toUpperCase, this.apiPrefix + this.apiPath, true);
                    apihttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                    apihttp.send(this.generateRequestString(requestData));
                    break;
            }
            return true;
        } catch (err) {
            return false;
        }
    };
    
    this.getGenres = function (callback) {
        return this.apiRequest("GET", "genre_list", callback);
    };
    
    this.anime.get = function (type, animeID, callback) {
        var urlSuffix = "anime/" + animeID;
        switch (type.toLowerCase) {
            case "page":
                urlSuffix = urlSuffix + "/page";
                break;
            case "characters":
                urlSuffix = urlSuffix + "/characters";
                break;
            case "staff":
                urlSuffix = urlSuffix + "/staff";
                break;
            case "actors":
                urlSuffix = urlSuffix + "/actors";
                break;
            case "airing":
                urlSuffix = urlSuffix + "/airing";
                break;
        }
        return this.apiRequest("GET", urlSuffix, callback);
    };
    
    this.anime.browse = function (options,callback) {
        return this.apiRequest("GET", "browse/anime", options, callback);
    };
    
    this.anime.search = function (query, callback) {
        var urlSuffix = "anime/search/" + encodeURIComponent(query);
        return this.apiRequest("GET", urlSuffix, callback);
    };
    
    
    //Initialize object
    this.getAuthToken();
}