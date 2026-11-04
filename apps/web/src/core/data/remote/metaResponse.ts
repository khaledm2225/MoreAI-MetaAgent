import type { PieceBox } from '../../domain/vision';
import type { MetaOutputItem, MetaResponse } from './api';

export function outputTextOf(response: MetaResponse): string {
  return response.output
    .filter((item) => item.type === 'message')
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === 'output_text')
    .map((part) => part.text ?? '')
    .join('')
    .trim();
}

export type FunctionCall = Required<Pick<MetaOutputItem, 'name' | 'call_id'>> & { readonly arguments: string };

export function functionCallsOf(response: MetaResponse): readonly FunctionCall[] {
  return response.output.flatMap((item) =>
    item.type === 'function_call' && item.name !== undefined && item.call_id !== undefined
      ? [{ name: item.name, call_id: item.call_id, arguments: item.arguments ?? '{}' }]
      : [],
  );
}

/** Tool arguments are guided by the schema but never guaranteed, so they're checked here. */
export function argumentsOf(call: Pick<FunctionCall, 'arguments'>): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(call.arguments);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

const BOX = /<\|box;x1=(\d+);y1=(\d+);x2=(\d+);y2=(\d+);w=(\d+);h=(\d+)/;

/** The first object SAM found, as fractions of the photo. It skips the mask, which this screen doesn't draw. */
export function firstBoxOf(samText: string): PieceBox | null {
  const match = BOX.exec(samText);
  if (match === null) {
    return null;
  }
  const [x1, y1, x2, y2, width, height] = match.slice(1).map(Number) as [number, number, number, number, number, number];
  if (width === 0 || height === 0) {
    return null;
  }
  return { left: x1 / width, top: y1 / height, right: x2 / width, bottom: y2 / height };
}
