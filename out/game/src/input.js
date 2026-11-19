// Solmar Nights — keyboard and mouse input, mapped to game actions.
export class Input {
  constructor() {
    this.keys = {};
    this.pressed = {};
    this.mouse = { x: 0, y: 0, down: false };
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if (!this.keys[e.key.toLowerCase()]) this.pressed[e.key.toLowerCase()] = true;
      this.keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', () => { this.keys = {}; });
    window.addEventListener('mousemove', (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; });
    window.addEventListener('mousedown', () => { this.mouse.down = true; });
    window.addEventListener('mouseup', () => { this.mouse.down = false; });
  }

  // Snapshot of movement keys, then clear the one-frame pressed set.
  read() {
    const k = this.keys;
    const out = {
      up: k['w'] || k['arrowup'] || false,
      down: k['s'] || k['arrowdown'] || false,
      left: k['a'] || k['arrowleft'] || false,
      right: k['d'] || k['arrowright'] || false,
      run: k['shift'] || false,
      shoot: k[' '] || this.mouse.down,
    };
    return out;
  }

  wasPressed(key) {
    return !!this.pressed[key];
  }

  endFrame() {
    this.pressed = {};
  }
}
