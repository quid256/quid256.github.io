function cyrb128(str) {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  (h1 ^= h2 ^ h3 ^ h4), (h2 ^= h1), (h3 ^= h1), (h4 ^= h1);
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

/**
 * Returns a function that generates a new random number, based on a seed string
 */
export function sfc32(seed) {
  // Stores random state in closure
  let [a, b, c, d] = cyrb128(seed);

  return function () {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0;
    let t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

export function classNames(obj) {
  return Object.keys(obj)
    .filter((key) => obj[key])
    .join(" ");
}

function shuffle(rand, array, start, end) {
  let currentIndex = end;

  // While there remain elements to shuffle...
  while (currentIndex > start) {
    // Pick a remaining element...
    let randomIndex = Math.floor(rand() * (end - start)) + start;
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
}

/**
 * Constructs a random 5x5 magic square with 0 at the center, 0..24
 *
 * This magic square isn't actually random, completely -- that problem would
 * probably be a lot harder I would be a lot harder I would guess. Instead it
 * generates 2 orthogonal latin squares (kinda based on vibes, sorry) and uses
 * the superposition method to generate the magic squares.
 */
export function makeMagicSquare(rand) {
  let l1 = [0, 1, 2, 3, 4];
  let l2 = [0, 5, 10, 15, 20];
  shuffle(rand, l1, 1, 5);
  shuffle(rand, l2, 1, 5);

  const s1 = rand() < 0.5 ? 2 : 3;
  const s2 = 5 - s1;
  let magicSquare = [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ];

  // Sum the 2 latin squares
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      magicSquare[(i + 2) % 5][(j + s1 * i + 2) % 5] += l1[j];
      magicSquare[(i + 2) % 5][(j + s2 * i + 2) % 5] += l2[j];
    }
  }
  return magicSquare;
}
