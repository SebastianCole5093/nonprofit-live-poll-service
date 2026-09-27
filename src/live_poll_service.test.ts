import assert from "node:assert/strict";
import { chooseLeadingOption } from "./live_poll_service.js";

assert.equal(chooseLeadingOption({ Meals: 4, Mentoring: 7 }), "Mentoring");
assert.equal(chooseLeadingOption({ Alpha: 2, Beta: 2 }), "Alpha");
console.log("poll decision test passed");
