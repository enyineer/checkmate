import React, { Suspense, ComponentType } from "react";

export function wrapInSuspense<P extends object>(
  Component: ComponentType<P>,
  fallback: React.ReactNode = <div>Loading...</div>
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
  WrappedComponent.displayName = `Suspense(${
    Component.displayName || Component.name || "Component"
  })`;
  return WrappedComponent;
}
