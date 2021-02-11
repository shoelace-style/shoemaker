export function html(strings: TemplateStringsArray, ...values: unknown[]) {
  return { strings, values };
}
