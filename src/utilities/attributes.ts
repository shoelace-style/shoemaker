export function getAttrName(propName: string) {
  return propName.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`).replace(/^-/, '');
}

export function getAttrValue(propValue: any) {
  if (typeof propValue === 'string' || typeof propValue === 'number') {
    return propValue + '';
  } else if (typeof propValue === 'boolean') {
    // Empty attributes resolve to boolean true, e.g. <input disabled>
    return propValue ? '' : null;
  } else {
    // Other types cannot be stored as attributes
    return null;
  }
}
