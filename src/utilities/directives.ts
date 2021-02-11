export function classMap(classes: any) {
  let result: string[] = [];
  Object.keys(classes).map(key => {
    if (classes[key]) {
      result.push(key);
    }
  });

  return result.join(' ');
}

export function styleMap(styles: any) {
  let result: string[] = [];
  Object.keys(styles).map(key => result.push(`${key}: ${styles[key]}`));

  return result.join('; ');
}
