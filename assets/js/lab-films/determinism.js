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
  function box(ctx, x, y, w, h, label, sub, color) {
    ctx.fillStyle = '#101e32'; ctx.strokeStyle = color || C.blue; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x,y,w,h,10); ctx.fill(); ctx.stroke();
    text(ctx,label,x+w/2,y+32,18,color,'center');
    if (sub) text(ctx,sub,x+w/2,y+58,13,C.muted,'center');
  }
  function line(ctx, x1,y1,x2,y2,color) {
    ctx.beginPath(); ctx.strokeStyle=color || C.blue; ctx.lineWidth=2;
    ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  }
  function dot(ctx,x,y,color,r) { ctx.beginPath();ctx.fillStyle=color;ctx.arc(x,y,r || 6,0,Math.PI*2);ctx.fill(); }
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
    film.scene('The model can wait. Can the system?',28,function(s){
      s.canvas(function(t,ctx){
        head(ctx,'AI MEETS THE DEADLINE','A design experiment: learning above a 60 Hz execution loop');
        box(ctx,48,170,260,80,'AI PLANNER','variable inference time',C.purple);
        box(ctx,350,170,260,80,'CONTROLLER','16.67 ms per tick',C.blue);
        box(ctx,652,170,260,80,'PHYSICAL WORLD','keeps moving',C.amber);
        line(ctx,308,210,350,210);line(ctx,610,210,652,210);
        var phase=(t%4)/4;
        dot(ctx,48+864*phase,282,C.purple,8);
        for(var i=0;i<48;i++) {
          var x=48+i*18;line(ctx,x,313,x,333,C.blue);
          if(i<Math.floor((t*12)%48))dot(ctx,x,355,C.blue,3);
        }
        text(ctx,'Model quality',48,389,20,C.purple);
        text(ctx,'Timing',367,389,20,C.blue);
        text(ctx,'Useful action',680,389,20,C.amber);
      });
      lower(s, "AI can plan the next move. But what happens when its answer arrives after the system needed it?", 0.8);
      lower(s, "At sixty hertz, the controller gets sixteen point six seven milliseconds. A model call can take longer.", 10);
      lower(s, "Connect two clocks: variable inference time and a fixed execution deadline. Let us test that boundary.", 19);
    },{subtitle:'Timing and decision quality are separate requirements.'});
    var normal=window.DeadlineModel.run({delay:80,ttl:150});
    film.scene('Move inference out of the waiting path',28,function(s){
      s.canvas(function(t,ctx){compare(ctx,normal,Math.min(360,Math.floor(t/27*360)),
        'SAME DELAY PATTERN. DIFFERENT SCHEDULING.','Synthetic trace: 8 ms inference, plus 80 ms on every fourth request');});
      lower(s, "On the left, inference blocks execution. A slow request delays later jobs too. Red squares count missed deadlines.", 0.8);
      lower(s, "On the right, a separate worker proposes updates. The controller never waits for that worker. Amber means it uses the fallback.", 10);
      lower(s, "Here, controller costs are fixed and resources isolated. We measure timing, not whether an action is useful.", 19);
    },{subtitle:'Cyan is on time. Amber is fallback. Neither proves task success.'});
    film.scene('Every proposal needs an admission contract',28,function(s){
      s.canvas(function(t,ctx){
        head(ctx,'AN ANSWER NEEDS AN EXPIRY DATE','Example contract: observation time, context version, validated action limits');
        var caseNo=Math.floor(t/7)%4;
        var labels=['FRESH PROPOSAL','EXPIRED PROPOSAL','WRONG CONTEXT','NO RESPONSE'];
        var ages=[42,188,60,400],ver=['matches','matches','changed','unknown'];
        box(ctx,48,166,270,90,labels[caseNo],'age '+ages[caseNo]+' ms',caseNo?C.amber:C.purple);
        box(ctx,355,166,245,90,'ADMISSION','age + context + limits',C.blue);
        box(ctx,647,166,265,90,caseNo?'FALLBACK':'ACCEPT UPDATE',caseNo?'continue baseline control':'atomic handoff',caseNo?C.amber:C.green);
        line(ctx,318,211,355,211);line(ctx,600,211,647,211);
        var phase=(t%7)/7;dot(ctx,48+864*phase,289,caseNo?C.amber:C.green,7);
        text(ctx,'Example age limit: 150 ms',48,339,20,C.blue);
        text(ctx,'Context: '+ver[caseNo],492,339,20,C.muted);
        text(ctx,'A freshness check cannot establish action safety.',48,390,19,C.amber);
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
      s.canvas(function(t,ctx){
        head(ctx,'WHAT CAN WE BUILD NEXT?','An experiment backlog, not a claimed deployment');
        var labels=['GENERATE CASES','REPLAY FAILURES','COMPARE DESIGNS'];
        var subs=['AI proposes variations','fixed seeds + event logs','timing + task success'];
        for(var i=0;i<3;i++) {
          var x=48+i*296;box(ctx,x,175,272,86,labels[i],subs[i],i===Math.floor(t/9)%3?C.green:C.blue);
          if(i<2)line(ctx,x+272,218,x+296,218);
        }
        // Replay actual model variations rather than a decorative progress bar.
        var caseIndex=Math.min(11,Math.floor(t/2.25));
        var delays=[0,80,240],d=delays[caseIndex%3],shared=caseIndex>=6,offline=caseIndex%6>=3;
        var probe=window.DeadlineModel.run({delay:d,shared:shared,outage:offline,ttl:150});
        text(ctx,'SYNTHETIC PROBE '+(caseIndex+1)+' / 12',48,307,16,C.muted);
        text(ctx,'Extra delay: '+d+' ms',48,346,21,C.purple);
        text(ctx,'Async misses: '+probe.asyncStats.misses,492,346,21,shared?C.red:C.blue);
        text(ctx,'Outage: '+(offline?'on':'off')+' | Shared stalls: '+(shared?'on':'off'),48,389,15,C.muted);
        text(ctx,'Fresh AI: '+(100*probe.asyncStats.fresh/360).toFixed(1)+'%',492,389,20,C.amber);
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
