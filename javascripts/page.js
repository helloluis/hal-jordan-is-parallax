function Scroller () {
  
  this.scrolling  = false;

  this.initialize = function(nav, target) {

    this.nav      = $(nav);
    this.target   = $(target);
    this.handle   = $("#scrollbar-handle");
    this.track    = $("#scrollbar-track");
    this.heights  = [];
    this.anchors  = $("a", nav);
    this.target_h = this.calculate_targetable_height();

    var scr = this;
  
    scr.anchors.each(function(){

      var a = $(this);
      scr.heights.push( [ a, a.position().top, (a.position().top+a.height()) ] );

      a.click(function(){
        scr.anchors.removeClass("selected");
        a.addClass("selected");
      });

    });

    var grid_y = Math.round(scr.nav.height()/scr.nav.children().length);
    
    console.log(scr.heights);

    // scr.handle.draggable({
    //   grid : [0, grid_y ],
    //   axis : 'y',
    //   containment : 'parent',
    //   stop : function() {
    //     var handle_pos = $(this).position().top;
    //     for (var i=0; i < scr.heights.length; i++) {
    //       if (handle_pos >= scr.heights[i][1] && handle_pos <= scr.heights[i][2]) {
    //         scr.heights[i][0].click();
    //       }
    //     }
    //   }
    // });

    $(window).scroll(function(){
      
      // scr.anchors.removeClass("selected");
        
      var win    = $(this),
        win_s    = win.scrollTop(),
        win_h    = win.height(),
        body_h   = $('body').height(),
        track_h  = scr.track.height(),
        target_h = scr.target_h;
    
      var new_t  = win_s * (track_h/(target_h - (win_h/2)));
      
      console.log( new_t, win_s, track_h, target_h, win_h );

      if (new_t > track_h) { new_t = track_h; }

      scr.handle.css({ top : new_t });

      // for (var i=0; i < scr.heights.length; i++) {
      //   if (new_t >= scr.heights[i][1] && new_t <= scr.heights[i][2]) {
      //     scr.handle.css({ top : scr.heights[i][1] + ((scr.heights[i][2]-scr.heights[i][1])/2) });
      //     scr.heights[i][0].addClass("selected");
      //   }
      // }
      

    });
  };

  this.move_to = function( a ) {
    
    var scr = this;

    if (scr.scrolling===false) {
      console.log('move_to');
      scr.scrolling = true;
      var t = a.position().top + ( (a.height()-scr.handle.height())/2 );

      scr.anchors.removeClass("selected");
      a.addClass("selected");

      scr.handle.stop(true,true).animate({ top : t }, { 
        duration : 500, 
        complete : function(){
          scr.scrolling = false;
        }
      });
    }

  };

  this.calculate_targetable_height = function() {
    
    var slide = $(".main_slide", this.target),
      targetable_h = ((slide.outerHeight() + parseInt(slide.css('margin-bottom'))) * (slide.length-1)) + (slide.outerHeight() - $(".slideshow").height());
    
    console.log(targetable_h);
    return targetable_h;

  };
}


$(function(){
	
  var slides 	    = $(".main_slide"), 
  	slides_list   = $(".main_slides"),
  	parallax_cont = $("#main"),
  	anchors       = $(".bttn"),
    scroller      = new Scroller;

  slides.each(function(idx){
  	$(this).css("top", $(this).outerHeight()*idx );
  });

  slides_list.height( slides.outerHeight()*slides.length );

  parallax_cont.parallax({ targets : ".parallax_target" });

  anchors.click(function(){
    parallax_cont.parallax("scroll_to", $(this).attr("href"), true);
    return false;
  });

  scroller.initialize("#nav", ".main_slides");

  if (document.location.hash.length>1) {
    $(".bttn_" + document.location.hash.replace("#","")).click();
  }

  // this is for IE compatibility
  $("body").height( parallax_cont.outerHeight() );

});
