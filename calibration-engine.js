/* Conservative starting-point helpers. Estimates inform onboarding only; they never prescribe a load. */
(function(root){
  "use strict";
  function num(v){ var n=Number(v); return isFinite(n)?n:0; }
  function repsInSet(sets){ return (sets||[]).filter(function(s){return s&&num(s.r)>0;}).length; }
  function deriveCardioTarget(weeklyMinutes, caution){
    var base=Math.max(0,num(weeklyMinutes));
    if(caution) return {minutes:base, note:"Use a clinician-approved target before increasing intensity or duration."};
    if(base===0) return {minutes:45, note:"Three easy 15-minute sessions is a gentle place to begin."};
    if(base<60) return {minutes:60, note:"Build consistency first; short sessions count."};
    if(base<150) return {minutes:Math.min(150,Math.max(base+15,Math.round(base*1.15/5)*5)),note:"Add a small amount only after your current week feels manageable."};
    return {minutes:Math.min(300,Math.round(base/5)*5),note:"You already meet the public-health minimum. Keep the mix sustainable."};
  }
  function estimateQuality(estimate){
    if(!estimate || estimate.unknown || num(estimate.weight)<=0 || num(estimate.reps)<3 || num(estimate.reps)>20) return 0;
    return estimate.effort==="easy"?1:2;
  }
  function baseConfidence(estimates){ return Math.min(32,(estimates||[]).reduce(function(total,x){return total+estimateQuality(x)*8;},0)); }
  function summarizeStrengthEvidence(sessions, estimates){
    var rows=(sessions||[]).filter(function(row){return repsInSet(row.sets)>=2;});
    var movements={}; var stable=0, maxed=0;
    rows.forEach(function(row){ movements[row.exercise_id||row.exercise_name||("row"+Math.random())]=true; if(row.result==="go"||row.result==="hold") stable++; (row.sets||[]).forEach(function(s){if(s&&s.e==="max")maxed++;}); });
    var confidence=Math.min(95,baseConfidence(estimates)+rows.length*7+Object.keys(movements).length*4+stable*2);
    if(maxed>rows.length) confidence=Math.max(0,confidence-6);
    return {sessions:rows.length,movements:Object.keys(movements).length,stable:stable,maxed:maxed,confidence:Math.round(confidence),stage:confidence<35?"Starting":(confidence<70?"Learning from your sessions":"Observed profile")};
  }
  function starterStrengthDays(experience, caution){ if(caution) return 0; return experience==="consistent"?3:2; }
  function summarizeCardioEvidence(rows, target, now){
    now=now||Date.now(); var week=7*24*3600000, current=0, previous=0, sessions=0;
    (rows||[]).forEach(function(row){var age=now-new Date(row.performed_at).getTime(), minutes=Math.max(0,num(row.minutes)); if(age>=0&&age<week){current+=minutes;sessions++;} else if(age>=week&&age<2*week){previous+=minutes;}});
    var goal=Math.max(0,num(target)), ready=goal>0&&current>=goal*.8&&previous>=goal*.8;
    return {current:Math.round(current),previous:Math.round(previous),sessions:sessions,readyToProgress:ready,suggestedTarget:ready?Math.min(300,Math.max(goal+10,Math.round(goal*1.1/5)*5)):goal};
  }
  var api={deriveCardioTarget:deriveCardioTarget,summarizeStrengthEvidence:summarizeStrengthEvidence,summarizeCardioEvidence:summarizeCardioEvidence,starterStrengthDays:starterStrengthDays};
  root.ProgressionCalibration=api; if(typeof module!=="undefined") module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
