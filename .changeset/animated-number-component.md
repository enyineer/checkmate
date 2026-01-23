---
"@checkstack/ui": minor
"@checkstack/healthcheck-frontend": patch
---

## Animated Numbers & Availability Stats Live Updates

### Features

- **AnimatedNumber component** (`@checkstack/ui`): New reusable component that displays numbers with a smooth "rolling" animation when values change. Uses `requestAnimationFrame` with eased interpolation for a polished effect.
- **useAnimatedNumber hook** (`@checkstack/ui`): Underlying hook for the animation logic, can be used directly for custom implementations.
- **Live availability updates**: Availability stats (31-day and 365-day) now automatically refresh when new health check runs are received via signals.

### Usage

```tsx
import { AnimatedNumber } from "@checkstack/ui";

<AnimatedNumber
  value={99.95}
  suffix="%"
  decimals={2}
  duration={500}
  className="text-2xl font-bold text-green-500"
/>
```

