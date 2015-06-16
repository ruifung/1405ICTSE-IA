/*jslint ignore: start*/
Polymer({
    animeLookup: {},
    pendingAnimeLoad: 0,
    
    is: 'body-view',
    properties: {
        loading: {
            type: Boolean,
            notify: true
        },
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
        _animesPreFilter: {
            type: Array,
            value: [],
            notify: true
        },  
        _animes: {
            type: Array,
            value: [],
            notify: true
        }
    },
    
    listeners: {
        "anime-item-click": "onAnimeEvent",
        "anime-preload": "onAnimeEvent",
        "anime-load": "onAnimeEvent",
        "anime-loaded": "onAnimeEvent",
        "anime-allloaded": "onAnimeEvent"
    },
    
    ready: function() {
        this.sidebarSelected = "options";
        this._registerButtonHandlers();
        this._updateAnimeView({status:"Currently Airing",full_page:true,year:2015});
    },
    
    logEvent: function(e) {
        console.log(e);
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
    
    _toggleProgressBar: function(toggle) {
        this.toggleClass("transparent",!toggle,this.$.progressBar);
    },

    _onSidebarButtonClick: function(button) {
        setTimeout(function() {
            this.sidebarSelected = button;
        }.bind(this),0);
    },

    //Main View data

    //UPDATE THE ANIME VIEW.
    _updateAnimeView: function(options) {
        this.animeLookup = {};
        this.currentAnimeView = options;
        this.pendingAnimeLoad = 0;
        this.fire("anime-preload");
        alAPI.anime.browse(options,function(status, data) {
            if (status) {
                this._getFullAnimeData(data);
                this.fire("anime-load");
            }
        }.bind(this));
    },
    //RETRIEVE FULL ANIME MODEL.
    _getFullAnimeData: function(data) {
        var animeID;
        while (data.length > 0) {
            animeID = data.shift().id;
            this.pendingAnimeLoad++;
            alAPI.anime.get("", animeID, function(status, data) {
                if (status) {
                    if (data.description === null) {
                        data.description = "No description available."
                    }
                    this._animeDataLoaded(data);
                } else {
                    this.pendingAnimeLoad--;
                }
            }.bind(this));
        }
    },
    //Perform tasks when all results loaded.
    _animeDataLoaded: function(anime) {
        this.push("_animesPreFilter",anime);
        this.animeLookup[anime.id] = anime;
        this.pendingAnimeLoad--;
        this.fire("anime-loaded");
        if (this.pendingAnimeLoad === 0) {
            this.fire("anime-allloaded");
        }
    },
    
    _filter: function(val,ind,arr) {
        if (this.filterAdult) {
            if (val.adult) {
                return false;
            }
        }

        return true;
    },
    
    onAnimeEvent: function(e) {
        switch(e.type) {
            case "click":
                this.$.details.open(this.animeLookup[e.detail.id]);
                break;
            case "anime-preload":
                this.$.progressBar.indeterminate = true;
                this._toggleProgressBar(true);
                break;
            case "anime-load":
                var progressBar = this.$.progressBar;
                progressBar.max = this.pendingAnimeLoad;
                progressBar.indeterminate = false;
                break;
            case "anime-loaded":
                this.$.progressBar.value++;
                break;
            case "anime-allloaded":
                var animeTemp = this._animesPreFilter.filter(this._filter,this);
                
                this._toggleProgressBar(false);
                this.splice("_animes",0,this._animes.length);
                this.splice.apply(this,["_animes",0,0].concat(animeTemp));
                break;
        }        
    },
    
});
/*jslint ignore: end*/