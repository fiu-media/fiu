/** The most of one item a quote line can hold, whatever the item's own cap. */
export const MAX_QTY = 99;

/** A whole quantity from 1 up to the item's cap (and never past `MAX_QTY`). Plain module: server code uses it too. */
export const clampQty = (qty: number, max = MAX_QTY) => Math.min(max, MAX_QTY, Math.max(1, Math.floor(qty)));
