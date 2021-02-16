export function classMap(classes: any) {
  let result: string[] = [];
  Object.keys(classes).map(key => {
    if (classes[key]) {
      result.push(key);
    }
  });

  return result.join(' ');
}

export function styleMap(styles: { [key: string]: any }) {
  let result: string[] = [];

  Object.keys(styles).map(key => {
    if (styles[key]) {
      const isCustomProperty = /^--/.test(key);
      const name = isCustomProperty ? key : key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`).replace(/^-/, '');
      result.push(`${name}: ${styles[key]}`);
    }
  });

  return result.join('; ') + (result.length ? ';' : '');
}
