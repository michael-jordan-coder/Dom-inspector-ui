
// Mocking DOM interfaces
class MockElement {
  children: any;
  parentElement: MockElement | null = null;
  previousElementSibling: MockElement | null = null;
  nextElementSibling: MockElement | null = null;
  tagName: string = 'DIV';

  constructor(childrenCount: number = 0) {
    const childs = [];
    let prev: MockElement | null = null;
    for (let i = 0; i < childrenCount; i++) {
      const child = new MockElement(0);
      child.parentElement = this;
      if (prev) {
        child.previousElementSibling = prev;
        prev.nextElementSibling = child;
      }
      childs.push(child);
      prev = child;
    }
    // Simulate HTMLCollection-ish behavior (array-like but not Array)
    this.children = { length: childs.length, ...childs, [Symbol.iterator]: function*() { yield* childs; } };
  }
}

// Current implementation
const MAX_CHILDREN = 20;

function current_extractChildrenSummaries(element: any): any[] {
  const children = Array.from(element.children);
  return children.slice(0, MAX_CHILDREN).map(() => ({}));
}

function optimized_extractChildrenSummaries(element: any): any[] {
  const result = [];
  const children = element.children;
  const count = Math.min(children.length, MAX_CHILDREN);
  for (let i = 0; i < count; i++) {
    // In real DOM accessing by index is supported
    result.push({});
  }
  return result;
}

function current_getSiblingIndex(element: any): number {
  const parent = element.parentElement;
  if (!parent) return 0;
  return Array.from(parent.children).indexOf(element);
}

function optimized_getSiblingIndex(element: any): number {
   let index = 0;
   let current = element.previousElementSibling;
   while (current) {
     index++;
     current = current.previousElementSibling;
   }
   return index;
}

// Benchmark Setup
const parentLarge = new MockElement(5000);
// We need to access children correctly from our mock
// Since our mock children is an object with numeric keys, we need to access it like an array
const childLarge = (parentLarge.children as any)[2500];

const ITERATIONS = 5000;

console.log(`Running ${ITERATIONS} iterations with 5000 children...`);

// Test 1: extractChildrenSummaries
console.time('current_extractChildrenSummaries');
for(let i=0; i<ITERATIONS; i++) {
    current_extractChildrenSummaries(parentLarge);
}
console.timeEnd('current_extractChildrenSummaries');

console.time('optimized_extractChildrenSummaries');
for(let i=0; i<ITERATIONS; i++) {
    optimized_extractChildrenSummaries(parentLarge);
}
console.timeEnd('optimized_extractChildrenSummaries');

// Test 2: getSiblingIndex
console.time('current_getSiblingIndex');
for(let i=0; i<ITERATIONS; i++) {
    current_getSiblingIndex(childLarge);
}
console.timeEnd('current_getSiblingIndex');

console.time('optimized_getSiblingIndex');
for(let i=0; i<ITERATIONS; i++) {
    optimized_getSiblingIndex(childLarge);
}
console.timeEnd('optimized_getSiblingIndex');
