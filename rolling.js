"use strict"

function rolling( selector, args ) {
    this.selector = selector;
    this._init();

    return this;
}
function isIE() { //ie?  
    if (!!window.ActiveXObject || "ActiveXObject" in window)  
        return true;  
    else  
        return false;  
}

$.fn.css_transform = function( x, full ) {
    var _offset = full / this.length;
    for ( var i = 0; i < this.length; i++ ) {
        var _x = x + _offset * i;
        $( this[i] )
            .css( '-webkit-transform', 'translate( ' + _x + 'px, 0px ) translateZ( 0px )' )
            .css( '-moz-transform', 'translate( ' + _x + 'px, 0px )' )
            .css( '-o-transform', 'translate( ' + _x + 'px, 0px )' )
            .css( 'transform', 'translate( ' + _x + 'px, 0px )' );
    }

    if ( isIE() ) {
        for ( var i = 0; i < this.length; i++ ) {
            var _idx = parseInt( this.get(i).id ) - 1;
            var _x = x + _offset * i;
            var _y = this.get(i).clientHeight * _idx * -1;
            this.get(i).style.msTransform = 'translate(' + _x + 'px,' + _y + 'px)';
        }
    }
    
    return this;
}

$.fn.css_transition_duration = function( ms ) {
    this
        .css( '-webkit-transition-duration', ms + 'ms' )
        .css( '-moz-transition-duration', ms + 'ms' )
        .css( '-o-transition-duration', ms + 'ms' )
        .css( 'transition-duration', ms + 'ms' )
        ;
    for ( var i = 0; i < this.length; i++ ) {
        this.get(i).msTransitionDuration = ms + 'ms';
    }

    return this;
}

rolling.prototype = {
    selector : null,
    index : 0,
    cols : 1,
    auto : false,
    full : 0,
    options : {
        interval: 3000,
    },

    _init : function() {
        var _this = this;
        var _self = $( this.selector );
        var _inner = _self.find( '.rolling-inner' );
        var _items = _inner.find( '.item' );
        var _indicators = _self.find( '.rolling-indicators' );
        var _control_left = _self.find( '.rolling-control .left' );
        var _control_right = _self.find( '.rolling-control .right' );

        _this.cols = _self.data( 'rolling-cols' ) ? parseInt( _self.data( 'rolling-cols' ) ) : 1;
        _this.auto = _self.is( '[data-rolling-auto]' ) ? parseInt( _self.data( 'rolling-auto' ) ) : 1;

        var _w = 0;
        var _item_w = _self.outerWidth() / _this.cols;

        _items.each( function( i ) {
            _w += $( this ).outerWidth();

            $( this )
                .css( 'width', _self.outerWidth() / _this.cols )
                .css( 'left', -i * ( _self.outerWidth() / _this.cols ) + 'px' )
                ;

            if ( $( this ).is( '.active' ) ) {
                _this.index = i;
            }
        } );

        _this.full = _self.width();

        _items.filter( ':not(.active)' ).css_transform( -_w, _this.full );
 
        _inner
            .css( 'width', _w )
            ;

        if ( _items.length < 2 ) {
            return;
        }

        _this._get_item_group( _this._prev_group() )
            .css_transform( -_self.outerWidth(), _this.full )
            .css_transition_duration( 300 )
            ;
        _this._get_item_group( _this._curr() )
            .css_transform( 0, _this.full )
            .css_transition_duration( 300 )
            ;
        _this._get_item_group( _this._next_group() )
            .css_transform( _self.outerWidth(), _this.full )
            .css_transition_duration( 0 )
            ;

        if ( isIE() ) {
            for ( var idx = 0; idx < _items.length; idx++ ) {
                _items[idx].style.left = '0';
                _items[idx].style.msTransitionDuration = '0ms';
                _items[idx].style.msTransform = 'translate(' + ( _self.outerWidth() / _this.cols * idx ) + 'px,'+(_items[idx].clientHeight * idx * -1)+'px)';
            }
        }

        _this._rolling();

        var _temp_item;
        var _moved = false;     // 点击时会触发start和end但不会触发move，需要以此作为判断

        var _o_left, _left;
        _self
            .on( 'touchstart', function( e ) {
                _this._touch();
                var touch = e.originalEvent.touches[0];

                _o_left = _left = touch.pageX;
                e.stopPropagation();
            } )
            .on( 'touchmove', function( e ) {
                _moved = true;
                var touch = e.originalEvent.touches[0];

                var _m = touch.pageX - _o_left;

                if ( _items.length === -1 ) {
 
                    _temp_item
                        .css_transform( -_self.outerWidth() + _m, _this.full )
                        .css_transition_duration( 0 )
                        ;

                    _this._get_item_group( _this._curr() )
                        .css_transform( _m, _this.full )
                        .css_transition_duration( 0 )
                        ;

                    _this._get_item_group( _this._next_group() )
                        .css_transform( _self.outerWidth() + _m, _this.full )
                        .css_transition_duration( 0 )
                        ;

                    _left = touch.pageX;
                } else {
                 
                    _this._get_item_group( _this._prev_group() )
                        .css_transform( -_self.outerWidth() + _m, _this.full )
                        .css_transition_duration( 0 )
                        ;

                    _this._get_item_group( _this._curr() )
                        .css_transform( _m, _this.full )
                        .css_transition_duration( 0 )
                        ;

                    _this._get_item_group( _this._next_group() )
                        .css_transform( _self.outerWidth() + _m, _this.full )
                        .css_transition_duration( 0 )
                        ;

                    _left = touch.pageX;
                }
            } )
            .on( 'touchend', function( e ) {
                var _len = 0;
                if ( _this.cols === 1 ) {
                    // 当每组只有一张图片时滚动阈值为10像素
                    if ( ( _o_left - _left ) > 10 ) {
                        _len = 1;
                    }
                    if ( ( _o_left - _left ) < -10 ) {
                        _len = -1;
                    }
                } else {
                    // 当每组有多张图片时滚动阈值为半个图片宽度
                    _len = Math.round( ( _o_left - _left ) / _item_w );
                }
                if ( _moved ) {
                    _this._move( _len, function() {
                        _this._rolling();
                    } );
                }
                _moved = false;
            } );

        _indicators.find( 'li' ).off( 'click' ).on( 'click', function( e ) {
            e.preventDefault();
            e.stopPropagation();
            _this._touch();
            _this._goto( parseInt( $( this ).data( 'slide-to' ) ), function() {
                _this._rolling();
            } );
        } );

        _control_left.off( 'click' ).on( 'click', function( e ) {
            e.preventDefault();
            e.stopPropagation();
            _this._touch();
            _this._move_group( 'prev', function() {
                _this._rolling();
            } );
            return false;
        } );

        _control_right.off( 'click' ).on( 'click', function( e ) {
            e.preventDefault();
            e.stopPropagation();
            _this._touch();
            _this._move_group( 'next', function() {
                _this._rolling();
            } );
            return false;
        } );
    },

    _prev_group : function() {
        return this._prev( this.cols );
    },

    _next_group : function() {
        return this._next( this.cols );
    },

    _curr : function() {
        return this.index;
    },

    _prev : function( len ) {
        var _this = this;
        var _self = $( this.selector );
        var _inner = _self.find( '.rolling-inner' );
        var _items = _inner.find( '.item' );
        var _len = len ? len : 1;

        if ( ( _this.index - _len ) < 0 ) {
            return _items.length + ( _this.index - _len );
        } else {
            return _this.index - _len;
        }
    },

    _next : function( len ) {
        var _this = this;
        var _self = $( this.selector );
        var _inner = _self.find( '.rolling-inner' );
        var _items = _inner.find( '.item' );
        var _len = len ? len : 1;

        if ( ( _this.index + _len ) >= _items.length ) {
            return _this.index + _len - _items.length;
        } else {
            return _this.index + _len;
        }
    },

    _get_item_group : function( idx ) {
        var _this = this;
        var _self = $( this.selector );
        var _inner = _self.find( '.rolling-inner' );
        var _items = _inner.find( '.item' );

        var _filted = new jQuery();
        for ( var i = 0; i < _this.cols; i++ ) {
            if ( ( idx + i ) >= _items.length ) {
                _filted.push( _items.filter( ':eq(' + ( idx + i - _items.length ) + ')' ).get(0) );
            } else {
                _filted.push( _items.filter( ':eq(' + ( idx + i ) + ')' ).get(0) );
            }
        }

        return _filted;
    },
    
    _get_item : function( idx ) {
        var _this = this;
        var _self = $( this.selector );
        var _inner = _self.find( '.rolling-inner' );
        var _items = _inner.find( '.item' );

        return _items.filter( ':eq(' + idx + ')' );
    },

    _touch : function() {
        var _self = $( this.selector );
        var _inner = _self.find( '.rolling-inner' );
        var _items = _inner.find( '.item' );
        var _active = _items.filter( '.active' );

        clearInterval( this._ );
    },

    _rolling : function() {
        var _this = this;
        var _self = $( this.selector );
        var _inner = _self.find( '.rolling-inner' );
        var _items = _inner.find( '.item' );

        if ( _this.auto ) {
            this._ = setInterval( function() {
                _this._move_group( 'next' );
            }, this.options.interval );
        }
    },

    _move_group : function( pos, callback ) {
        var _this = this;
        var _self = $( this.selector );
        var _inner = _self.find( '.rolling-inner' );
        var _items = _inner.find( '.item' );
        var _indicators = _self.find( '.rolling-indicators' );

        var _old = _this.index;

        if ( pos === 'prev' ) {
            _this.index = _this._prev_group();
            _this._get_item_group( _this._curr() )
                .css_transform( -_self.outerWidth(), _this.full )

            if ( _this._prev_group() !== _this._next_group() ) {
                _this._get_item_group( _this._prev_group() )
                    .css_transition_duration( 0 )
                    .css_transform( -_self.outerWidth(), _this.full )
            }
            // 延迟0秒用以刷新上面的设置
            setTimeout( function() {
                _this._get_item_group( _this._curr() )
                    .css_transition_duration( 300 )
                    .css_transform( 0, _this.full )
                _this._get_item_group( _this._next_group() )
                    .css_transition_duration( 300 )
                    .css_transform( _self.outerWidth(), _this.full )
            }, 0 );
        } else if ( pos === 'next' ) {
            _this.index = _this._next_group();
            _this._get_item_group( _this._curr() )
                .css_transform( _self.outerWidth(), _this.full )

            setTimeout( function() {
                _this._get_item_group( _this._prev_group() )
                    .css_transition_duration( 300 )
                    .css_transform( -_self.outerWidth(), _this.full )
                _this._get_item_group( _this._curr() )
                    .css_transition_duration( 300 )
                    .css_transform( 0, _this.full )
            }, 0 );

            // 延迟0秒用以刷新上面的设置
            if ( _this._prev_group() !== _this._next_group() ) {
                _this._get_item_group( _this._next_group() )
                    .css_transition_duration( 0 )
                    .css_transform( _self.outerWidth(), _this.full )
            }
        } else {
            _this._get_item_group( _this._prev_group() )
                .css_transition_duration( 300 )
                .css_transform( -_self.outerWidth(), _this.full )
                ;
            _this._get_item_group( _this._curr() )
                .css_transition_duration( 300 )
                .css_transform( 0, _this.full )
                ;
            _this._get_item_group( _this._next_group() )
                .css_transition_duration( 0 )
                .css_transform( _self.outerWidth(), _this.full )
                ;
        }

        // 滚动结束后删除所有延时
        setTimeout( function() {
            _items
                .css_transition_duration( 0 )
        }, 300 );

        var _new = _this.index;

        if ( _new != _old ) {
            _self.trigger( 'rolling', [ _new, _old ] );
        }

        var ua = navigator.userAgent.toLowerCase();
        var fmatch = ua.match( /firefox\/([\d.]+)/ );
        var firefox_no = fmatch ? fmatch[1] : false;
        if ( firefox_no && firefox_no < 49 ) {
            // only firefox [mozilla lte 49.0]
            _items.css( '-moz-transform', 'translate( ' + ( _self.outerWidth() * _this.index * -1 ) + 'px, 0px )' );
        }

        _indicators
            .find( 'li' )
            .removeClass( 'active' );

        var _id = parseInt( _this._get_item( _this.index ).attr( 'id' ) ) - 1;

        _indicators
            .find( 'li[data-slide-to="' + _id + '"]' )
            .addClass( 'active' );

        if ( "undefined" !== typeof callback ) {
            callback.call( _this );
        }
    },
    
    _move : function( len, callback ) {
        var _this = this;
        var _self = $( this.selector );
        var _inner = _self.find( '.rolling-inner' );
        var _items = _inner.find( '.item' );
        var _indicators = _self.find( '.rolling-indicators' );
        var _old = _this.index;
        var _len = Math.abs( len );
        var _w = _self.outerWidth() / _this.cols * _len;
        var _full_w = _self.outerWidth();
       
        if ( len < 0 ) {
            _this.index = _this._prev( _len );
            
            // go;
            _this._get_item_group( _this._curr() )
                .css_transition_duration( 300 )
                .css_transform( 0, _this.full )
            _this._get_item_group( _this._next( _len ) )
                .css_transition_duration( 300 )
                .css_transform( _w, _this.full )

            if ( _len < _this.cols ) {
                _this._get_item( _this._prev() )
                    .css_transition_duration( 300 )
                    .css_transform( -( _w / _len ), _this.full )
            }
        } else if ( len > 0 ) {
            _this.index = _this._next( _len );

            _this._get_item_group( _this._curr() )
                .css_transition_duration( 300 )
                .css_transform( 0, _this.full )
            _this._get_item_group( _this._prev( _len ) )
                .css_transition_duration( 300 )
                .css_transform( -_w, _this.full )

            if ( _len < _this.cols ) {
                _this._get_item( _this._next( _this.cols ) )
                    .css_transition_duration( 300 )
                    .css_transform( _full_w, _this.full )
            }
        } else {
            _this._get_item_group( _this._curr() )
                .css_transition_duration( 300 )
                .css_transform( 0, _this.full )
            _this._get_item_group( _this._next_group() )
                .css_transition_duration( 300 )
                .css_transform( _full_w, _this.full )
            _this._get_item_group( _this._prev_group() )
                .css_transition_duration( 300 )
                .css_transform( -_full_w, _this.full )
        }
        var _new = _this.index;

        if ( _new != _old )
            _self.trigger( 'rolling', [ _new, _old ] );

        var ua = navigator.userAgent.toLowerCase();
        var fmatch = ua.match( /firefox\/([\d.]+)/ );
        var firefox_no = fmatch ? fmatch[1] : false;
        if ( firefox_no && firefox_no < 49 ) {
            // only firefox [mozilla lte 49.0]
            _items.css( '-moz-transform', 'translate( ' + ( _w * _this.index * -1 ) + 'px, 0px )' );
        }

        _indicators
            .find( 'li' )
            .removeClass( 'active' );

        var _id = parseInt( _this._get_item( _this.index ).attr( 'id' ) ) - 1;

        _indicators
            .find( 'li[data-slide-to="' + _id + '"]' )
            .addClass( 'active' );

        if ( "undefined" !== typeof callback ) {
            callback.call( _this );
        }
    },

    _goto : function( new_idx, callback ) {
        if ( new_idx === this.index )
            return;

        var _this = this;
        var _self = $( this.selector );
        var _inner = _self.find( '.rolling-inner' );
        var _items = _inner.find( '.item' );
        var _indicators = _self.find( '.rolling-indicators' );
        var len = new_idx - this.index;
        var _len = Math.abs( len );
        var _full_w = _self.outerWidth();
        var _w = _self.outerWidth() / _this.cols;

        if ( _len <= _this.cols ) {
            // 当目标图片和当前图片在同一组内

            _this.index = new_idx;

            _this._get_item_group( _this._curr() )
                .css_transition_duration( 300 )
                .css_transform( 0, _this.full )
            if ( len > 0 ) {
                _this._get_item_group( _this._next_group() )
                    .css_transition_duration( 0 )
                    .css_transform( _full_w, _this.full )
                _this._get_item_group( _this._prev_group() )
                    .css_transition_duration( 300 )
                    .css_transform( -_full_w, _this.full )
            }
            if ( len < 0 ) {
                _this._get_item_group( _this._next_group() )
                    .css_transition_duration( 300 )
                    .css_transform( _full_w, _this.full )
                _this._get_item_group( _this._prev_group() )
                    .css_transition_duration( 0 )
                    .css_transform( -_full_w, _this.full )
            }
        } else {
            // 当目标图片和当前图片不在同一组内
            var _old_idx = _this.index;
            _this.index = new_idx;

            if ( len < 0 ) {
                _this._get_item_group( _this._curr() )
                    .css_transition_duration( 0 )
                    .css_transform( -_full_w, _this.full )
            }
            if ( len > 0 ) {
                _this._get_item_group( _this._curr() )
                    .css_transition_duration( 0 )
                    .css_transform( _full_w, _this.full )
            }

            setTimeout( function() {
                if ( len < 0 ) {
                    _this._get_item_group( _old_idx )
                        .css_transition_duration( 300 )
                        .css_transform( _full_w, _this.full )
                    setTimeout( function() {
                        _this._get_item_group( _this._prev_group() )
                            .css_transition_duration( 0 )
                            .css_transform( -_full_w, _this.full )
                        _this._get_item_group( _this._next_group() )
                            .css_transition_duration( 0 )
                            .css_transform( _full_w, _this.full )
                    }, 300 );
                }
                if ( len > 0 ) {
                    _this._get_item_group( _old_idx )
                        .css_transition_duration( 300 )
                        .css_transform( -_full_w, _this.full )
                    setTimeout( function() {
                        _this._get_item_group( _this._prev_group() )
                            .css_transition_duration( 0 )
                            .css_transform( -_full_w, _this.full )
                        _this._get_item_group( _this._next_group() )
                            .css_transition_duration( 0 )
                            .css_transform( _full_w, _this.full )
                    }, 300 );
                }
                _this._get_item_group( _this._curr() )
                    .css_transition_duration( 300 )
                    .css_transform( 0, _this.full )
            }, 0 );
        }

        var ua = navigator.userAgent.toLowerCase();
        var fmatch = ua.match( /firefox\/([\d.]+)/ );
        var firefox_no = fmatch ? fmatch[1] : false;
        if ( firefox_no && firefox_no < 49 ) {
            // only firefox [mozilla lte 49.0]
            _items.css( '-moz-transform', 'translate( ' + ( _self.outerWidth() * _this.index * -1 ) + 'px, 0px )' );
        }
        
        _indicators
            .find( 'li' )
            .removeClass( 'active' );

        var _id = parseInt( _this._get_item( _this.index ).attr( 'id' ) ) - 1;

        _indicators
            .find( 'li[data-slide-to="' + _id + '"]' )
            .addClass( 'active' );

        if ( "undefined" !== typeof callback ) {
            callback.call( _this );
        }
    },
};

$.fn.jqrolling = function( args ) {
    $( this ).data( 'rolling', new rolling( this ) );
}

$( window ).on( 'load', function() {
    $( '#rolling-example-generic' ).jqrolling();
} );
