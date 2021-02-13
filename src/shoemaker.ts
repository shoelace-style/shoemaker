import { getAttrName, getAttrValue } from './utilities/attributes';
import { getPropName, getPropValue, reservedProperties } from './utilities/properties';
import { html as createTemplate, render as renderTemplate } from 'uhtml';

export { classMap, styleMap } from './utilities/directives';
export { html } from './utilities/render';
export { svg } from 'uhtml';

export abstract class Shoemaker extends HTMLElement {
  static tag: string;
  static dependencies: string[];
  static props: string[] = [];
  static reflect: string[] = [];
  static styles = '';

  static get observedAttributes() {
    return this.props.map(prop => getAttrName(prop));
  }

  private isMounted = false;
  private isRenderScheduled = false;
  private props: { [key: string]: any } = {};

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const { props } = this.constructor as typeof Shoemaker;

    // Define getters and setters for props
    props.map(prop => {
      if (reservedProperties.includes(prop)) {
        throw new Error(`Invalid prop name: "${prop}" is a reserved property`);
      }

      if (this.hasOwnProperty(prop)) {
        throw new Error(`Invalid prop name: "${prop}" has already been declared`);
      }

      Object.defineProperty(this, prop, {
        get: () => this.props[prop],
        set: (newValue: any) => {
          const oldValue = this.props[prop];

          this.props[prop] = newValue;
          this.reflectToAttr(prop);
          this.scheduleRender();
          this.triggerWatcher(prop, oldValue, newValue);
        }
      });
    });
  }

  connectedCallback() {
    const { props } = this.constructor as typeof Shoemaker;

    // Sync initial attributes to props
    props.map(prop => {
      const attr = getAttrName(prop);
      if (this.hasAttribute(attr)) {
        this.props[prop] = getPropValue(this.getAttribute(attr));
      }
    });

    this.isMounted = true;
    this.renderToDOM();
    this.onMount();
  }

  disconnectedCallback() {
    this.isMounted = false;
    this.onDestroy();
  }

  attributeChangedCallback(attrName: string, oldValue: string | null, newValue: string | null) {
    if (newValue !== oldValue && this.isMounted) {
      this.props[getPropName(attrName)] = getPropValue(newValue);
      this.scheduleRender();
    }
  }

  private reflectToAttr(prop: string) {
    const { reflect } = this.constructor as typeof Shoemaker;

    if (reflect.includes(prop) && this.isMounted) {
      const propValue = this.props[prop];
      const attrName = getAttrName(prop);
      const attrValue = getAttrValue(propValue);

      if (typeof attrValue === 'string') {
        this.setAttribute(attrName, attrValue);
      } else {
        this.removeAttribute(attrName);
      }
    }
  }

  private triggerWatcher(propertyName: string, oldValue: any, newValue: any) {
    if (newValue !== oldValue && this.isMounted) {
      const methodName = `watch${propertyName.charAt(0).toUpperCase() + propertyName.substring(1)}`;
      if (typeof this.constructor.prototype[methodName] === 'function') {
        this.constructor.prototype[methodName].call(this, oldValue, newValue);
      }
    }
  }

  private renderToDOM() {
    const html = this.render();

    if (html) {
      const { styles } = this.constructor as typeof Shoemaker;
      const stylesheet = `<style>${styles}</style>`;
      const template = createTemplate(html.strings.concat(stylesheet), ...html.values.concat(''));
      renderTemplate(this.shadowRoot!, template);
    }
  }

  /** Called after the component has initialized and the first render has occurred. */
  public onMount() {}

  /** Called when the component is removed from the DOM. */
  public onDestroy() {}

  /** Renders the component.  */
  public render(): any | undefined {
    return undefined;
  }

  /**
   * Schedules a render. This is called automatically when props change, but you can force a re-render by calling it
   * arbitrarily. It's almost always a bad practice to rely on this method. Try to use props instead.
   */
  async scheduleRender() {
    if (!this.isRenderScheduled && this.isMounted) {
      this.isRenderScheduled = true;

      return new Promise(resolve =>
        requestAnimationFrame(() => {
          if (this.isMounted) {
            this.renderToDOM();
            this.isRenderScheduled = false;
            resolve(null);
          }
        })
      );
    }
  }

  /** Dispatches a custom event from the host element. */
  public emit(eventName: string, eventOptions?: CustomEventInit) {
    const event = new CustomEvent(eventName, eventOptions);
    this.dispatchEvent(event);
    return event;
  }

  /** Registers the component as a custom element. */
  static register() {
    // @ts-ignore
    customElements.define(this.tag, this);
  }
}
