function generateRequestString(postData) {
    var postString = "";
    for(var key in postData) {
        postString = postString.concat(key+'='+encodeURIComponent(postData[key])+'&');
    }
    return postString.substring(0, postString.length - 1);
}