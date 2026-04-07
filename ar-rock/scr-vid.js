const SETTINGS = {
  // UI:
  pages: [
    {
      id: 'Home',
      title: 'Suzisoft'
    },
    {
      id: 'Video'
    },
  ],
  titleSep: '/',
  pageBgColor: 'transparent',//'rgba(255, 255, 255, 0.6)',
  ellipseMarginsPx: {
    top: 64,
    left: 64,
    right: 64,
    bottom: 64
  },

  maxAspectRatio: 2,//16/9,
  fadeDuration: 400, // in ms
  openPageDuration: 400,

  // Handtracking:
  NNsPaths: ['neuralNets/NN_NAV_21.json'],//['neuralNets/NN_NAV_RP_9.json','neuralNets/NN_NAV_RB_9.json'],
  GLSLCursorDownColor: 'vec3(1.0, 0.2, 0.1)',
  threshold: 0.97,
  thresholdSignal: 0.2,
  delayBeforeFirstClick: 1500,
  pointerDistancesPalmSide: [0.30, 0.25], // relative to hand detection window. hysteresis
  pointerDistancesBackSide: [0.35, 0.3],

  // debug flags:
  debugAlwaysShowChangeCam: false
};

const _states = {
  notLoaded: -1,
  loading: 0,
  idle: 1,
  busy: 2
};
let _state = _states.notLoaded;
let _openPageId = 'Home';
let _title0 = null;
let _domElementUnderPointer = null, _domClickedElement = null;

const _audio = {
  context: null,
  mouseDown: {
    source: null,
    buffer: null
  },
  mouseUp: {
    source: null,
    buffer: null
  }
};


/* Entry point */
function main(){
  _state = _states.loading;
  _title0 = document.title;

  set_layout();
  set_hoverEffects();
  bind_links();
  set_nav();
  $(window).on('resize orientationchange', function(){
    set_layout();
  }).on('popstate', function(){
    update_pageFromCurrentURL();
  });

  _state = _states.idle;
  init_handTracking();
  update_pageFromCurrentURL();
} 


function update_pageFromCurrentURL(){
  let pageIdToOpen = 'Home';
  const urlParsed = window.location.href.split('#');
  if (urlParsed.length >= 2){
    urlPageId = urlParsed.pop();
    if (urlPageId){
      pageIdToOpen = urlPageId;
    }
  }

  if (pageIdToOpen === 'Home'){
    close_page();
  } else {
    open_page(pageIdToOpen);
  }
}


function set_layout(){
  set_menu();
}


function set_menu(){
  // compute ellipse parameters:
  const margins = SETTINGS.ellipseMarginsPx;
  
  // drawable area size:
  const sx = window.innerWidth - margins.left - margins.right;
  const sy = window.innerHeight - margins.top - margins.bottom;

  // center coordinates:
  const cx = margins.left + sx * 0.5;
  const cy = margins.top + sy * 0.5;

  // ellipse half axis lengths:
  let a = sx * 0.5;
  let b = sy * 0.5;

  // decrease ellipse size to avoid too stretched ellipses:
  if (a > b && a / b > SETTINGS.maxAspectRatio){ // landscape mode
    a = b * SETTINGS.maxAspectRatio;
  } else if (b > a && b / a > SETTINGS.maxAspectRatio) { // portrait mode
    b = a * SETTINGS.maxAspectRatio;
  }

  // compute layout parameter:
  const tiles = $('.tile').toArray();
  const tilesCount = tiles.length;
  const perimeter = Math.PI * (3*(a+b) - Math.sqrt((3*a+b) * (3*b+a)));
  const d = perimeter / tilesCount// curviligne distance between 2 tiles

  // position tiles along an ellipse with equidistant curviligne absisse:
  const samplesCount = 1000;
  let xPrev = -1, yPrev = -1, l = 0, tileIndex = 0;
  for (let i=0; i<samplesCount; ++i){
    const theta = 2 * Math.PI * i / samplesCount;
    x = cx + a * Math.sin(theta);
    y = cy + b * Math.cos(theta);

    if (i!==0){
      const dx = x - xPrev, dy = y - yPrev;
      const dl = Math.sqrt(dx*dx + dy*dy);
      l += dl;
      if (l/d > tileIndex){
        $(tiles[tileIndex]).css({
          top: y.toString() + 'px',
          left: x.toString() + 'px'
        });
        ++tileIndex;
      }
    }
    xPrev = x, yPrev = y;
  }
}


function set_cameraOnUI(){
  $('.noticeAllowCamera').fadeOut(SETTINGS.fadeDuration, function(){
    $('.noticeCameraOn').fadeIn(SETTINGS.fadeDuration);
  });
}


function bind_links(){
  $('#enableCamera').click(function(){
    if (_state !== _states.idle){
      return;
    }
    HandTrackerNavigationHelper.enable_camera();
  });
  $('#changeCamera').click(function(){
    if (_state !== _states.idle){
      return;
    }
    _state = _states.busy;
    HandTrackerNavigationHelper.change_camera().then(function(){
      _state = _states.idle;
    });
  });
  $('#pageMiddleBack').click(function(){
    if (_state !== _states.idle){
      return;
    }
    close_page()
  });
}


function set_hoverEffects(){
  $('a.notice, .pageContent a, .tile, .pageMiddleBackIcon, #pageMiddleBack').hover(function(){ // handler In
    $(this).addClass('hovering');
  }, function(){ // handler out
    $(this).removeClass('hovering');
  });
}


function set_nav(){
  SETTINGS.pages.forEach(function(pageParams){
    const pageId = pageParams.id;
    const jqTile = $('#tile' + pageId);
    const jqPage = $('#page' + pageId);

    jqTile.click(function(){
      open_page(pageId);
    });
    jqTile.css({
      transition:'background ' + SETTINGS.openPageDuration.toString() + 'ms'
    });
  });
}


function get_pageParams(pageId){
  return SETTINGS.pages.find(function(pageParams){
    return (pageParams.id === pageId);
  });
}


function get_pageTitle(pageParams){
  return (pageParams.title) ? pageParams.title : pageParams.id;
}


function open_page(pageId){
  if (_state !== _states.idle || (_openPageId && _openPageId === pageId)){
    return;
  }
  console.log('INFO in main.js: open_page ' + pageId);
  const pageParams = get_pageParams(pageId);
  if (!pageParams){
    return;
  }

  _state = _states.busy;

  // jquery selectors:
  const pageIdSelector = '#page' + pageId;
  const tileSelector = '#tile' + pageId;
  const fadeSelector = '.banner,.notice,#ellipseMenu :not(' + tileSelector  + ')';

  // navigation management:
  _openPageId = pageId;
  const pageTitle = get_pageTitle(pageParams);
  window.history.pushState({pageId: pageId}, pageTitle, '#' + pageId);

  const titlePrefix = (pageTitle.indexOf(_title0) === -1) ? _title0 + SETTINGS.titleSep : '';
  document.title = titlePrefix + pageTitle;

  jqTile = $(tileSelector);
  const cssToState = {
    top: 0,
    left: 0,
    width: window.innerWidth,
    height: window.innerHeight,
    marginTop: 0,
    marginLeft: 0,
    borderRadius: 0
  };

  // save CSS initial state:
  const cssFromState = {};
  for (let cssProp in cssToState){
    cssFromState[cssProp] = jqTile.css(cssProp);
  }
  $.data(jqTile.get(0), 'cssFromState', cssFromState);
  
  // trigger background animation:
  jqTile.css({
    backgroundColor: SETTINGS.pageBgColor
  });
  $(fadeSelector).fadeOut(SETTINGS.openPageDuration);
  
  jqTile.animate(cssToState, SETTINGS.openPageDuration, function(){
    jqTile.css({
      pointerEvents: 'none'
    });

    // page animation:
    // show page container and only the current page:
    $('.pageContainer').css({display: 'flex'});
    //$('.pageContent:not(' + pageIdSelector + ')').hide();
    const jqPage = $(pageIdSelector).show();
    $('.page').css('display', 'flex').hide().fadeIn(SETTINGS.fadeDuration, function(){

      $('.pageContainer').css({'backgroundColor': SETTINGS.pageBgColor});

      // 페이지가 완전히 보인 후 비디오 재생
      const video = document.querySelector(pageIdSelector + ' video');
      if (video) {
        video.play().catch(function(e){
          console.log('Video play failed:', e);
        });
      }

      _state = _states.idle;
    });
    
  }); // end white background anim
}


function close_page(){
  if (_state !== _states.idle || !_openPageId || _openPageId === 'Home'){
    return;
  }
  _state = _states.busy;

  // navigation management:
  window.history.pushState({pageId: 'Home'}, _title0, '#Home');
  
  // jquery selectors:
  const pageIdSelector = '#page' + _openPageId;
  const tileSelector = '#tile' + _openPageId;
  const fadeSelector = '.banner,' + pageIdSelector + ',.notice,#ellipseMenu :not(' + tileSelector  + ')';
  
  // restore tile original state:
  jqTile = $(tileSelector);
  const cssFromState = $.data(jqTile.get(0), 'cssFromState');
  
  // show content:
  //$('.content').show();
  $('.pageContainer').css({'backgroundColor': 'transparent'});

  // trigger animation:
  $(fadeSelector).fadeIn(SETTINGS.fadeDuration);
  $('.page').fadeOut(SETTINGS.fadeDuration, function(){

    // 페이지에 비디오가 있으면 일시 정지
    const video = $('.pageContent video').get(0);
    if (video) {
      video.pause();
      video.currentTime = 0;
    }

    jqTile.css({
      backgroundColor: 'transparent',
      pointerEvents: 'auto'
    });
    jqTile.animate(cssFromState, SETTINGS.openPageDuration, function(){
      $('.pageContainer, .pageContent').hide();
      _openPageId = 'Home';
      document.title = _title0;
      _state = _states.idle;
    });
  });
}


function set_audio(){
  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    _audio.context = new AudioContext();
    load_sound('sounds/mouseUp.mp3').then(function(audioBuffer){
      _audio.mouseUp.buffer = audioBuffer;
    });
    load_sound('sounds/mouseDown.mp3').then(function(audioBuffer){
      _audio.mouseDown.buffer = audioBuffer;
    });
  }
  catch(e) {
    console.log('WARNING: No webaudio');
  }
}


function load_sound(url) {
  return new Promise(function(accept, reject){
    const request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    request.onload = function() {
      _audio.context.decodeAudioData(request.response, function(buffer) {
        accept(buffer);
      }, reject);
    }
    request.send();
  }); //end returned promise
}


function play_audio(audio){
  if (!audio.buffer){
    return;
  }
  if (audio.source){
    audio.source.stop();
    audio.source.disconnect(_audio.context.destination);
  }
  audio.source = _audio.context.createBufferSource();
  audio.source.buffer = audio.buffer;
  audio.source.connect(_audio.context.destination);
  audio.source.start(0);
}


function init_handTracking(){
  const dpr = Math.min(2, (window.devicePixelRatio) ? window.devicePixelRatio : 1);
  let idealWidth = window.innerWidth*dpr, idealHeight = window.innerHeight*dpr;
  const maxDim = Math.max(idealWidth, idealHeight);
  const scale = Math.min(1, 1024/maxDim);
  idealWidth = Math.round(idealWidth * scale), idealHeight = Math.round(idealHeight * scale);  
  console.log('Requested video resolution: ', idealWidth, ' * ', idealHeight);
  
  HandTrackerNavigationHelper.init({
    canvasVideo: $('#handNavigationCanvasVideo').get(0),
    canvasPointer: $('#handNavigationCanvasPointer').get(0),
    NNsPaths: SETTINGS.NNsPaths,
    threshold: SETTINGS.threshold,
    thresholdSignal: SETTINGS.thresholdSignal,
    thresholdSwitchNN: SETTINGS.thresholdSwitchNN,
    delayBeforeFirstClick: SETTINGS.delayBeforeFirstClick,
    videoSettings: {
      idealWidth: Math.max(idealHeight, idealWidth),
      idealHeight: Math.min(idealHeight, idealWidth),
    },
    callbackReady: function(err, objs){
      if (err){
        console.log('INFO in main.js: err = ', err);
        if (err === 'WEBCAM_UNAVAILABLE'){
          $('.noticeAllowCamera').show();
        }
        return;
      }

      // correct a bug on iOS when the website is open in a new tab
      // (space between canvas and video on top of the page):
      HandTrackerNavigationHelper.resize();
      
      $('.noticeAllowCamera').hide();
      $('.noticeCameraOn').fadeIn(SETTINGS.fadeDuration);
      
      if (objs.isMobileOrTablet || SETTINGS.debugAlwaysShowChangeCam){
        $('#changeCamera').show();
      } else {
        $('#changeCamera').hide();
      }

      set_audio();
    },

    // video display:
    GLSLChangeVideoColor: '\
      float grayScale = dot(color.rgb, vec3(0.299, 0.587, 0.114));\n\
      grayScale *= smoothstep(0.0, 0.33, vUV.y); //black bottom gradient\n\
      color =  vec4(grayScale * vec3(0., 0.5, 1.), 1.0);\n\
    ',

    // pointer display:
    landmarks: [
      "index0", "index1", "index2", "index3",
      "thumb2", "thumb1", "thumb0"
    ],
    lines: [
      ["index0", "index1"], ["index1", "index2"], ["index2", "index3"],
      ["index3", "thumb2"], ["thumb2", "thumb1"], ["thumb1", "thumb0"]
    ],
    lineWidth: 2,
    pointRadius: 12,
    GLSLPointerLineColor: 'color = mix(vec3(0.0, 1.0, 1.0), ' + SETTINGS.GLSLCursorDownColor + ', vIsPointer * downFactor);',
    GLSLPointerPointColor: 'color = mix(vec3(0.0, 1.0, 1.0), ' + SETTINGS.GLSLCursorDownColor + ', vIsPointer * downFactor);',
    GLSLPointerCursorColor: 'color = mix(vec3(0.0, 1.0, 1.0), ' + SETTINGS.GLSLCursorDownColor + ', downFactor);',
    cursorAngle: 30, // in degrees
    cursorRecess: 0.33,
    cursorSizePx: 32,

    marginTop: 8,// in px
    marginLeft: 120,
    marginRight: 120,
    marginBottom: 128,

    // pointer logic:
    pointerLandmarks: ['index0', 'thumb0'],
    pointerDistancesPalmSide: SETTINGS.pointerDistancesPalmSide, // relative to hand detection window. hysteresis
    pointerDistancesBackSide: SETTINGS.pointerDistancesBackSide,
    pointerHeatDistance: 0.05, // pointer start changing color
    pointerBlendHandRadiusRange: [0.8, 2], //relative to pointer size. start and stop blending around the pointer

    onPointerDown: function(x, y){ //TODO: bind to UI
      play_audio(_audio.mouseDown);
      const domElement = document.elementFromPoint(x, y);
      _domClickedElement = domElement;
      if (!domElement){
        return;
      }
      $(domElement).click();
    },
    onPointerUp: function(x, y){
      play_audio(_audio.mouseUp);
      _domClickedElement = null;
    },
    onPointerMove: function(x, y, isDown){
      const domElement = document.elementFromPoint(x, y);
      
      if (isDown){
        // if the user has not been very accurate to click on a tiny link:
        if (domElement && _domClickedElement !== domElement){
          _domClickedElement = domElement;
          $(domElement).click();
        }
        if (_domElementUnderPointer){
          $(_domElementUnderPointer).mouseleave();
          _domElementUnderPointer = null;
        }
        return;
      }

      // simulate hover effect:
      if (domElement === _domElementUnderPointer){
        return;
      }
      if (!domElement && _domElementUnderPointer){
        $(_domElementUnderPointer).mouseleave();
        _domElementUnderPointer = null;
        return;
      }
      if (_domElementUnderPointer !== domElement){
        if (_domElementUnderPointer){
          $(_domElementUnderPointer).mouseleave();
        }
        $(domElement).mouseenter();
        _domElementUnderPointer = domElement;
      }
    }
  });
}


window.addEventListener('load', main);