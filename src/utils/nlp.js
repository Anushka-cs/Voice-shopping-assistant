// Tiny NLP utilities for parsing shopping voice commands.
// Handles: add/remove/modify with quantities; find/search with filters.
const numberWords = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10
};

function toNumber(token) {
  if (!token) return 1;
  const n = parseInt(token, 10);
  if (!isNaN(n)) return n;
  return numberWords[token.toLowerCase()] || 1;
}

export function parseCommand(text) {
  if (!text) return { action: "unknown" };
  const t = text.toLowerCase().trim();

  // Find/search commands
  let m = t.match(/^find( me)? (?<item>.+?)( under (?<max>\d+))?$/);
  if (!m) m = t.match(/^(search|look for) (?<item>.+?)( under (?<max>\d+))?$/);
  if (m) {
    return { action: "search", item: m.groups.item.trim(), maxPrice: m.groups?.max ? Number(m.groups.max) : undefined };
  }

  // Add commands
  // examples: "add 2 apples", "i need apples", "buy three milk", "add milk", "i want to buy 5 bananas"
  m = t.match(/^(add|buy|i need|i want to buy|put|include)\s+(?<qty>\d+|one|two|three|four|five|six|seven|eight|nine|ten)?\s*(?<item>.+)$/);
  if (m) {
    const qty = toNumber(m.groups.qty);
    return { action: "add", item: m.groups.item.trim(), qty };
  }

  // Remove commands
  m = t.match(/^(remove|delete|take (off|out))\s+(?<item>.+)$/);
  if (m) {
    return { action: "remove", item: m.groups.item.trim() };
  }

  // Change/modify quantity
  m = t.match(/^(change|set|update)\s+(?<item>.+?)\s+(to)\s+(?<qty>\d+|one|two|three|four|five|six|seven|eight|nine|ten)$/);
  if (m) {
    return { action: "modify", item: m.groups.item.trim(), qty: toNumber(m.groups.qty) };
  }

  // Quantity noun phrasing e.g., "add 2 bottles of water"
  m = t.match(/^(add|buy).+?(?<qty>\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(\w+\s+of\s+)?(?<item>.+)$/);
  if (m) {
    const qty = toNumber(m.groups.qty);
    return { action: "add", item: m.groups.item.trim(), qty };
  }

  return { action: "unknown" };
}

export function categorize(item) {
  const t = item.toLowerCase();
  const map = [
    { cat: "Dairy", kws: ["milk", "cheese", "yogurt", "butter", "paneer", "curd"] },
    { cat: "Produce", kws: ["apple", "banana", "orange", "tomato", "onion", "potato", "mango", "spinach"] },
    { cat: "Bakery", kws: ["bread", "bun", "bagel"] },
    { cat: "Snacks", kws: ["chips", "biscuits", "cookie", "namkeen"] },
    { cat: "Beverages", kws: ["juice", "soda", "tea", "coffee", "water"] },
    { cat: "Household", kws: ["soap", "detergent", "toothpaste", "shampoo"] }
  ];
  for (const { cat, kws } of map) {
    if (kws.some(k => t.includes(k))) return cat;
  }
  return "Other";
}
