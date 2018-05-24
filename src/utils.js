export function shallowEqual(objectA, objectB) {
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

export function omit(object, props) {
  const keys = Object.keys(object).filter(key => props.indexOf(key) < 0);
  return keys.reduce((acc, key) => ({ ...acc, [key]: object[key] }), {});
}

export function getDisplayName(Component) {
  return Component.displayName ||
  Component.name ||
  (Component.constructor && Component.constructor.name) ||
  'Component';
}
