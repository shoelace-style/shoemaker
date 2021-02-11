import { classMap, html, Shoemaker } from '../../shoemaker';

export default class extends Shoemaker {
  static tag = 'sl-test';
  static props = ['type', 'pill'];
  static reflect = ['type'];
  static styles = `
    .badge {
      background: blue;
      border-radius: .125rem;
      color: white;
      padding: .5rem .75rem;
    }

    .pill {
      border-radius: 9999px;
    }
  `;

  type: 'primary' | 'success' | 'info' | 'warning' | 'danger' = 'primary';
  pill = false;

  handleClick() {
    console.log('test: click');
  }

  render() {
    return html`
      <span
        class="${classMap({
          badge: true,
          pill: this.pill
        })}"
        onclick=${this.handleClick}
      >
        <slot></slot>
      </span>
    `;
  }
}
