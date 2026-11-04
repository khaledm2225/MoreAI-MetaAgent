import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TextField } from './TextField';

describe('TextField', () => {
  it('ties its visible label to the field', () => {
    render(<TextField label="Name" />);
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
  });

  it('lets typed text find its own direction, for Arabic and English', () => {
    render(<TextField label="Name" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('dir', 'auto');
  });

  it('reports what is typed', async () => {
    const onChange = vi.fn();
    render(<TextField label="Name" onChange={onChange} />);
    await userEvent.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('describes the field with its hint', () => {
    render(<TextField label="Name" hint="As on your order" />);
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('As on your order');
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
  });

  it('marks the field invalid and reads out the error', () => {
    render(<TextField label="Name" error="Required" />);
    const field = screen.getByRole('textbox');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription('Required');
  });

  it('reads both when it has a hint and an error', () => {
    render(<TextField label="Name" hint="As on your order" error="Required" />);
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('As on your order Required');
  });

  it('has no description when it has nothing to add', () => {
    render(<TextField label="Name" />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
  });

  it('becomes a text area when multiline', () => {
    render(<TextField label="Message" multiline />);
    expect(screen.getByRole('textbox', { name: 'Message' }).tagName).toBe('TEXTAREA');
  });

  it('is an input otherwise, and takes its attributes', () => {
    render(<TextField label="Email" type="email" placeholder="you@example.com" />);
    const field = screen.getByRole('textbox', { name: 'Email' });
    expect(field.tagName).toBe('INPUT');
    expect(field).toHaveAttribute('type', 'email');
    expect(field).toHaveAttribute('placeholder', 'you@example.com');
  });

  it('hands its element to the parent', () => {
    const ref = createRef<HTMLInputElement | HTMLTextAreaElement>();
    render(<TextField label="Name" ref={ref} />);
    expect(ref.current).toBe(screen.getByRole('textbox'));
  });

  it('gives every field its own id', () => {
    render(
      <>
        <TextField label="One" />
        <TextField label="Two" />
      </>,
    );
    expect(screen.getByRole('textbox', { name: 'One' }).id).not.toBe(
      screen.getByRole('textbox', { name: 'Two' }).id,
    );
  });
});
