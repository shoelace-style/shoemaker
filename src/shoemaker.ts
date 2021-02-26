import { getAttrName, getAttrValue } from './utilities/attributes';
import { getPropName, getPropValue, reservedProperties } from './utilities/properties';
import { html, render as renderTemplate, Hole } from 'uhtml';

export { classMap, styleMap } from './utilities/directives';
export { html, svg, Hole } from 'uhtml';

export abstract class Shoemaker extends HTMLElement {
  static tag: string;
  static props: string[] = [];
  static reflect: string[] = [];
  static styles = '';

  static get observedAttributes() {
    return this.props.map(prop => getAttrName(prop));
  }

  private _initialProps: { [key: string]: any } = {};
  private _isInitialized = false; // the component has been initialized and may or may not be connected to the DOM
  private _isMounted = false; // the component has been initialized and is currently connected to the DOM
  private _isRenderScheduled = false;
  private _props: { [key: string]: any } = {};

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const { props } = this.constructor as typeof Shoemaker;

    props.map(prop => {
      if (reservedProperties.includes(prop)) {
        throw new Error(`Invalid prop name: "${prop}" is a reserved property`);
      }

      // Store initial prop values so we can restore them after the subclass' constructor runs. This lets us set default
      // values for components but prevents those values from overriding user-defined values when elements are created.
      if (this.hasOwnProperty(prop)) {
        this._initialProps[prop] = (this as any)[prop];
      }

      // Define getters and setters for props
      Object.defineProperty(this, prop, {
        get: () => this._props[prop],
        set: (newValue: any) => {
          const oldValue = this._props[prop];

          this._props[prop] = newValue;
          this._reflectToAttr(prop);
          this.scheduleRender();
          this._triggerWatcher(prop, oldValue, newValue);
        }
      });
    });
  }

  connectedCallback() {
    const { props } = this.constructor as typeof Shoemaker;

    // Restore user-defined props before attributes are set. This prevents default values in components from being
    // overridden during instantiation but still allows attributes to take precedence.
    Object.keys(this._initialProps).map((prop: string) => {
      (this as any)[prop] = this._initialProps[prop];
    });

    // Once we've set the initial props, destroy them so they don't get applied if the component reconnects to the DOM
    this._initialProps = {};

    // Sync attributes to props
    props.map(prop => {
      const attr = getAttrName(prop);
      if (this.hasAttribute(attr)) {
        this._props[prop] = getPropValue(this.getAttribute(attr));
      }
    });

    this._isInitialized = true;
    this.onConnect();
    this._isMounted = true;
    this._renderToDOM();
    this.onReady();
  }

  disconnectedCallback() {
    this._isMounted = false;
    this.onDisconnect();
  }

  attributeChangedCallback(attrName: string, oldValue: string | null, newValue: string | null) {
    if (newValue !== oldValue && this._isMounted) {
      this._props[getPropName(attrName)] = getPropValue(newValue);
      this.scheduleRender();
    }
  }

  private _reflectToAttr(prop: string) {
    const { reflect } = this.constructor as typeof Shoemaker;

    if (reflect.includes(prop) && this._isMounted) {
      const propValue = this._props[prop];
      const attrName = getAttrName(prop);
      const attrValue = getAttrValue(propValue);

      if (typeof attrValue === 'string') {
        this.setAttribute(attrName, attrValue);
      } else {
        this.removeAttribute(attrName);
      }
    }
  }

  private _triggerWatcher(propertyName: string, oldValue: any, newValue: any) {
    if (newValue !== oldValue && this._isMounted) {
      const methodName = `watch${propertyName.charAt(0).toUpperCase() + propertyName.substring(1)}`;
      if (typeof this.constructor.prototype[methodName] === 'function') {
        this.constructor.prototype[methodName].call(this, oldValue, newValue);
      }
    }
  }

  private _renderToDOM() {
    const template = this.render();

    if (template) {
      const { styles } = this.constructor as typeof Shoemaker;
      const stylesheet = html`<style>
        ${styles}
      </style>`;

      renderTemplate(this.shadowRoot!, html`${stylesheet} ${template}`);
    }
  }

  /** Called after the component has been connected to the DOM and before the initial render. At this point, the
   * component's internals are not available in the DOM. This is a good place to fetch data and override initial props.
   */
  public onConnect() {}

  /** Called after the component has initialized and the first render has occurred. */
  public onReady() {}

  /** Called when the component is removed from the DOM. */
  public onDisconnect() {}

  /** Renders the component. */
  public render(): Hole | string | undefined {
    return undefined;
  }

  /**
   * Schedules a render. This is called automatically when props change, but you can force a re-render by calling it
   * arbitrarily. It's almost always a bad practice to rely on this method. Try to use props instead.
   */
  public async scheduleRender() {
    if (!this._isRenderScheduled && this._isMounted) {
      this._isRenderScheduled = true;

      return new Promise(resolve =>
        requestAnimationFrame(() => {
          // To perform a render, the component must be initialized but it doesn't necessarily have to be connected to
          // the DOM. This prevents extra rerenders during initialization.
          if (this._isInitialized) {
            this._renderToDOM();
            this._isRenderScheduled = false;
            resolve(null);
          }
        })
      );
    }
  }

  /** Dispatches a custom event from the host element. */
  public emit(eventName: string, eventOptions?: CustomEventInit) {
    const event = new CustomEvent(
      eventName,
      Object.assign(
        {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: {}
        },
        eventOptions
      )
    );
    this.dispatchEvent(event);
    return event;
  }

  /** Registers the component as a custom element. */
  static register() {
    // @ts-ignore
    customElements.define(this.tag, this);
  }
}
