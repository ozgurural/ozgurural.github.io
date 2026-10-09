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

var hiddenCount = 0;

function setNavOpen(open) {
  $hlinks.toggleClass('hidden', !open);
  $btn.toggleClass('close', open).attr('aria-expanded', String(open));
}

// Lay the bar out from scratch on every call: every item back in the bar and
// no menu button, and only if that overflows, the button and as few items
// folded into it as it takes. The original kept the widths it had seen and
// always measured against the room left beside the button, so a bar that
// would fit whole once the button was gone never got its last item back.
// The items' own widths: the list itself stretches to fill the bar, so its
// box says how much room there is, not how much the items need.
function itemsWidth() {
  var w = 0;
  $vlinks.children().each(function () { w += $(this).outerWidth(); });
  return w;
}

function updateNav() {

  while ($hlinks.children().length > 0) {
    if ($vlinks_persist_tail.length > 0) {
      $hlinks.children().first().insertBefore($vlinks_persist_tail);
    } else {
      $hlinks.children().first().appendTo($vlinks);
    }
  }
  $btn.addClass('hidden');
  hiddenCount = 0;

  if (itemsWidth() > $nav.width()) {
    $btn.removeClass('hidden');
    var availableSpace = $nav.width() - $btn.outerWidth() - 12;
    while (itemsWidth() > availableSpace && $vlinks.children('*:not(.persist)').length > 0) {
      $vlinks.children('*:not(.persist)').last().prependTo($hlinks);
      hiddenCount++;
    }
  } else {
    setNavOpen(false);
  }

  // Keep counter updated
  $btn.attr("count", hiddenCount);

  // update masthead height and the body/sidebar top padding
  var mastheadHeight = $('.masthead').height();
  $('body').css('padding-top', mastheadHeight + 'px');
  // a sticky author card stops under the bar (_components.scss); only a card
  // fixed to the window needs the bar's height as padding
  document.documentElement.style.setProperty('--masthead-h', mastheadHeight + 'px');
  var $side = $(".sidebar");
  if (window.innerWidth < 1024 || $side.css("position") !== "fixed") {
    $side.css("padding-top", "");
  } else {
    $side.css("padding-top", mastheadHeight + "px");
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
