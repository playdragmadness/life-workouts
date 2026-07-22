const assert = require("assert");

require("../exercise-library.js");

const library = global.ProgressionExerciseLibrary;
const equipment = new Set(["barbell", "dumbbells", "cable", "machine", "bodyweight"]);
const categories = new Set(["compound", "isolation", "leg"]);

assert(Array.isArray(library), "The exercise library should be an array");
assert(library.length >= 50, "The exercise library should have a useful starter catalog");
assert(new Set(library.map((exercise) => exercise.name.toLowerCase())).size === library.length, "Exercise names should be unique");
library.forEach((exercise) => {
  assert(exercise.name && exercise.muscle, "Every exercise needs a name and primary muscle");
  assert(equipment.has(exercise.equipment), `Unexpected equipment: ${exercise.equipment}`);
  assert(categories.has(exercise.cat), `Unexpected category: ${exercise.cat}`);
});

console.log("exercise-library tests passed");
