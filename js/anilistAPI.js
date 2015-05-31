/*jslint browser: true,-W018*/

// Reference for usage: http://anilist-api.readthedocs.org/en/stable/anime.html

function aniListAPI() {
    var postData;
    
    this.apiPrefix = "https://anilist.co/api/";
    this.retryCount = 3;
    this.timeout = 10000;
    
    this.initialized = false;
    this.ready = false;
    this.authToken = {};
    this.anime = {};
    this.pendingRequests = [];
    
    this.generateRequestString = function (postData) {
        var postString = "";
        for(var key in postData) {
            postString = postString.concat(key+'='+encodeURIComponent(postData[key])+'&');
        }
        return postString.substring(0, postString.length - 1);
    };
    
    this.executeQueue = function() {
        while (this.pendingRequests.length > 0) {
            this.pendingRequests.shift()();
        }
    };
    
    //Get a authentication token for the API.
    this.authRetries = 0;
    this.getAuthToken = function (callback) {
        var xhr = new XMLHttpRequest();
        var completed = false;
        this.ready = false;
        xhr.onreadystatechange = function () {
            if ((xhr.readyState === 4) && !completed ) {
                if (xhr.status === 200) {
                    //Parse and verify token.
                    var token = JSON.parse(xhr.responseText);
                    if (typeof token.access_token === 'string') {
                        this.authToken = token;
                        completed = true;
                        this.ready = true;
                        
                        //Save token to sessionStorage
                        if(typeof(Storage) !== "undefined") {
                            sessionStorage.setItem("anilist.api.authtoken",JSON.stringify(token));
                        }
                        
                        //Call the callback if present.
                        if (typeof callback === 'function') {
                            callback();
                        }
                        
                        //Process queued requests.
                        this.executeQueue();
                    }
                } else if (xhr.readyState === 4 && xhr.status != 200) {
                    completed = true;
                    if (this.authRetries < this.retryCount) {
                        this.authRetries++;
                        this.getAuthToken(callback);
                    } else {
                        this.ready = true;
                        throw "XHRRequestFailed: " + xhr.status + ':' + xhr.responseText;
                    }
                }
            }
        }.bind(this);
        
        xhr.ontimeout = function () {
            if (this.authRetries < this.retryCount) {
                this.authRetries++;
                this.getAuthToken(callback);
            } else {
                throw "XHRRequestFailed: TIMEOUT";
            }
        }.bind(this);
        xhr.open("POST", this.apiPrefix + "auth/access_token", true);
        xhr.timeout = this.timeout;
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        postData = {
            grant_type: "client_credentials",
            client_id: "rfctkssparkle-1vxvz",
            client_secret: "TOIVn8wO3obEoxeJPyd"
        };
        xhr.send(this.generateRequestString(postData));    
    };
    
    //Checks if token is expired.
    this.isTokenExpired = function () {
        if (this.authToken.expires <= (Math.floor(Date.now() / 1000))) {
            return true;
        } else {
            return false;
        }
    };
    
    //Tries to renew token, callback will ALWAYS execute with valid token.
    this.renewToken = function (callback) {
        if (this.isTokenExpired()) {
            this.getAuthToken(callback);
        } else {
            this.ready = true;
            callback();
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
        // To simulate function overloading. =/
        try {
            if (!(method.toUpperCase() === "POST" || method.toUpperCase() === "GET")) {
                throw "InvalidRequestMethodException";
            }
            if (method.toUpperCase() === "GET" && typeof requestData === 'function') {
                callback = requestData;
                requestData = undefined;
            }
            if (method.toUpperCase() === "POST" && !(typeof requestData === 'object')) {
                throw "InvalidPostDataException";
            }
        } catch (err) {
            callback(false,err);
        }
        
        //If the API is not ready (E.g. renewing auth token), queue the request to be processed later.
        if (!this.ready) {
            var context = {
                env: this,
                method: method,
                urlSuffix: urlSuffix,
                requestData: requestData,
                callback: callback
            };
            this.pendingRequests.push(function () {
                this.env.apiRequest.call(this.env, this.method, this.urlSuffix, this.requestData, this.callback);
            }.bind(context));
            return;
        }
        
        var xhr = new XMLHttpRequest();
        //Callback to process state changes.
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200 && typeof callback === 'function') {
                callback(true, JSON.parse(xhr.responseText));
            } else {
                if (xhr.status === 401) {
                    this.apiRequest(method, urlSuffix, requestData, callback);
                }
                else {
                    callback(false, "reqfailed", xhr);
                }
            }
        }.bind(this);
        
        xhr.ontimeout = function () {
            callback(false,"timeout");
        };
        
        //Renew the token if required, pass rest of the function as a callback to the renewToken method.
        this.renewToken(function () {
            switch (method) {
                    case "GET":
                        xhr.open(method.toUpperCase(), this.apiPrefix + urlSuffix + '?' + this.generateRequestString(requestData) , true);
                        xhr.timeout = this.timeout;
                        xhr.setRequestHeader("Authorization", this.authToken.access_token);
                        xhr.send();
                        break;
                    case "POST":
                        xhr.open(method.toUpperCase(), this.apiPrefix + this.apiPath, true);
                        xhr.timeout = this.timeout;
                        xhr.setRequestHeader("Authorization", this.authToken.access_token);
                        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                        xhr.send(this.generateRequestString(requestData));
                        break;
                }
        }.bind(this));
    };
    
    // API REQUEST METHODS START HERE
     
    this.getGenres = function (callback) {
        this.apiRequest("GET", "genre_list", callback);
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
        this.apiRequest("GET", urlSuffix, callback);
    };
    
    this.anime.browse = function (options, callback) {
        this.apiRequest("GET", "browse/anime", options, callback);
    };
    
    this.anime.search = function (query, callback) {
        var urlSuffix = "anime/search/" + encodeURIComponent(query);
        return this.apiRequest("GET", urlSuffix, callback);
    };
    
    
    //Initialize object
    this.init = function () {
        if (this.initialized) {
            return;
        }
        var apiReady = function () {
            var event = new CustomEvent('AnilistAPIReady');
            document.dispatchEvent(event);
            this.executeQueue();
        }.bind(this);
        
        if(typeof(Storage) !== "undefined") {
            this.authToken = JSON.parse(sessionStorage.getItem("anilist.api.authtoken"));
            try {
                this.renewToken(apiReady);
            } catch(err) {
                this.getAuthToken(apiReady);
            }
        } else {
            this.getAuthToken(apiReady);
        }
    };
}