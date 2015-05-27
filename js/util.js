function generatePostString(postData) {
    var postString = "";
    for(var key in postData) {
        postString = postString.concat("&"+key+"="+encodeURIComponent(postData[key]));
    }
    return postString;
}