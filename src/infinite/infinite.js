
	_initInfinite: function () {
		var el = this.options.infiniteElements;

		this.infiniteElements = typeof el == 'string' ? document.querySelectorAll(el) : el;
		this.infiniteLength = this.infiniteElements.length;
		this.infiniteMaster = this.infiniteElements[0];
		this.infiniteElementHeight = utils.getRect(this.infiniteMaster).height;
		this.infiniteHeight = this.infiniteLength * this.infiniteElementHeight;
        
        //Other infinite scrollers that update with this one. Usefull for linked scroll scenarios.
        this.infiniteParticipants = this.options.infiniteParticipants || [];

		this.options.cacheSize = this.options.cacheSize || 1000;
		this.infiniteCacheBuffer = Math.round(this.options.cacheSize / 4);

		//this.infiniteCache = {};
		this._loadDataSlice(0, this.options.cacheSize);

		this.on('refresh', function () {
			var elementsPerPage = Math.ceil(this.wrapperHeight / this.infiniteElementHeight);
			this.infiniteUpperBufferSize = Math.floor((this.infiniteLength - elementsPerPage) / 2);
			this.reorderInfinite();
		});

		this.on('scroll', this.reorderInfinite);
	},
    
        
    _loadDataSlice: function(start, length, reload) {
        var _this = this;
        var callback = function(data) {
            _this.updateCache(start, data);
            _this.reorderInfinite(true);
            
            for(var i = 0; i < _this.infiniteParticipants.length; i++ ) {                
                _this.infiniteParticipants[i].updateCache(start, data);
                _this.infiniteParticipants[i].reorderInfinite(true);                
            }            
        };
        _this.updateCache(start, length);
        _this.options.dataset.call(this, start, this.options.cacheSize, callback);                            
    },

    //Reloads the data for the cache at the current position, or optionally resets x and/or y positions
    reload: function(resetX, resetY) {
        this.scrollTo(resetX ? 0 : this.x, resetY ? 0 : this.y);               
        for( var i = 0; i < this.infiniteParticipants.length; i++ ) {            
            this.infiniteParticipants[i].scrollTo(resetX ? 0 : this.infiniteParticipants[i].x, resetY ? 0 : this.infiniteParticipants[i].y);                    
        }
               
        this._loadDataSlice(resetY ? 0 : Math.max(this.cachePhase * this.infiniteCacheBuffer - this.infiniteCacheBuffer), this.options.cacheSize);              
    },
        


	// TO-DO: clean up the mess^2
	reorderInfinite: function (updatePhase) {
		var center = -this.y + this.wrapperHeight / 2;

		var minorPhase = Math.max(Math.floor(-this.y / this.infiniteElementHeight) - this.infiniteUpperBufferSize, 0),
			majorPhase = Math.floor(minorPhase / this.infiniteLength),
			phase = minorPhase - majorPhase * this.infiniteLength;

		var top = 0;
		var i = 0;
		var update = [];

		//var cachePhase = Math.floor((minorPhase + this.infiniteLength / 2) / this.infiniteCacheBuffer);
		var cachePhase = Math.floor(minorPhase / this.infiniteCacheBuffer);

		while ( i < this.infiniteLength ) {
			top = i * this.infiniteElementHeight + majorPhase * this.infiniteHeight;

			if ( phase > i ) {
				top += this.infiniteElementHeight * this.infiniteLength;
			}

			if ( this.infiniteElements[i]._top !== top || updatePhase) {
				this.infiniteElements[i]._phase = top / this.infiniteElementHeight;

				if ( this.infiniteElements[i]._phase < this.options.infiniteLimit ) {
					this.infiniteElements[i]._top = top;
					if ( this.options.infiniteUseTransform ) {
						this.infiniteElements[i].style[utils.style.transform] = 'translate(0, ' + top + 'px)' + this.translateZ;
					} else {
						this.infiniteElements[i].style.top = top + 'px';
					}
					update.push(this.infiniteElements[i]);
				}
			}

			i++;
		}
        
		if ( !updatePhase && this.cachePhase != cachePhase && (cachePhase === 0 || minorPhase - this.infiniteCacheBuffer > 0) ) {
			 this._loadDataSlice(Math.max(cachePhase * this.infiniteCacheBuffer - this.infiniteCacheBuffer, 0), this.options.cacheSize);
		}

		this.cachePhase = cachePhase;

		this.updateContent(updatePhase ? this.infiniteElements : update);
	},


	updateContent: function (els) {
		if ( this.infiniteCache === undefined ) {
			return;
		}
        
		for ( var i = 0, l = els.length; i < l; i++ ) {            
            this.options.dataFiller.call(this, els[i], this.infiniteCache[els[i]._phase], els[i]._phase >= this.options.infiniteLimit);
		}
	},

	updateCache: function (start, data) {
		var firstRun = this.infiniteCache === undefined;
        
		this.infiniteCache = {};

		for ( var i = 0, l = data.length; i < l; i++ ) {
			this.infiniteCache[start++] = data[i];
		}

		if ( firstRun ) {
			this.updateContent(this.infiniteElements);
		}

	},

