/* Deterministic double-progression engine. Browser global + CommonJS export for tests. */
(function(root){
  "use strict";
  function mid(lo,hi){ return Math.round((lo+hi)/2); }
  function computeNext(ex, sets){
    var W=Number(ex.weight), inc=Number(ex.inc), lo=Number(ex.lo), hi=Number(ex.hi);
    var perf=(sets||[]).filter(function(s){return s&&s.r!=null&&!isNaN(s.r);}).map(function(s){return {w:(s.w!=null&&!isNaN(s.w))?Number(s.w):W,r:Number(s.r),e:s.e||null};});
    if(!perf.length) return null;
    var minW=Math.min.apply(null,perf.map(function(s){return s.w;})), minR=Math.min.apply(null,perf.map(function(s){return s.r;}));
    var cruising=perf.length>=2&&perf.every(function(s){return s.e==="easy";}), maxed=perf.some(function(s){return s.e==="max";}), goal=ex.target!=null?Number(ex.target):hi;
    var hitTop=minR>=hi, inRange=minR>=lo, hitGoal=minR>=goal;
    if(perf.length>=2&&minW>=W&&(hitTop||(inRange&&cruising))&&!maxed){ var to=Math.round((minW+inc)*100)/100; return {weight:to,target:mid(lo,hi),last:sets,rec:{type:"go",from:W,to:to,target:mid(lo,hi),reason:(!hitTop&&cruising)?"easy":"normal"}}; }
    if(minW>=W&&inRange&&maxed&&!hitGoal){ var down=Math.max(0,Math.round((minW-inc)*100)/100); return {weight:down,target:goal,last:sets,rec:{type:"miss",from:W,to:down,target:goal,eased:down<W,reason:"toohard"}}; }
    if(minW>=W&&inRange){ var target=maxed?Math.max(lo,Math.min(hi,minR)):hi; return {weight:minW,target:target,last:sets,rec:{type:"hold",weight:minW,target:target,beat:minR,reason:maxed?"consolidate":"reps"}}; }
    var success=null; perf.forEach(function(s){if(s.r>=lo) success=success==null?s.w:Math.max(success,s.w);});
    var next=success!=null?success:Math.max(0,Math.round((minW-inc)*100)/100);
    return {weight:next,target:lo,last:sets,rec:{type:"miss",from:W,to:next,target:lo,eased:next<W}};
  }
  var api={computeNext:computeNext}; root.ProgressionEngine=api; if(typeof module!=="undefined") module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
