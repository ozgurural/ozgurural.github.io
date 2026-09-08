/* ==========================================================================
   Various functions that we want to use within the template
   ========================================================================== */

/* The site is dark only. head/custom.html sets data-theme="dark" on the root
   element before first paint, which is what actually decides the theme; this
   is only the belt to that braces, re-asserting it once jQuery is up in case
   anything cleared the attribute.

   What used to live here was the upstream theme machinery: a three-state
   setting in localStorage, a computed-theme resolver falling back to the OS
   preference, an OS-preference change listener, and a toggle. All of it was
   already inert (setTheme had been rewritten to ignore its argument and force
   dark) but it still ran: two localStorage reads and a matchMedia listener on
   every page load, for a value nothing consumed. Its last real consumer was
   plotly-blocks.js, which asked determineComputedTheme() which chart palette
   to use and could get back "light" on a dark-only site; that file now carries
   its own dark palette and asks nothing. The selectors the old code touched
   (#theme-icon, #theme-toggle) have matched nothing since the toggle came out
   of the masthead. */
let setTheme = () => {
  $("html").attr("data-theme", "dark");
};

/* Plotly rendering for ```plotly markdown blocks lives in
   /assets/js/plotly-blocks.js, included by scripts.html ONLY on pages that
   actually contain such a block. Bundling Plotly here cost 4.5 MB on every
   page — and the ES `import` it used broke this entire bundle as a classic
   script. Keep this file import/export-free. */

/* ==========================================================================
   Actions that should occur when the page has been fully loaded
   ========================================================================== */

$(document).ready(function () {
  // SCSS SETTINGS - These should be the same as the settings in the relevant files 
  const scssLarge = 925;          // pixels, from /_sass/_themes.scss
  const scssMastheadHeight = 70;  // pixels, from the current theme (e.g., /_sass/theme/_default.scss)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  setTheme();



  // Enable the sticky footer
  var bumpIt = function () {
    $("body").css("padding-bottom", "0");
    $("body").css("margin-bottom", $(".page__footer").outerHeight(true));
  }
  $(window).resize(function () {
    didResize = true;
  });
  setInterval(function () {
    if (didResize) {
      didResize = false;
      bumpIt();
    }}, 250);
  var didResize = false;
  bumpIt();

  // FitVids init
  fitvids();

  // Follow menu drop down
  $(".author__urls-wrapper button").on("click", function () {
    $(".author__urls").fadeToggle("fast", function () { });
    $(".author__urls-wrapper button").toggleClass("open");
  });

  // Restore the follow menu if toggled on a window resize
  jQuery(window).on('resize', function () {
    if ($('.author__urls.social-icons').css('display') == 'none' && $(window).width() >= scssLarge) {
      $(".author__urls").css('display', 'block')
    }
  });

  // Init smooth scroll, this needs to be slightly more than then fixed masthead height
  $("a").smoothScroll({
    offset: -scssMastheadHeight,
    preventDefault: false,
    beforeScroll: function (options) { options.speed = reducedMotion.matches ? 0 : 400; },
  });

  // 1. Copy to Clipboard Button for Code Blocks
  $('div.highlighter-rouge').each(function() {
    var $codeBlock = $(this);
    var $button = $('<button type="button" class="ep-copy-btn" aria-label="Copy code" title="Copy code"><i class="fas fa-copy" aria-hidden="true"></i></button>');
    var $status = $('<span class="screen-reader-text" role="status"></span>');
    var resetTimer;
    
    $button.on('click', function() {
      var codeText = $codeBlock.find('code').text();
      clearTimeout(resetTimer);
      $button.prop('disabled', true);
      $status.text('');
      Promise.resolve().then(function () {
        if (!navigator.clipboard) throw new Error('Clipboard unavailable');
        return navigator.clipboard.writeText(codeText);
      }).then(function() {
        $button.html('<i class="fas fa-check" aria-hidden="true"></i>').addClass('copied');
        $status.text('Code copied.');
        $button.attr('aria-label', 'Code copied');
      }).catch(function () {
        $button.text('Copy failed');
        $button.attr('aria-label', 'Copy failed. Select the code and copy it manually.');
        $status.text('Could not copy. Select the code and copy it manually.');
      }).then(function () {
        $button.prop('disabled', false);
        resetTimer = setTimeout(function() {
          $button.html('<i class="fas fa-copy" aria-hidden="true"></i>');
          $button.removeClass('copied').attr('aria-label', 'Copy code');
        }, 3000);
      });
    });
    
    $codeBlock.prepend($button, $status);
  });

  // 2. Reading Progress Bar
  if ($('.page__content').length > 0) {
    var $progressBar = $('<div class="ep-progress-bar"></div>');
    $('body').prepend($progressBar);
    
    $(window).on('scroll', function() {
      var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var scrolled = height > 0 ? Math.min(100, Math.max(0, winScroll / height * 100)) : 0;
      $progressBar.css('width', scrolled + '%');
    });
  }

  // 3. Smooth Scroll Animations (Fade-in-up)
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    var observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
    var fadeObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('ep-fade-in-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    
    $('.lab-card, .ep-stats > li, .archive__item').each(function() {
      $(this).addClass('ep-fade-in');
      fadeObserver.observe(this);
    });
  }

  // 5. Back to Top Button
  var $backToTop = $('<button type="button" class="ep-back-to-top" tabindex="-1" aria-hidden="true" aria-label="Back to top" title="Back to top"><i class="fas fa-arrow-up" aria-hidden="true"></i></button>');
  $('body').append($backToTop);
  
  $(window).on('scroll', function() {
    if ($(this).scrollTop() > 600) {
      $backToTop.addClass('visible').attr({'tabindex': '0', 'aria-hidden': 'false'});
    } else {
      $backToTop.removeClass('visible').attr({'tabindex': '-1', 'aria-hidden': 'true'});
    }
  });
  
  $backToTop.on('click', function() {
    var main = document.querySelector('main, #main');
    if (main) { main.setAttribute('tabindex', '-1'); main.focus({preventScroll: true}); }
    window.scrollTo({top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth'});
    return false;
  });
  // Native modal dialogs make the background inert and provide Escape handling.
  // Only advertise zoom when it is available, including for keyboard visitors.
  if (typeof HTMLDialogElement !== 'undefined') {
    $('.page__content img').not('a img, .no-lightbox, [alt=""], [role="button"]').each(function () {
      var $img = $(this);
      if ($img.width() < 100) return;
      $img.addClass('ep-zoomable').attr({role: 'button', tabindex: '0',
        'aria-haspopup': 'dialog', 'aria-label': 'Enlarge image: ' + ($img.attr('alt') || 'Figure')});
      function openLightbox() {
        var $overlay = $('<dialog class="ep-lightbox-overlay" aria-label="Enlarged image"></dialog>');
        var $close = $('<button type="button" class="ep-lightbox-close" aria-label="Close enlarged image">Close</button>');
        var $clone = $img.clone().removeClass('ep-zoomable').addClass('ep-lightbox-img')
          .removeAttr('id role tabindex aria-haspopup aria-label');
        $overlay.append($clone, $close).appendTo('body');
        document.body.classList.add('lightbox-open');
        $overlay.on('close', function () {
          document.body.classList.remove('lightbox-open');
          $overlay.remove();
          $img[0].focus({preventScroll: true});
        });
        $close.on('click', function () { $overlay[0].close(); });
        $overlay.on('click', function (event) {
          if (event.target === $overlay[0]) $overlay[0].close();
        });
        $overlay[0].showModal();
        $close[0].focus();
      }
      $img.on('click', openLightbox).on('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openLightbox(); }
      });
    });
  }

});
