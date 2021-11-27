import isFunction from 'lodash/isFunction';

export function shallowEqual(
  objectA: Record<string, unknown>,
  objectB: Record<string, unknown>,
): boolean {
  if (objectA === objectB) return true;

  const keysOfA = Object.keys(objectA);
  const keysOfB = Object.keys(objectB);

  if (keysOfA.length !== keysOfB.length) return false;

  for (let index = 0; index < keysOfA.length; index += 1) {
    const key = keysOfA[index];
    if (objectA[key] !== objectB[key]) return false;
  }

  return true;
}

export function isPromise<T>(object: any = {}): object is PromiseLike<T> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return object !== null && isFunction(object.then);
}

export function getDisplayName(Component: React.ComponentType): string {
  return (
    Component.displayName ||
    Component.name ||
    (Component.constructor && Component.constructor.name) ||
    'Component'
  );
}
