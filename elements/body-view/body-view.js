/*jslint ignore: start*/
Polymer({
    animeLookup: {},
    
    is: 'body-view',
    properties: {
        sidebarSelected: {
            type: String,
            notify: true,
            observer: "_drawerViewObserver"
        },
        selectedGenres: {
            type: Array,
            notify: true,
            observer: "_genresObserver"
        },
        drawerPanelView: {
            type: String,
            observer: "_drawerStateObserver"
        },
        filterAdult: {
            type: Boolean,
            value: true,
            notify: true
        },
        _animes: {
            type: Array,
            value: [],
            notify: true
        }
    },
    
    listeners: {
        "anime-item-click": "onAnimeClick"
    },
    
    ready: function() {
        this.sidebarSelected = "options";
        this._registerButtonHandlers();
        this._updateAnimeView({status:"Currently Airing",full_page:true,year:2015});
    },


    //Observers
    _drawerViewObserver: function(newV, oldV) {
        if (newV === "options") {
            this.toggleClass("hidden",true,this.$.backBtn);
        } else {
            this.toggleClass("hidden",false,this.$.backBtn);
        }
    },
    _drawerStateObserver: function(newV,oldV) {
        switch(newV) {
            case "drawer":

                break;
            case "main":
                if (this.$.drawerPanel.narrow) {
                    this.sidebarSelected = "options";
                }
                break;
        }

    },
    _genresObserver: function(newV,oldV) {
        if (typeof oldV !== 'undefined') {
            oldV.observer.close();
        }
        var onSelectionChanged = function(changes) {
        }.bind(this);
        newV.observer = new ArrayObserver(newV);
        newV.observer.open(onSelectionChanged);
    },

    //Event Handling
    _registerButtonHandlers: function() {
        this.$.backBtn.onclick = function() {
            this._onSidebarButtonClick("options");
            if(this.$.mainSelector.selected === "feedbackView") {
                this.toggleClass("hidden",true,this.$.backBtn);
                this.$.mainSelector.selected = "animeView";
                this._toggleSidebarButtons(true);
            } else {
                this._onSidebarButtonClick("options");
            }
        }.bind(this);
        
        this.$.genreButton.onclick = function() {
            this._onSidebarButtonClick("genres");
        }.bind(this);
        
        this.$.seasonsButton.onclick = function() {
            this._onSidebarButtonClick("seasons");
        }.bind(this);
        
        this.$.feedbackBtn.onclick = function() {
            this.$.mainSelector.selected = "feedbackView";
            this.toggleClass("hidden",false,this.$.backBtn);
            this._toggleSidebarButtons(false);
        }.bind(this);
    },
    
    _toggleSidebarButtons: function(toggle) {
        this.$.genreButton.disabled = !toggle;
        this.$.seasonsButton.disabled = !toggle;
        this.$.sortButton.disabled = !toggle;
        this.$.showFavBtn.disabled = !toggle;
        this.$.feedbackBtn.disabled = !toggle;
    },

    _onSidebarButtonClick: function(button) {
        setTimeout(function() {
            this.sidebarSelected = button;
        }.bind(this),0);
    },

    //Main View data

    //Called to filter anime list.
    _filter: function(data) {
        if(!this.filterAdult) {
            return true;
        }
        return !data.adult;
    },

    //UPDATE THE ANIME VIEW.
    _updateAnimeView: function(options) {
        this.animeLookup = {};
        alAPI.anime.browse(options,function(status, data) {
            if (status) {
                this._getFullAnimeData(data);
            }
        }.bind(this));
    },
    //RETRIEVE FULL ANIME MODEL.
    _getFullAnimeData: function(data) {
        var animeID;
        while (data.length > 0) {
            animeID = data.shift().id;
            alAPI.anime.get("", animeID, function(status, data) {
                if (status) {
                    if(this._filter(data)) {
                        if (data.description === null) {
                            data.description = "No description available."
                        }
                        this.push("_animes",data);
                        this.animeLookup[data.id] = data;
                    }
                }
            }.bind(this));
        }
    },
    
    onAnimeClick: function(e) {
        this.$.details.open(this.animeLookup[e.detail.id]);
    }
    
});
/*jslint ignore: end*/