import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { App } from '../src/ui/App.js';

// ink-testing-library gives us a fake stdout whose `.lastFrame()` returns the
// current Ink output as a string. After calling `stdin.write`, Ink's input
// pipeline dispatches asynchronously, so we need to yield the event loop
// before reading the next frame.

const tick = () => new Promise<void>((r) => setTimeout(r, 25));

describe('App', () => {
  it('renders the About section by default', async () => {
    const { lastFrame, unmount } = render(<App />);
    await tick();
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Jon Marien');
    expect(frame).toContain('chrono');
    unmount();
  });

  it('jumps to projects when the user presses `2`', async () => {
    const { stdin, lastFrame, unmount } = render(<App />);
    await tick();
    stdin.write('2');
    await tick();
    const frame = lastFrame() ?? '';
    expect(frame).toMatch(/projects/i);
    expect(frame).toMatch(/D-Sports|BearHacks|Nexus C2/);
    unmount();
  });

  it('opens a project detail view when the user presses enter', async () => {
    const { stdin, lastFrame, unmount } = render(<App />);
    await tick();
    stdin.write('2');            // switch to Projects
    await tick();
    stdin.write('\t');           // tab → focus content
    await tick();
    stdin.write('\r');           // enter on first project
    await tick();
    const frame = lastFrame() ?? '';
    expect(frame).toContain('projects / ');
    expect(frame.toLowerCase()).toContain('back to list');
    unmount();
  });
});
