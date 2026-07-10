import '@testing-library/jest-dom/vitest';
import { expect } from 'vitest';
// vitest-axe 0.1.0 ships an empty dist/extend-expect.js, so importing
// 'vitest-axe/extend-expect' is a no-op — extend the matchers explicitly.
// (Wildcard import required: the package's matchers.d.ts re-exports the
// matcher as type-only, so a named value import fails typecheck.)
import * as axeMatchers from 'vitest-axe/matchers.js';

expect.extend(axeMatchers);
