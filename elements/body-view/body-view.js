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
        pendingFilters: {
            type: Boolean,
            notify: true,
            value: false,
            observer: "_pendingFiltersObserver"
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
        mainPanelView: {
            type: String,
            value: "animeView",
            observer: "_mainPanelObserver"
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
        "anime-item-click": "_onAnimeEvent",
        "anime-preload": "_onAnimeEvent",
        "anime-load": "_onAnimeEvent",
        "anime-loaded": "_onAnimeEvent",
        "anime-allloaded": "_onAnimeEvent",
        "main-view-change": "_changeViewEvent",
        "notify-toast": "_notifyToastEvent"
    },
    
    ready: function() {
        this.sidebarSelected = "options";
        this._updateAnimeView({status:"Currently Airing",full_page:true,year:2015});
    },
    
    logEvent: function(e) {
        console.log(e);
    },

    //Observers
    _drawerViewObserver: function(newV) {
        if (newV === "options") {
            this.toggleClass("hidden",true,this.$.backBtn);
        } else {
            this.toggleClass("hidden",false,this.$.backBtn);
        }
    },
    _mainPanelObserver: function(newV,oldV) {
        if(this.$[oldV] !== undefined) {
            if(typeof this.$[oldV].viewChanged === "function") {
                this.$[oldV].viewChanged(this.$[newV],this.$[oldV]);
            }
        }
        if(!!this.$[newV].viewChanged) {
            this.$[newV].viewChanged(this.$[newV],this.$[oldV]);
        }
        
    },
    _drawerStateObserver: function(newV) {
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
            this.pendingFilters = true;
        }.bind(this);
        newV.observer = new ArrayObserver(newV);
        newV.observer.open(onSelectionChanged);
    },
    _pendingFiltersObserver: function(newV) {
        if (newV) {
            this.$.reloadBtn.icon = "check";
        } else {
            this.$.reloadBtn.icon = "refresh";
        }
    },

    //HELPER FUNCTIONS
    _toggleSidebarButtons: function(toggle) {
        this.$.genreBtn.disabled = !toggle;
        this.$.seasonsBtn.disabled = !toggle;
        this.$.sortBtn.disabled = !toggle;
        this.$.showFavBtn.disabled = !toggle;
        this.$.feedbackBtn.disabled = !toggle;
    },
    
    _toggleProgressBar: function(toggle) {
        this.loading = toggle;
        this.toggleClass("transparent",!toggle,this.$.progressBar);
    },
    
    //AIO BUTTON HANDLER.
    
    _changeViewEvent: function(e) {
        if(this.$.mainSelector.selected === "feedbackView") {
            this.toggleClass("hidden",true,this.$.backBtn);
            this._toggleSidebarButtons(true);
        }
        this.$.mainSelector.selected = e.detail.view;
    },
    
    _notifyToastEvent: function(e) {
        if (this.$.toastNotify.visible) {
            this.$.toastNofity.hide();
        }
        var originalDuration = this.$.toastNotify.duration;
        if(!e.detail.text) {
            return;
        }
        if(!!e.detail.duration) {
            this.$.toastNotify.duration = e.detail.duration;
        }
        this.$.toastNotify.text = e.detail.text;
        setTimeout(function(){
            this.$.toastNotify.text = "";
            this.$.toastNotify.duration = originalDuration;
        }.bind(this),this.$.toastNotify.duration+100)
        this.$.toastNotify.toggle();
    },
    
    _onButtonClick: function(e) {
        setTimeout(function() {
            switch(e.target.domHost.id) {
                case "backBtn":
                    this.sidebarSelected = "options";
                    if(this.$.mainSelector.selected === "feedbackView") {
                        this.toggleClass("hidden",true,this.$.backBtn);
                        this.$.mainSelector.selected = "animeView";
                        this._toggleSidebarButtons(true);
                    } else {
                        this.sidebarSelected = "options";
                    }
                    break;
                case "genreBtn":
                    this.sidebarSelected = "genres";
                    break;
                case "seasonsBtn":
                    this.sidebarSelected = "seasons";
                    break;
                case "sortBtn":
                    break;
                case "showFavBtn":
                    break;
                case "feedbackBtn":
                    this.$.mainSelector.selected = "feedbackView";
                    this.toggleClass("hidden",false,this.$.backBtn);
                    this._toggleSidebarButtons(false);
                    break;
                case "reloadBtn":
                    var options = this.currentAnimeView;
                    if (this.pendingFilters) {
                        options = this._filterRequestOptions(options);
                        this.pendingFilters = false;
                    }
                    this._updateAnimeView(options);
                    break;
                case "clearBtn":
                    
                    break;
            }
        }.bind(this),0);
    },
    
    //AIO ANIME RELATED EVENT LISTENER.
    _onAnimeEvent: function(e) {
        switch(e.type) {
            case "anime-item-click":
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
                _updateAnimesArray(animeTemp);
                this.fire("notify-toast",{text:"Anime Loaded!"});
                break;
        }        
    },
    //Main View data
    
    _filterRequestOptions: function(reqOptions) {
        return reqOptions;
    },
    
    _updateAnimesArray: function(newArr) {
        //Use different sorters based on config.
        newArr.sort(_animeSorter.name);
        this.splice.apply(this,["_animes",0,this._animes.length].concat(newArr));
    },
    
    _animeSorter : {
        name: function(arg1, arg2) {
            return 0;
        },
        genre: function(arg1, arg2) {
            return 0;
        },
        nextep: function(arg1, arg2) {
            return 0;
        },
        
    },
    
    //UPDATE THE ANIME VIEW.
    _updateAnimeView: function(options) {
        this.animeLookup = {};
        this.splice("_animesPreFilter",0,this._animesPreFilter.length);
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
        if (!!this.animeLookup[anime.id] === false) {
            this.animeLookup[anime.id] = anime;
            this.push("_animesPreFilter",anime);
        }
        this.fire("anime-loaded");
        this.pendingAnimeLoad--;
        if (this.pendingAnimeLoad === 0) {
            this.fire("anime-allloaded");
        }
    },
    
    //ANIME FILTER FUNCTION.
    _filter: function(val) {
        var keep = true;
        if (this.filterAdult) {
            if (val.adult) {
                return false;
            }
        }
        if (this.selectedGenres.length !== 0) {
            keep = false;
            for (var i = 0; i < this.selectedGenres.length; i++) {
                if (val.genres.indexOf(this.selectedGenres[i]) !== -1 && !keep) {
                    keep = true;
                    break;
                }
            }
        }
        return keep;
    },    
});
/*jslint ignore: end*/