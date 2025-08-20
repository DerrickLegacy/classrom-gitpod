const reverseString = require("./index");

test("reverses a string", () => {
  expect(reverseString("hello")).toBe("olleh");
});
