function Scroller (target) {
  
  this.scrolling  = false;

  this.initialize = function(target) {

    this.target   = $(target);
    this.handle   = $("#scrollbar-handle");
    this.track    = $("#scrollbar-track");
    this.heights  = [];
    this.anchors  = $("a", target);

    var scr = this;
  
    scr.anchors.each(function(){

      var a = $(this);
      scr.heights.push( [ a, a.position().top, (a.position().top+a.height()) ] );

      a.click(function(){
        scr.move_to( a );
      });

    });

    var grid_y = Math.round(scr.target.height()/scr.target.children().length);
    
    console.log(scr.heights);

    scr.handle.draggable({
      grid : [0, grid_y ],
      axis : 'y',
      containment : 'parent',
      stop : function() {
        var handle_pos = $(this).position().top;
        for (var i=0; i < scr.heights.length; i++) {
          if (handle_pos >= scr.heights[i][1] && handle_pos <= scr.heights[i][2]) {
            scr.heights[i][0].click();
          }
        }
      }
    });

    $(window).scroll(function(){
      if (document.location.hash.length>1) {
        var hash = document.location.hash.replace("#","");
        scr.move_to( $("a[href='#" + hash + "']", scr.target) );
      }
    });
  };

  this.move_to = function( a ) {
    
    var scr = this;

    if (scr.scrolling===false) {

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

  }
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

  scroller.initialize("#nav");

  // this is for IE compatibility
  $("body").height( parallax_cont.outerHeight() );

});
