# Shoemaker

An elegant way to create web components.

Created by [Cory LaViska](https://twitter.com/claviska).

⚠️ This project was a fun experiment, but it is no longer being developed or maintained.

## Overview

Shoemaker provides an abstract class that you can extend to make your own [custom elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements) with an elegant API and reactive data binding. It gives you a closer-to-the-metal experience than many other custom element authoring tools.

- Declarative templates
- Reactive data binding via props
- Fast, efficient rendering
- Lifecycle hooks
- Watchers

Shoemaker is written in TypeScript. For an optimal developer experience you should use TypeScript as well, but it is by no means a requirement.

## Installation

To get started, install Shoemaker:

```bash
npm install @shoelace-style/shoemaker
```

## Your First Component

Let's create a simple counter component using TypeScript.

```ts
import { Shoemaker, html } from '@shoelace-style/shoemaker';

export class MyCounter extends Shoemaker {
  static tag = 'my-counter';
  static props = ['count'];

  count = 0;

  render() {
    return html`
      <button type="button" onclick="${() => this.count++}">
        Count: ${this.count}
      </button>
    `;
  }
}

MyCounter.register(); // now you can use <my-counter></my-counter> in your HTML
```

<details>
<summary>JavaScript version</summary>

The same component in browser-friendly JavaScript looks like this.

```js
import { Shoemaker, html } from '@shoelace-style/shoemaker';

export class MyCounter extends Shoemaker {
  constructor() {
    super();
    this.count = 0;
  }

  render() {
    return html`
      <button type="button" onclick="${() => this.count++}">
        Count: ${this.count}
      </button>
    `;
  }
}

MyCounter.tag = 'my-counter';
MyCounter.props = ['count'];
MyCounter.register();
```
</details>

## API

### Metadata

Metadata is defined using the following static properties.

- `tag` - The custom element's tag. Per the spec, this must start with a letter and contain at least one dash.
- `props` - An array of prop names to be made reactive. That is, changing any of these props will trigger a rerender. Always use camelCase notation for props.
- `reflect` - An array of prop names that will reflect their values to the corresponding DOM attribute (e.g. `myProp` ==> `my-prop`).
- `styles` - A string containing the component's stylesheet. If you're using a bundler, it's convenient to import your CSS or SCSS as a string from separate files.

In TypeScript, metadata is defined like this:

```ts
class MyComponent extends Shoemaker {
  static tag = 'my-component';
  static props = ['value', 'disabled'];
  static reflect = ['disabled'];
  static styles = `...`;

  // ...
}
```

<details>
<summary>JavaScript version</summary>
If you're not using TypeScript or Babel to transpile bleeding-edge JavaScript into something browsers can understand, you should define metadata like this instead:

```js
class MyComponent extends Shoemaker {
  // ...
}

MyComponent.tag = 'my-component';
MyComponent.props = ['value', 'disabled'];
MyComponent.reflect = ['disabled'];
MyComponent.styles = `...`;
```
</details>

### Props

In Shoemaker, the term "prop" refers to a form of state that the user controls by setting HTML attributes or JavaScript properties on the element. The concept of attributes and properties can be confusing, so Shoemaker abstracts them into "props." Internally, Shoemaker only looks at properties, but it will automatically sync attribute changes to their corresponding properties for better DX. This means that the color attribute in `<my-element color="blue">` will translate to `this.color = 'blue'` on the element instance and, if the attribute changes, `this.color` will update to match.

By default, property changes will not reflect back to attributes. Thus, setting `this.color = 'tomato'` will update the property but not the attribute nor the DOM. You can modify this behavior by adding props to the `reflect` array. This can be useful if you intend to style your element with attribute selectors.

Attributes are always lower-kebab-case and properties are always camelCase. For example, an attribute named primary-color will have a corresponding property of primaryColor. Shoemaker handles this conversion for you automatically.

In TypeScript, props can be defined like this:

```ts
class MyComponent extends Shoemaker {
  static tag = 'my-component';
  static props = ['value', 'disabled']; // make them reactive

  value: number = 0;
  disabled: boolean = false;

  // ...
}
```

<details>
<summary>JavaScript version</summary>
The same props can be defined in JavaScript like this:

```js
class MyComponent extends Shoemaker {
  constructor() {
    super();
    this.value = 0;
    this.disabled = false;
  }

  // ...
}

MyComponent.tag = 'my-component';
MyComponent.props = ['value', 'disabled']; // make them reactive

```
</details>

### Templates & rendering

Each component is rendered by its `render()` method, which must return a template. Templates are powered by [uhtml](https://github.com/WebReflection/uhtml), a performant, lightweight rendering library. No virtual DOM is used.

To create a template, import the `html` function from the Shoemaker package and use it like so:

```ts
class MyComponent extends Shoemaker {
  static tag = 'my-component';

  render() {
    return html`
      <div class="my-component">
        <slot />
      </div>
    `
  }
}
```

If this syntax looks new to you, take a moment to read about [tagged templates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) to better understand how they work.

Note: If your editor doesn't highlight the HTML in your templates, try using an extension such as [this one for VS Code](https://marketplace.visualstudio.com/items?itemName=bierner.lit-html).

Note: By design, Shoemaker components _always_ contain a [shadow root](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot) for encapsulation purposes, so to allow children you should include a [`<slot>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot) element. If you're not familiar with how custom element slots work, now is a good time to [study up on them](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_templates_and_slots).

#### Interpolation

You can use interpolation to make templates dynamic. Let's take another look at our counter example. Notice how the count is displayed using `${this.count}`? That simply outputs the currently value of the `count` prop, and since `count` is also listed as one our our static props, every time it changes the component will automatically rerender.

Also note how we're using `onclick` to watch for clicks. Although it looks the same, this isn't the standard `onclick` attribute. uthml interprets any `on` attribute as a listener and executes the associated expression when the event is emitted. Thus, clicking the button will increment `this.count` by one.

```ts
class MyCounter extends Shoemaker {
  static tag = 'my-counter';
  static props = ['count'];

  count = 0;

  render() {
    return html`
      <button type="button" onclick="${() => this.count++}">
        Count: ${this.count}
      </button>
    `;
  }
}
```

Another way to write this is to split the expression into a separate function. This time, we remove the arrow function and append `.bind(this)` so it's called with the correct context. We're also adding the `event` argument so we can log the event as an example.

```ts
class MyCounter extends Shoemaker {
  static tag = 'my-counter';
  static props = ['count'];

  count = 0;

  handleClick(event: MouseEvent) {
    this.count++;
    console.log(event);
  }

  render() {
    return html`
      <button type="button" onclick="${this.handleClick.bind(this)}">
        Count: ${this.count}
      </button>
    `;
  }
}
```

#### Passing properties

Attributes can only store string values, so to pass arrays, objects, and non-scalar values you should pass them as a property using the `.` prefix. Imagine we have a `<my-color-picker>` element that accepts an array of colors for its `swatches` prop. Using the dot prefix will ensure it receives the array correctly.

```ts
class MyComponent extends Shoemaker {
  
  // ...

  render() {
    const swatches = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

    return html`
      <my-color-picker .swatches=${swatches}>
    `;
  }
}
```

#### Boolean attributes

There's no such thing as boolean attributes in HTML, although we use them as such. Still, sometimes they're useful. Think of a `disabled` attribute with no value:

```html
<my-input disabled></my-input>
```

To render this, your template should look like this:

```ts
class MyInput extends Shoemaker {
  
  // ...

  render() {
    return html`
      <input disabled=${this.disabled ? true : null} />
    `;
  }
}
```

Note the use of `true` and `null` instead of `true` and `false`. Any prop that evaluates to `null` or `undefined` will be removed as an attribute.

#### Directives

Shoemaker exposes two helpful directives that make it easier to apply classes and styles to elements.

```ts
import { Shoemaker, html, classMap, styleMap } from '@shoelace-style/shoemaker';

class MyComponent extends Shoemaker {
  static tag = 'my-component';

  render() {
    return html`
      <div
        class=${classMap({
          foo: true,
          bar: true
        })}
        style=${styleMap({
          backgroundColor: 'blue',
          color: 'white'
        })}
      >
        ...
      </div>
    `;
  }
}
```

Any truthy value will add the class or style and any falsey value will remove it. This will render as:

```html
<div class="foo bar" style="background-color: blue; color: white;">
  ...
</div>
```

#### More about templates

There are some things you can't do in templates, such as using sparse attributes like `style="top:${x}; left${y}"` (instead, use ``style=${`top:${x}; left${y}`}``).

I'll expand this section of the docs more later, but for now, refer to [uhtml's API docs](https://github.com/WebReflection/uhtml#api-documentation) for details.

### Lifecyle methods

Shoemaker exposes intuitive lifecycle methods.

- `onConnect()` - Called when the component is connected to the DOM and all properties are set, but before the first render. This is a good place to fetch data and do other pre-render init. At this point, the component's internals are not yet available in the DOM.
- `onReady()` - Called after the first render. 
- `onDisconnect()` - Called when the component is disconnected from the DOM. This is a good place to cleanup listeners, observers, etc.

### Emitting events

Use the `emit()` method to emit custom events. By convention, and for maximum compatibility with frameworks, custom event names should be lower-kebab-case. For example, use `my-click` instead of `myClick`.

```ts
class MyEmit extends Shoemaker {
  static tag = 'my-emit';

  render() {
    return html`
      <button type="button" onclick="${() => this.emit('my-click')}">
        Click to emit an event
      </button>
    `;
  }
}
```

The `emit()` method accepts an optional second argument of `CustomEventInit` options (default values shown):

```ts
this.emit('my-click', {
  bubbles: true,
  cancelable: true,
  composed: true,
  detail: {
    /* this is where you can pass custom data to your event */
  }
});
```

### Methods

Define methods as you normally would on a class:

```ts
class MyMethod extends Shoemaker {
  static tag = 'my-method';

  public announce() {
    alert('Hey!');
  }

  // ...
}
```

To access a method on the element:

```html
<my-method></my-method>

<script>
  const el = document.querySelector('my-method');
  el.announce(); // alerts "Hey!"
</script>
```
