
function setupScroller( target ) {
	
	var target = $(target),
		handle   = $("#scrollbar-handle"), 
		track    = $("#scrollbar-track"),
		heights  = [];

	$("a",target).click(function(){
		var a = $(this);
		var t = a.position().top + ( (a.height() - handle.height()) /2 );
		console.log(t);
		a.siblings().removeClass("selected");
		a.addClass("selected");
		handle.animate({ top : t });
	}).each(function(){
		var a = $(this);
		heights.push( [ a, a.position().top, (a.position().top+a.height()) ] );
	});

	var grid_y = Math.round(target.height() / target.children().length);
	
	console.log(heights);

	handle.draggable({
		grid : [0, grid_y ],
		axis : 'y',
		containment : 'parent',
		stop : function() {
			var handle_pos = $(this).position().top;
			for (var i=0; i < heights.length; i++) {
				if (handle_pos >= heights[i][1] && handle_pos <= heights[i][2]) {
					heights[i][0].click();
				}
			}
		}
	});

}


$(function(){
	
	var slides = $(".main_slide");

  slides.
  	each(function(idx, elem){
  		$(this).css("top", $(this).outerHeight()*idx );
  	});

  $(".main_slides").height( slides.outerHeight()*slides.length );

  var main = $("#main").parallax({
    targets : ".parallax_target"
  });

  $(".bttn").click(function(){
    main.parallax("scroll_to", $(this).attr("data-target"), true);
    return false;
  });

  setupScroller("#nav");

});