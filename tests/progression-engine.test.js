const assert = require("node:assert/strict");
const { computeNext } = require("../progression-engine.js");
const ex = (overrides = {}) => Object.assign({ weight: 100, inc: 5, lo: 6, hi: 10, target: 8 }, overrides);

assert.equal(computeNext(ex(), [{ w:100, r:10 },{ w:100, r:10 }]).weight, 105, "top of range levels up");
assert.equal(computeNext(ex(), [{ w:100, r:6, e:"easy" },{ w:100, r:6, e:"easy" }]).rec.reason, "easy", "easy sets can progress early");
const consolidate=computeNext(ex(), [{ w:100, r:8, e:"max" },{ w:100, r:8 }]);
assert.equal(consolidate.rec.reason, "consolidate", "hitting the goal at max never reduces weight");
assert.equal(consolidate.weight, 100);
assert.equal(computeNext(ex(), [{ w:100, r:6, e:"max" },{ w:100, r:6 }]).weight, 95, "max below goal eases");
assert.equal(computeNext(ex(), [{ w:100, r:0 },{ w:100, r:0 }]).weight, 95, "a logged zero is a real miss");
assert.equal(computeNext(ex(), [{ w:null, r:null }]), null, "a blank/deleted set is ignored");
console.log("progression-engine tests passed");
