function SpaceScroller () {
  
  this.scrolling   = false;
 
  this.initialize  = function(nav, targets) {
 
    this.nav       = $(nav);
    this.targets   = $(targets);
    this.scroller  = $('body');
    this.handle    = $("#scrollbar-handle");
    this.track     = $("#scrollbar-track");
    this.hotspots  = [];
    this.anchors   = $("a", nav);
    this.target_h  = this.calculate_targetable_height();
    this.track_h   = this.track.height();
    this.track_t   = this.track.position().top;
    this.handle_h  = this.handle.height();
    this.win_h     = $(window).height();
    this.body_h    = $('body').height();
    this.current   = 0;
    this.automated = false;

    var scr = this;
    
    scr.calculate_hotspots();

    var track_scrolling = function(){
      if (scr.automated===false) {
        var win = $(this),
          win_s = win.scrollTop();
      
        var adjusted  = ((win_s * (scr.track_h/scr.target_h)) - scr.handle_h) + scr.track_t;
        if (adjusted < 0) { adjusted = 0; }

        scr.handle.css({ top : adjusted });

        var i = scr.is_on_hotspot( adjusted );

        if ( i!==false ) {
          scr.anchors.removeClass("selected");
          $(scr.anchors.get(i)).addClass("selected");
        } else {
          scr.anchors.removeClass("selected");
        }
      }
    };

    $(window).scroll( $.throttle(200, track_scrolling) );

  };

  this.scroll_to = function( elem ) {
    
    var scr     = this,
        elem    = $("#"+(elem.replace("#",""))),
        elem_id = elem.attr("id"),
        anchor  = $("a[data-target='" + elem_id + "']", this.nav);
    
    scr.automated = true;

    $(this.scroller).animate({ scrollTop : elem.offset().top - 50 },500,function(){
      document.location.hash = "/" + elem_id;
      scr.anchors.removeClass("selected");
      anchor.addClass("selected");
      scr.move_to( anchor );
    });

  };

  this.is_on_hotspot = function( pos ) {
    
    var scr = this;
    pos = (pos + scr.handle_h) - scr.track_t;
    
    for (var i=0; i<this.hotspots.length; i++) {
      if (pos >= (this.hotspots[i].at - scr.handle_h) && pos <= this.hotspots[i].at + this.hotspots[i].ah) {
        return i;
        break;
      }
    }

    return false;

  };

  this.move_to = function( a ) {
    
    var scr = this,    
          t = a.position().top - scr.handle_h + scr.track_t;

    if (t < 0) { t = 0; }
    //console.log(t);
    scr.handle.animate({ top : t }, 200, function(){
      scr.automated = false;
    });

  };

  this.calculate_hotspots = function() {
    
    var scr = this;

    scr.anchors.each(function(idx){

      var tt = $(scr.targets.get(idx)).offset().top;
      if (tt > Math.abs(scr.body_h - scr.win_h)) {
        tt  = scr.win_h;
      }

      var a = $(this),
         t  = a.attr("data-target"),
         at = a.position().top, 
         ah = a.height(),
         tt = tt > 0 ? tt : 0,
         th = $(scr.targets.get(idx)).height();

      scr.hotspots.push({ t : t, at : at, ah : ah, tt : tt, th : th });

    });

  };

  this.calculate_targetable_height = function() {
    
    var slide = $(".main_slide", this.target), 
      targetable_h = (slide.outerHeight()+parseInt(slide.css('margin-bottom'))) * slide.length - ($(window).height());
    return targetable_h;

  };
}


$(function(){
	
  var slides 	    = $(".main_slide"), 
  	slides_list   = $(".main_slides"),
  	parallax_cont = $("body"),
  	anchors       = $(".bttn"),
    scroller      = new SpaceScroller;
  
  parallax_cont.parallax({ 
    background_position : true, 
    targets    : ".parallax_target", 
    highest_z  : 80, 
    lowest_z   : 1, 
    force_height : 3000 
  });

  scroller.initialize("#nav", ".main_slide");

  anchors.click(function(){
    scroller.scroll_to( $(this).attr("href").replace(/[\/]+/gi,"") );
    return false;
  });

  if (document.location.hash.length>1) {
    $(".bttn_" + document.location.hash.replace(/[\/\#]+/gi,"")).click();
  }

  var positionSlidesAndNav = function() {

    var slides    = $(".main_slides"), 
         nav      = $("#sidebar"), 
         win_w    = $(window).width(), 
         slides_w = slides.outerWidth(), 
         nav_w    = nav.outerWidth(),
         footer   = $("#footer");

    if (win_w > slides_w + nav_w) {
      var left = (win_w - (slides_w+nav_w+50))/2;
      slides.css("left", left);
      footer.css("left", left);
      nav.css("left", left + slides_w + 50);
    } else {
      slides.css("left", "0px");
      nav.css("left", slides_w + 50);
    }

  }

  positionSlidesAndNav();

  $(window).smartresize( positionSlidesAndNav );


});
