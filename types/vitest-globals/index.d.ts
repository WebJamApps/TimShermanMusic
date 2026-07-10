/// <reference types="vitest/globals" />

import 'vitest';

declare module 'vitest' {
  interface Assertion<T = any> {
    toHaveNoViolations(): T;
  }
}
