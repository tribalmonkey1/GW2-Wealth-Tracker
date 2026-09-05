/**
 * Vendor prices: { itemId: { name, price (copper) } }
 * Sources: GW2 wiki, verified vendor costs.
 * (Split out of App.jsx — used by craftingCalc.js and CraftDetailBody.)
 */

export const VENDOR_PRICES = {
  // Spools of Thread (sold by discipline vendors)
  19792: { name: "Spool of Jute Thread",            price: 8   },
  19789: { name: "Spool of Wool Thread",             price: 16  },
  19791: { name: "Spool of Cotton Thread",           price: 24  },
  19790: { name: "Spool of Linen Thread",            price: 32  },
  19788: { name: "Spool of Silk Thread",             price: 48  },
  19793: { name: "Spool of Gossamer Thread",         price: 64  },
  // Ascended spools
  46740: { name: "Spool of Thick Elonian Cord",      price: 150 },
  46742: { name: "Spool of Silk Weaving Thread",     price: 150 },
  // Alloying Lumps (sold by discipline vendors)
  19704: { name: "Lump of Tin",                      price: 8   },
  19750: { name: "Lump of Coal",                     price: 8   },
  19924: { name: "Lump of Primordium",               price: 8   },
  46742: { name: "Lump of Mithrillium",              price: 150 },
  // Reagents
  46747: { name: "Thermocatalytic Reagent",          price: 150 },
  75919: { name: "Hydrocatalytic Reagent",           price: 150 },
  // Runes of Holding (bag crafting)
  19914: { name: "Rune of Holding",                  price: 72  },
  19915: { name: "Minor Rune of Holding",            price: 252 },
  19916: { name: "Major Rune of Holding",            price: 500 },
  19917: { name: "Superior Rune of Holding",         price: 1000_00 }, // 10g
  // Glass (Artificer/Chef)
  19985: { name: "Lump of Glass",                    price: 8  },
  // Jug of Water — vendor 10 for 80c = 8c each [wiki verified June 2026, API 12156]
  // NOTE: 12156 is Jug of Water, NOT Pouch of Black Pigment (fixed June 2026)
  12156: { name: "Jug of Water",                     price: 8   },
  // Dye pigments (Chef) [API verified June 2026]
  70426: { name: "Pouch of Black Pigment",           price: 8   },
  12151: { name: "Pouch of Red Pigment",             price: 8   },
  12152: { name: "Pouch of Orange Pigment",          price: 8   },
  12153: { name: "Pouch of Yellow Pigment",          price: 8   },
  12154: { name: "Pouch of Green Pigment",           price: 8   },
  12155: { name: "Pouch of Blue Pigment",            price: 8   },
  77112: { name: "Pouch of Purple Pigment",          price: 8   },
  12158: { name: "Pouch of White Pigment",           price: 8   },
  12159: { name: "Pouch of Brown Pigment",           price: 8   },
  // Flax seeds (Chef)
  36731: { name: "Pile of Flax Seeds",               price: 16  },
  // Vials (Artificer/Chef)
  8576:  { name: "Vial of Water",                    price: 8   },
  // Potions/misc
  12238: { name: "Thermocatalytic Reagent (old)",    price: 150 },
};
