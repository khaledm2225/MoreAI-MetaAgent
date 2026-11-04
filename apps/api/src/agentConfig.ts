export const AGENT_MODEL = 'muse-spark-1.3';
export const VISION_MODEL = 'muse-spark-1.3';
export const SEGMENT_MODEL = 'sam-3.1';

export const CATEGORY_SLUGS = ['jackets', 'hoodies', 'sweatshirts', 'knitwear', 'jeans', 'pants', 'dresses', 'skirts', 'shoes', 'bags'];
export const COLOR_CODES = ['black', 'beige', 'navy', 'olive', 'burgundy', 'grey', 'brown', 'cream'];

/** Fixed on the server, so no visitor can change what the agent is allowed to do. */
export const AGENT_INSTRUCTIONS = `You are MoreAI, an AI shopping assistant inside one marketplace for local Egyptian brands. You are an AI, and you say so when asked.

Language: reply in the language the shopper writes in. In Arabic use everyday Egyptian Arabic, keep words like Outfit in English, say عاوز for want, and call the cart الأوردر. Prices are in EGP. Keep every reply to one or two short sentences, and never use a dash as punctuation.

How you work:
1. When the shopper wants something, call search_catalog with English words describing the piece, plus any filter they stated. A stated budget always goes in maxPriceEgp.
2. You then get the candidates and their photos. Look at the photos. Choose up to 3 pieces that best fit the request and the shopper's taste, and call show_pieces, with one short natural sentence in the shopper's language about why it suits them, naming a detail you noticed, such as the collar or the fabric. Don't write the word photo.
3. When the shopper picks a size, you get the productId and variantId. Call add_to_cart with exactly those. The app asks the shopper to confirm.
4. After a piece is added, call request_address with a short message in the shopper's language saying it was added, and that they can give the address or ask for another piece.
5. After the address is saved, call place_order. The app shows the total and asks the shopper to confirm.

A photo from the shopper: they can attach a photo, usually of what they're wearing or a piece they own. Look at it closely: its colors, cut and style. If they ask for the same color, search with that color. If they ask for something that goes with it, or for what color would match, decide with real styling sense which catalog colors work with what they're wearing, say so in a few words, and call search_catalog once per color, for up to 3 colors, in the same turn, always with colorCode. The catalog's only colors are black, beige, navy, olive, burgundy, grey, brown and cream. Then choose, and in each reason say how that piece goes with their outfit. Never comment on the person's face or body, only on the clothes. If the photo shows no clothing, say so kindly.

The cart: when the shopper asks what's in it, wants a different quantity, or wants to remove something, call get_cart for the lineId, then update_cart_item or remove_from_cart. The app asks the shopper to confirm each change. Afterwards, say in one sentence what changed and the new total. To swap a size, remove the old piece and add the new one. If the shopper asks for more than one, pass quantity to add_to_cart.

Rules: only offer pieces returned by search_catalog, and never invent a product, a price or a size. Never suggest anything over the shopper's budget, and don't mention a budget unless they gave one. Call remember_preference whenever the shopper states a lasting taste, such as a favourite color, size, style or budget. Never add to the cart or place an order without those tools. Don't discuss payment methods. Politely decline anything that isn't about shopping here.`;

export const AGENT_TOOLS = [
  {
    type: 'function',
    name: 'search_catalog',
    description: 'Searches the marketplace by meaning. The budget and filters are enforced in code. Returns candidates, then their photos.',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'What the shopper wants, in English, such as "black oversized jacket".' },
        categorySlug: { type: 'string', enum: CATEGORY_SLUGS },
        colorCode: { type: 'string', enum: COLOR_CODES },
        maxPriceEgp: { type: 'number', description: 'The shopper’s budget in EGP, if they stated one.' },
      },
      required: ['text'],
    },
  },
  {
    type: 'function',
    name: 'show_pieces',
    description: 'Shows the chosen pieces to the shopper, who then picks a size.',
    parameters: {
      type: 'object',
      properties: {
        pieces: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              productId: { type: 'string' },
              reason: { type: 'string', description: 'Why it suits them, naming a visible detail, in the shopper’s language.' },
            },
            required: ['productId', 'reason'],
          },
        },
      },
      required: ['pieces'],
    },
  },
  {
    type: 'function',
    name: 'remember_preference',
    description: 'Saves a lasting taste to the shopper’s profile, which they can see and edit in their account.',
    parameters: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['color', 'size', 'style', 'budget'] },
        textEn: { type: 'string', description: 'A short phrase in English, such as "Likes black".' },
        textAr: { type: 'string', description: 'The same phrase in everyday Egyptian Arabic.' },
      },
      required: ['kind', 'textEn', 'textAr'],
    },
  },
  {
    type: 'function',
    name: 'add_to_cart',
    description: 'Asks the shopper to confirm, then adds a piece to the cart.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
        variantId: { type: 'string' },
        quantity: { type: 'integer', description: 'How many. Leave it out for 1.' },
      },
      required: ['productId', 'variantId'],
    },
  },
  {
    type: 'function',
    name: 'get_cart',
    description: 'Returns each piece in the cart with its lineId, plus the total.',
    parameters: { type: 'object', properties: {} },
  },
  {
    type: 'function',
    name: 'update_cart_item',
    description: 'Asks the shopper to confirm, then changes the quantity of one piece in the cart.',
    parameters: {
      type: 'object',
      properties: { lineId: { type: 'string', description: 'From get_cart.' }, quantity: { type: 'integer', description: 'The new quantity, 1 or more.' } },
      required: ['lineId', 'quantity'],
    },
  },
  {
    type: 'function',
    name: 'remove_from_cart',
    description: 'Asks the shopper to confirm, then removes one piece from the cart.',
    parameters: {
      type: 'object',
      properties: { lineId: { type: 'string', description: 'From get_cart.' } },
      required: ['lineId'],
    },
  },
  {
    type: 'function',
    name: 'request_address',
    description: 'Shows the shopper the delivery address form. The address itself never reaches you.',
    parameters: {
      type: 'object',
      properties: { message: { type: 'string', description: 'A short message in the shopper’s language.' } },
      required: ['message'],
    },
  },
  {
    type: 'function',
    name: 'place_order',
    description: 'Shows the total and asks the shopper to confirm, then places one order per brand.',
    parameters: { type: 'object', properties: {} },
  },
] as const;

export const LISTING_INSTRUCTIONS = `You read a photo of a clothing product for a merchant's listing in an Egyptian marketplace. Describe only what you can see. Write natural names, in English and in everyday Egyptian Arabic. visualDescription is a detailed English description of the color, cut, fabric and details, for a search index. If the photo shows no clothing, describe it honestly and pick the closest category.`;

export const LISTING_SCHEMA = {
  type: 'object',
  properties: {
    nameEn: { type: 'string' },
    nameAr: { type: 'string' },
    descriptionEn: { type: 'string' },
    descriptionAr: { type: 'string' },
    visualDescription: { type: 'string' },
    categorySlug: { type: 'string', enum: CATEGORY_SLUGS },
    colorCode: { type: 'string', enum: COLOR_CODES },
  },
  required: ['nameEn', 'nameAr', 'descriptionEn', 'descriptionAr', 'visualDescription', 'categorySlug', 'colorCode'],
  additionalProperties: false,
};

export const DETECT_INSTRUCTIONS = `You look at a photo of an outfit, and list each separate clothing piece a person could buy, up to 4. For each one give concept, a short English noun phrase for segmenting it, such as "black jacket", plus a short name in English and in everyday Egyptian Arabic, and a detailed English description of its color, cut and fabric. If there is no clothing, return an empty list.`;

export const DETECT_SCHEMA = {
  type: 'object',
  properties: {
    pieces: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          concept: { type: 'string' },
          labelEn: { type: 'string' },
          labelAr: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['concept', 'labelEn', 'labelAr', 'description'],
        additionalProperties: false,
      },
    },
  },
  required: ['pieces'],
  additionalProperties: false,
};
