/*
* Greedy Navigation
*
* http://codepen.io/lukejacksonn/pen/PwmwWV
*
*/

var $nav = $('#site-nav');
var $btn = $('#site-nav button');
var $vlinks = $('#site-nav .visible-links');
var $vlinks_persist_tail = $vlinks.children("*.persist.tail");
var $hlinks = $('#site-nav .hidden-links');

var breaks = [];

function setNavOpen(open) {
  $hlinks.toggleClass('hidden', !open);
  $btn.toggleClass('close', open).attr('aria-expanded', String(open));
}

function updateNav() {

  var availableSpace = $btn.hasClass('hidden') ? $nav.width() : $nav.width() - $btn.width() - 30;

  // The visible list is overflowing the nav
  if ($vlinks.width() > availableSpace) {

    while ($vlinks.width() > availableSpace && $vlinks.children("*:not(.persist)").length > 0) {
      // Record the width of the list
      breaks.push($vlinks.width());

      // Move item to the hidden list
      $vlinks.children("*:not(.persist)").last().prependTo($hlinks);

      availableSpace = $btn.hasClass("hidden") ? $nav.width() : $nav.width() - $btn.width() - 30;

      // Show the dropdown btn
      $btn.removeClass("hidden");
    }

    // The visible list is not overflowing
  } else {

    // There is space for another item in the nav
    while (breaks.length > 0 && availableSpace > breaks[breaks.length - 1]) {
      // Move the item to the visible list
      if ($vlinks_persist_tail.children().length > 0) {
        $hlinks.children().first().insertBefore($vlinks_persist_tail);
      } else {
        $hlinks.children().first().appendTo($vlinks);
      }
      breaks.pop();
    }

    // Hide the dropdown btn if hidden list is empty
    if (breaks.length < 1) {
      $btn.addClass('hidden');
      setNavOpen(false);
    }
  }

  // Keep counter updated
  $btn.attr("count", breaks.length);

  // update masthead height and the body/sidebar top padding
  var mastheadHeight = $('.masthead').height();
  $('body').css('padding-top', mastheadHeight + 'px');
  if (window.innerWidth < 1024) {
    $(".sidebar").css("padding-top", "");
  } else {
    $(".sidebar").css("padding-top", mastheadHeight + "px");
  }

}

// Window listeners

$(window).on('resize', function () {
  updateNav();
});
if (screen.orientation && screen.orientation.addEventListener) {
  screen.orientation.addEventListener('change', updateNav);
}
// Webfont metrics can change which links fit after the initial layout.
if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateNav);

$btn.on('click', function () {
  setNavOpen($hlinks.hasClass('hidden'));
});

$nav.on('keydown', function (event) {
  if (event.key === 'Escape' && !$hlinks.hasClass('hidden')) {
    setNavOpen(false);
    $btn.trigger('focus');
  }
});
$(document).on('click', function (event) {
  if (!$nav[0] || !$nav[0].contains(event.target)) setNavOpen(false);
});
$nav.on('focusout', function () {
  setTimeout(function () {
    if ($nav[0] && !$nav[0].contains(document.activeElement)) setNavOpen(false);
  }, 0);
});

updateNav();
