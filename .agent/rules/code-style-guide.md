---
trigger: always_on
---

# Strong types

ALWAYS use Typescript and avoid untyped code.

NEVER use "any".

# Validation

When type-checking or validation of a type is necessary, ALWAYS use the library "zod" and write zod-schemas.

# Code structure

ALWAYS keep the code well structured and modular.

ALWAYS use typed objects for function arguments, try to avoid positional arguments. ALWAYS use object destructuring in functions to destructure the "props" given to the function.