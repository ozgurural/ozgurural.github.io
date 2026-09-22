/* AI Meets the Deadline. All traces are the author's synthetic teaching model.
   Open research direction of the author, not yet published.
   No employer design, certification result, or measured model benchmark. */
(function () {
  'use strict';
  function boot() {
    if (!window.LabAnim || !window.DeadlineModel) return setTimeout(boot, 60);
    if (document.getElementById('det-film')) build();
    experiment();
  }
  var mono = "'JetBrains Mono', monospace", count = 0, pending = null;
  function lower(s, html, at) {
    if (pending && pending.s === s) s.fadeOut(pending.c, { at: at - 0.7, dur: 0.5 });
    var c = s.caption(html, { px: 0, py: 540, anchor: 'bottom-left', align: 'left', panel: true });
    s.fadeIn(c, { at: at, dur: 0.5 });
    s.audio('determinism_' + count++, at);
    pending = { s: s, c: c };
  }
  var C = { ink: '#ecf3ff', muted: '#a8b9d0', blue: '#58c4dd', green: '#83c167', red: '#fc6255', amber: '#fbbf24', purple: '#ac94ff' };
  function text(ctx, value, x, y, size, color, align) {
    ctx.font = '500 ' + (size || 18) + 'px ' + mono;
    ctx.fillStyle = color || C.ink; ctx.textAlign = align || 'left';
    ctx.fillText(value, x, y);
  }
  function line(ctx, x1,y1,x2,y2,color) {
    ctx.beginPath(); ctx.strokeStyle=color || C.blue; ctx.lineWidth=2;
    ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  }
  function head(ctx, title, note) {
    text(ctx,title,48,88,27,C.ink);
    text(ctx,note,48,119,14,C.muted);
  }
  function grid(ctx, rows, n, x,y,w,h) {
    // Six rows of sixty release slots. Colour is paired with labels/counters.
    var cw=w/60,ch=h/6;
    for(var i=0;i<360;i++) {
      ctx.fillStyle=i>=n?'#1a293e':rows[i].late?C.red:rows[i].fresh===false?C.amber:C.blue;
      ctx.globalAlpha=i>=n?0.5:0.95;
      ctx.fillRect(x+(i%60)*cw,y+Math.floor(i/60)*ch,cw-2,ch-3);
    }
    ctx.globalAlpha=1;
  }
  function compare(ctx,run,n,title,note) {
    head(ctx,title,note);
    var a=run.direct.slice(0,n),b=run.async.slice(0,n);
    text(ctx,'WAIT FOR INFERENCE',48,170,17,C.red);
    text(ctx,'ASYNCHRONOUS + ADMISSION',492,170,17,C.blue);
    grid(ctx,run.direct,n,48,193,414,102);grid(ctx,run.async,n,492,193,414,102);
    var ma=a.filter(function(r){return r.late;}).length,mb=b.filter(function(r){return r.late;}).length;
    var fresh=b.filter(function(r){return r.fresh;}).length;
    text(ctx,ma+' deadline misses',48,326,23,C.red);
    text(ctx,mb+' deadline misses',492,326,23,mb?C.red:C.blue);
    text(ctx,'360 jobs released over 6 simulated seconds',48,369,14,C.muted);
    text(ctx,'Fresh AI: '+fresh+' / '+n+' jobs',492,369,16,C.amber);
    text(ctx,'Cyan: on time | Red: late | Amber: fallback',48,399,13,C.muted);
  }
  function build() {
    var film=window.LabAnim.create('#det-film',{width:960,height:540});
    var normal=window.DeadlineModel.run({delay:80,ttl:150});
    film.scene('The model can wait. Can the system?',28,function(s){
      /* Two clocks on one time axis, read from the same model the page runs:
         the controller ticks every 16.67 ms whatever happens, while inference
         calls land at their own pace. The quantity that moves is how many
         ticks pass while a call is still out, so the one slow call is seen
         to span five of them rather than being described as "longer". */
      var WIN=700, X0=210, X1=912, ms=function(v){return X0+(X1-X0)*v/WIN;};
      var calls=normal.events.filter(function(e){return e.at<WIN;});
      s.canvas(function(t,ctx){
        head(ctx,'AI MEETS THE DEADLINE','Two clocks on one axis: the first 700 ms of the synthetic trace');
        var now=Math.max(0,Math.min(WIN,(t-0.8)*26));
        text(ctx,'CONTROLLER',48,196,16,C.blue);text(ctx,'every 16.67 ms',48,216,12,C.muted);
        text(ctx,'AI INFERENCE',48,276,16,C.purple);text(ctx,'variable time',48,296,12,C.muted);
        line(ctx,X0,236,X1,236,'#24344c');line(ctx,X0,312,X1,312,'#24344c');
        var ticks=0;
        for(var k=0;k*normal.dt<=now;k++){var x=ms(k*normal.dt);line(ctx,x,180,x,236,C.blue);ticks++;}
        var slow=0,longest=null;
        calls.forEach(function(e){
          if(e.at>now)return;
          var end=Math.min(e.done,now),over=e.latency>normal.dt;
          ctx.fillStyle=over?C.red:C.purple;ctx.globalAlpha=0.9;
          ctx.fillRect(ms(e.at),262,Math.max(3,ms(end)-ms(e.at)),34);ctx.globalAlpha=1;
          if(over){slow++;longest=e;}
        });
        if(longest){
          var spanned=Math.min(longest.done,now)-longest.at;
          text(ctx,spanned.toFixed(0)+' ms = '+(spanned/normal.dt).toFixed(1)+' controller ticks',ms(longest.at),254,13,C.red);
          ctx.fillStyle='rgba(252,98,85,0.10)';ctx.fillRect(ms(longest.at),180,ms(Math.min(longest.done,now))-ms(longest.at),56);
        }
        line(ctx,ms(now),172,ms(now),320,C.ink);
        text(ctx,Math.round(now)+' ms',ms(now),340,13,C.ink,'center');
        text(ctx,'Ticks: '+ticks,48,388,20,C.blue);
        text(ctx,'Inference calls: '+calls.filter(function(e){return e.at<=now;}).length,300,388,20,C.purple);
        text(ctx,'Longer than one tick: '+slow,640,388,20,slow?C.red:C.muted);
      });
      lower(s, "AI can plan the next move. But what happens when its answer arrives after the system needed it?", 0.8);
      lower(s, "At sixty hertz, the controller gets sixteen point six seven milliseconds. A model call can take longer.", 10);
      lower(s, "Connect two clocks: variable inference time and a fixed execution deadline. Let us test that boundary.", 19);
    },{subtitle:'Timing and decision quality are separate requirements.'});
    film.scene('Move inference out of the waiting path',28,function(s){
      s.canvas(function(t,ctx){compare(ctx,normal,Math.min(360,Math.floor(t/27*360)),
        'SAME DELAY PATTERN. DIFFERENT SCHEDULING.','Synthetic trace: 8 ms inference, plus 80 ms on every fourth request');});
      lower(s, "On the left, inference blocks execution. A slow request delays later jobs too. Red squares count missed deadlines.", 0.8);
      lower(s, "On the right, a separate worker proposes updates. The controller never waits for that worker. Amber means it uses the fallback.", 10);
      lower(s, "Here, controller costs are fixed and resources isolated. We measure timing, not whether an action is useful.", 19);
    },{subtitle:'Cyan is on time. Amber is fallback. Neither proves task success.'});
    film.scene('Every proposal needs an admission contract',28,function(s){
      /* The age of the proposal the controller is using, job by job across the
         whole six-second trace. It climbs while no new answer arrives and drops
         when one is admitted, so the one slow call is seen pushing it through
         the limit and the controller falling back until a fresh one lands.
         Every point is a row of the model's own output, not a staged case. */
      var TTL=150, YMAX=250, PX0=110, PX1=912, PY0=178, PY1=338;
      var px=function(i){return PX0+(PX1-PX0)*i/359;}, py=function(a){return PY1-(PY1-PY0)*Math.min(a,YMAX)/YMAX;};
      s.canvas(function(t,ctx){
        head(ctx,'AN ANSWER NEEDS AN EXPIRY DATE','Admit a proposal only if its observation is recent and its context still matches');
        var upto=Math.max(0,Math.min(359,Math.floor((t-1)/24*360)));
        text(ctx,'age',48,PY0+4,13,C.muted);text(ctx,'250 ms',48,PY0+22,12,C.muted);text(ctx,'0',96,PY1+4,12,C.muted);
        line(ctx,PX0,PY1,PX1,PY1,'#24344c');
        ctx.setLineDash([6,5]);line(ctx,PX0,py(TTL),PX1,py(TTL),C.red);ctx.setLineDash([]);
        text(ctx,'limit '+TTL+' ms',PX1,py(TTL)-8,13,C.red,'right');
        var admitted=0,fallback=0;
        for(var i=1;i<=upto;i++){
          var a=normal.async[i],p=normal.async[i-1];
          if(a.fresh)admitted++;else fallback++;
          if(a.age===null||p.age===null)continue;
          line(ctx,px(i-1),py(p.age),px(i),py(a.age),a.fresh?C.green:C.amber);
        }
        var cur=normal.async[upto];
        line(ctx,px(upto),PY0-6,px(upto),PY1,C.ink);
        var state=cur.age===null?'WAITING FOR A FIRST PROPOSAL':cur.fresh?'ADMITTED  age '+cur.age.toFixed(0)+' ms':'EXPIRED  age '+cur.age.toFixed(0)+' ms, using fallback';
        text(ctx,state,48,370,19,cur.fresh?C.green:C.amber);
        text(ctx,'Admitted: '+admitted+'   Fallback: '+fallback,560,370,16,C.muted);
        text(ctx,'A freshness check cannot establish action safety.',48,398,15,C.amber);
      });
      lower(s, "Asynchrony changes the failure mode. The loop may stay on time while using an answer about a world that has already changed.", 0.8);
      lower(s, "Attach an observation timestamp and a context version. Check both before use, and define the fallback when a proposal expires.", 10);
      lower(s, "Freshness is only one check. Validate action limits, state estimation and fallback for the actual system.", 19);
    },{subtitle:'150 ms here is a chosen freshness limit, not a regulatory threshold.'});
    var stress=window.DeadlineModel.run({delay:80,ttl:150,outage:true,shared:true});
    film.scene('Break the assumptions',28,function(s){
      s.canvas(function(t,ctx){compare(ctx,stress,Math.min(360,Math.floor(t/27*360)),
        'NOW REMOVE CONNECTIVITY AND ISOLATION','Same model: 1 s outage window + six injected 20 ms resource stalls');});
      lower(s, "Now interrupt inference and inject shared resource stalls. Asynchrony alone cannot protect the controller from contention.", 0.8);
      lower(s, "Separate processes can still share hardware. Test resource isolation under competing load.", 10);
      lower(s, "Count deadline misses and fallback use. Measure task success separately. An on-time system can still be useless.", 19);
    },{subtitle:'The failure trace matters as much as the successful demo.'});
    film.scene('Use better AI to find better tests',28,function(s){
      /* A twelve-case sweep laid out as a map rather than read out one number
         at a time: extra delay across, operating condition down. Each cell is
         a full run of the same model, filled in turn. Once the map is complete
         its pattern is the finding: the asynchronous design misses deadlines
         only in the rows with shared-resource stalls, whatever the delay or
         outage, while delay and outage cost freshness instead. */
      var DEL=[0,80,240], ROWS=[
        {label:'isolated',sub:'online',shared:false,outage:false},
        {label:'isolated',sub:'1 s outage',shared:false,outage:true},
        {label:'shared stalls',sub:'online',shared:true,outage:false},
        {label:'shared stalls',sub:'1 s outage',shared:true,outage:true}];
      var cells=[];
      ROWS.forEach(function(r){DEL.forEach(function(d){
        var p=window.DeadlineModel.run({delay:d,shared:r.shared,outage:r.outage,ttl:150});
        cells.push({miss:p.asyncStats.misses,block:p.directStats.misses,fresh:p.asyncStats.fresh/360});
      });});
      var GX=250, GY=176, CW=220, CH=46;
      s.canvas(function(t,ctx){
        head(ctx,'WHAT CAN WE BUILD NEXT?','An experiment backlog, not a claimed deployment: 12 synthetic probes');
        DEL.forEach(function(d,j){text(ctx,'+'+d+' ms delay',GX+j*CW+CW/2-6,164,14,C.purple,'center');});
        var prog=Math.max(0,(t-0.6)/1.75), shown=Math.min(12,Math.floor(prog)+1);
        ROWS.forEach(function(r,i){
          text(ctx,r.label,48,GY+i*CH+20,15,r.shared?C.red:C.blue);
          text(ctx,r.sub,48,GY+i*CH+37,12,C.muted);
          DEL.forEach(function(d,j){
            var k=i*3+j,c=cells[k],x=GX+j*CW,y=GY+i*CH;
            ctx.fillStyle='#101e32';ctx.fillRect(x,y,CW-12,CH-6);
            if(k>=shown)return;
            // each run fills over its own slot: the counters climb to the model's totals
            var f=Math.min(1,prog-k), miss=Math.round(c.miss*f), fr=c.fresh*f;
            ctx.fillStyle=miss?'rgba(252,98,85,0.22)':'rgba(88,196,221,0.14)';ctx.fillRect(x,y,(CW-12)*f,CH-6);
            ctx.fillStyle=C.amber;ctx.fillRect(x,y+CH-9,(CW-12)*fr,3);
            text(ctx,miss+' async miss'+(miss===1?'':'es'),x+10,y+19,14,miss?C.red:C.blue);
            text(ctx,'fresh AI '+(100*fr).toFixed(0)+'%',x+10,y+34,12,C.amber);
            text(ctx,'blocking '+Math.round(c.block*f),x+CW-22,y+34,12,C.muted,'right');
          });
        });
        text(ctx,'Each cell: async misses, fresh-AI share, and blocking-design misses for the same run.',48,398,12,C.muted);
        if(prog>=12){
          // the finding: frame the only rows where the async loop misses a deadline
          var k=Math.min(1,(t-21.8)/3);
          if(k>0){ctx.strokeStyle=C.red;ctx.lineWidth=2;ctx.strokeRect(40,GY+2*CH-4,(GX+3*CW-40)*k,2*CH-2);}
          if(t>23)text(ctx,'Here only shared stalls cost the async loop a deadline; delay and outage cost freshness.',48,380,15,C.ink);
        }
      });
      lower(s, "Use robot models and world models to propose harder tests. Replay failures in a controlled environment.", 0.8);
      lower(s, "Measure task success, timing and cost. Check generated scenes against physical evidence.", 10);
      lower(s, "Build a system that can adopt better intelligence without losing its timing contract.", 19);
    },{subtitle:'Open research direction of the author, not yet published.'});
    film.build();
    if(window.__LABDEBUG)window.__detFilm=film;
  }
  function experiment() {
    var host=document.getElementById('deadline-experiment');if(!host)return;
    var delay=host.querySelector('#deadline-delay'),ttl=host.querySelector('#deadline-ttl');
    var outage=host.querySelector('#deadline-outage'),shared=host.querySelector('#deadline-shared');
    function update() {
      var r=window.DeadlineModel.run({delay:Number(delay.value),ttl:Number(ttl.value),outage:outage.checked,shared:shared.checked});
      host.querySelector('#deadline-delay-value').textContent=delay.value+' ms';
      host.querySelector('#deadline-ttl-value').textContent=ttl.value+' ms';
      host.querySelector('#deadline-direct').textContent=r.directStats.misses+' / 360';
      host.querySelector('#deadline-async').textContent=r.asyncStats.misses+' / 360';
      host.querySelector('#deadline-fresh').textContent=(100*r.asyncStats.fresh/360).toFixed(1)+'%';
      host.querySelector('#deadline-peak').textContent=r.directStats.peak.toFixed(1)+' / '+r.asyncStats.peak.toFixed(1)+' ms';
      var canvas=host.querySelector('canvas'),ctx=canvas.getContext('2d');
      ctx.clearRect(0,0,960,250);
      text(ctx,'Blocking inference',30,35,20,C.red);text(ctx,'Async + admission',500,35,20,C.blue);
      grid(ctx,r.direct,360,30,55,430,130);grid(ctx,r.async,360,500,55,430,130);
      text(ctx,'Each square is one controller job.',30,223,17,C.muted);
      canvas.setAttribute('aria-label','360 jobs: blocking '+r.directStats.misses+' deadline misses; asynchronous '+r.asyncStats.misses+' misses. Fresh AI used for '+r.asyncStats.fresh+' jobs.');
      host.querySelector('#deadline-interpretation').textContent=shared.checked?
        'Shared stalls cause asynchronous deadline misses too. Moving inference to another worker is not resource isolation.':
        'The asynchronous loop meets its modelled timing budget because its costs are bounded and isolated by assumption. Fresh-AI coverage shows how often an admitted proposal is available; it is not a task-success rate.';
      window.__deadlineExperiment=r;
    }
    host.addEventListener('input',update);
    host.querySelector('#deadline-reset').addEventListener('click',function(){delay.value=80;ttl.value=150;outage.checked=false;shared.checked=false;update();});
    host.querySelector('#deadline-download').addEventListener('click',function(){
      var blob=new Blob([JSON.stringify(window.__deadlineExperiment,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);
      var a=document.createElement('a');a.href=url;a.download='ai-deadline-synthetic-trace.json';a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);
    });
    update();
  }
  boot();
})();
