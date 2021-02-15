export function getPropName(attrName: string) {
  return attrName.replace(/-./g, m => m.toUpperCase()[1]);
}

export function getPropValue(attrValue: string | null) {
  if (attrValue === '') {
    // Empty attributes resolve to boolean true, e.g. <input disabled>
    return true;
  } else if (Number(attrValue).toString() === attrValue) {
    return Number(attrValue);
  } else {
    return attrValue;
  }
}

export const reservedProperties = [
  'accesskey',
  'class',
  'contenteditable',
  'dir',
  'draggable',
  'hidden',
  'id',
  'lang',
  'spellcheck',
  'style',
  'tabindex',
  'title',
  'translate'
];
