import type { CategoryDto, ProductDto, ProductImageDto, ProductVariantDto } from '@maison-elise/shared';

export interface DemoProduct extends ProductDto {
  shortDescription: string;
}

type Gender = 'women' | 'men';

type DemoCategorySlug =
  | 'women-dresses'
  | 'women-blazers'
  | 'women-trousers'
  | 'women-tops'
  | 'women-skirts'
  | 'women-knitwear'
  | 'women-outerwear'
  | 'women-denim'
  | 'men-shirts'
  | 'men-trousers'
  | 'men-blazers'
  | 'men-tshirts'
  | 'men-knitwear'
  | 'men-outerwear'
  | 'men-denim';

interface DemoProductSeed {
  slug: string;
  name: string;
  gender: Gender;
  category: DemoCategorySlug;
  price: number;
  compareAtPrice?: number;
  shortDescription: string;
  description: string;
  sizes: readonly string[];
  colors: readonly string[];
  image: string;
  isNew?: boolean;
  isFeatured?: boolean;
}

const CATEGORY = {
  women: { id: 'demo-cat-women', name: 'Women', slug: 'women' },
  men: { id: 'demo-cat-men', name: 'Men', slug: 'men' },
  'women-dresses': {
    id: 'demo-cat-women-dresses',
    name: "Women's Dresses",
    slug: 'women-dresses',
  },
  'women-blazers': {
    id: 'demo-cat-women-blazers',
    name: "Women's Blazers & Jackets",
    slug: 'women-blazers',
  },
  'women-trousers': {
    id: 'demo-cat-women-trousers',
    name: "Women's Trousers",
    slug: 'women-trousers',
  },
  'women-tops': {
    id: 'demo-cat-women-tops',
    name: "Women's Tops & Blouses",
    slug: 'women-tops',
  },
  'women-skirts': {
    id: 'demo-cat-women-skirts',
    name: "Women's Skirts",
    slug: 'women-skirts',
  },
  'women-knitwear': {
    id: 'demo-cat-women-knitwear',
    name: "Women's Knitwear",
    slug: 'women-knitwear',
  },
  'women-outerwear': {
    id: 'demo-cat-women-outerwear',
    name: "Women's Coats & Outerwear",
    slug: 'women-outerwear',
  },
  'women-denim': {
    id: 'demo-cat-women-denim',
    name: "Women's Denim",
    slug: 'women-denim',
  },
  'men-shirts': { id: 'demo-cat-men-shirts', name: "Men's Shirts", slug: 'men-shirts' },
  'men-trousers': {
    id: 'demo-cat-men-trousers',
    name: "Men's Trousers & Chinos",
    slug: 'men-trousers',
  },
  'men-blazers': {
    id: 'demo-cat-men-blazers',
    name: "Men's Blazers & Jackets",
    slug: 'men-blazers',
  },
  'men-tshirts': {
    id: 'demo-cat-men-tshirts',
    name: "Men's T-Shirts & Polos",
    slug: 'men-tshirts',
  },
  'men-knitwear': {
    id: 'demo-cat-men-knitwear',
    name: "Men's Knitwear",
    slug: 'men-knitwear',
  },
  'men-outerwear': {
    id: 'demo-cat-men-outerwear',
    name: "Men's Coats & Outerwear",
    slug: 'men-outerwear',
  },
  'men-denim': { id: 'demo-cat-men-denim', name: "Men's Denim", slug: 'men-denim' },
} as const satisfies Record<string, CategoryDto>;

export const demoCategories: CategoryDto[] = [
  CATEGORY.women,
  CATEGORY.men,
  CATEGORY['women-dresses'],
  CATEGORY['women-blazers'],
  CATEGORY['women-trousers'],
  CATEGORY['women-tops'],
  CATEGORY['women-skirts'],
  CATEGORY['women-knitwear'],
  CATEGORY['women-outerwear'],
  CATEGORY['women-denim'],
  CATEGORY['men-shirts'],
  CATEGORY['men-trousers'],
  CATEGORY['men-blazers'],
  CATEGORY['men-tshirts'],
  CATEGORY['men-knitwear'],
  CATEGORY['men-outerwear'],
  CATEGORY['men-denim'],
];

const WOMEN_SIZES = ['XS', 'S', 'M', 'L', 'XL'] as const;
const MEN_SIZES = ['S', 'M', 'L', 'XL'] as const;

const productSeeds: DemoProductSeed[] = [
  {
    slug: 'juliette-mini-dress',
    name: 'Juliette Mini Dress',
    gender: 'women',
    category: 'women-dresses',
    price: 145,
    compareAtPrice: 185,
    shortDescription: 'A sharp little dress with a soft, fluid line.',
    description:
      'Cut from a fluid crepe with a gently fitted bodice and a softly flared hem, Juliette is a modern mini designed to move between day and evening. Finished with a concealed back zip and a clean, collarless neckline.',
    sizes: WOMEN_SIZES,
    colors: ['Black', 'Ivory'],
    image: 'juliette-mini-dress.webp',
    isNew: true,
  },
  {
    slug: 'camille-midi-shirt-dress',
    name: 'Camille Midi Shirt Dress',
    gender: 'women',
    category: 'women-dresses',
    price: 195,
    shortDescription: 'A relaxed shirt dress in crisp cotton poplin.',
    description:
      'Camille borrows the ease of a shirt and the polish of a dress: a defined waist, a fluid midi skirt and tonal buttons down the front. Belt it for structure or wear it open over trousers.',
    sizes: WOMEN_SIZES,
    colors: ['Beige', 'Black'],
    image: 'camille-midi-shirt-dress.webp',
    isNew: true,
  },
  {
    slug: 'severine-silk-maxi-dress',
    name: 'Séverine Silk Maxi Dress',
    gender: 'women',
    category: 'women-dresses',
    price: 295,
    shortDescription: 'A floor-skimming silk column with a quiet sheen.',
    description:
      'Séverine is cut on the bias from mulberry silk, falling in a long, liquid line from a softly draped neckline. The maxi length and restrained palette make it an effortless choice for evening.',
    sizes: WOMEN_SIZES,
    colors: ['Black', 'Burgundy'],
    image: 'severine-silk-maxi-dress.webp',
  },
  {
    slug: 'margot-evening-column-dress',
    name: 'Margot Evening Column Dress',
    gender: 'women',
    category: 'women-dresses',
    price: 345,
    shortDescription: 'An elegant column silhouette for late evenings.',
    description:
      'Margot is sculpted from stretch crepe with a draped neckline and a clean, floor-grazing hem. The close fit and deep palette give it a poised, modern formality.',
    sizes: WOMEN_SIZES,
    colors: ['Black', 'Burgundy'],
    image: 'margot-evening-column-dress.webp',
    isNew: true,
    isFeatured: true,
  },
  {
    slug: 'aurelia-satin-slip-dress',
    name: 'Aurelia Satin Slip Dress',
    gender: 'women',
    category: 'women-dresses',
    price: 189,
    shortDescription: 'A bias-cut slip in luminous satin.',
    description:
      'Aurelia skims the body in fluid satin, with delicate adjustable straps and a softly cowled neckline. Wear it alone for evening or layer it under knitwear for a quieter take.',
    sizes: WOMEN_SIZES,
    colors: ['Black', 'Ivory', 'Burgundy'],
    image: 'aurelia-satin-slip-dress.webp',
    isFeatured: true,
  },
  {
    slug: 'amelie-knit-midi-dress',
    name: 'Amélie Knit Midi Dress',
    gender: 'women',
    category: 'women-dresses',
    price: 260,
    shortDescription: 'A fine-gauge knit dress with a soft, body-skimming line.',
    description:
      'Knitted from a merino blend with a subtle rib, Amélie follows the figure without clinging. The midi hem and clean neckline make it an easy layer for cooler days.',
    sizes: WOMEN_SIZES,
    colors: ['Beige', 'Brown'],
    image: 'amelie-knit-midi-dress.webp',
    isFeatured: true,
  },
  {
    slug: 'elise-tailored-blazer',
    name: 'Elise Tailored Blazer',
    gender: 'women',
    category: 'women-blazers',
    price: 385,
    shortDescription: 'A sharply tailored single-breasted blazer.',
    description:
      'Cut from Italian wool with structured shoulders and a clean, single-button close, Elise brings quiet authority to tailoring. Fully lined and finished with a soft roll lapel.',
    sizes: WOMEN_SIZES,
    colors: ['Black', 'Beige'],
    image: 'elise-tailored-blazer.webp',
    isFeatured: true,
  },
  {
    slug: 'vivienne-cropped-tweed-jacket',
    name: 'Vivienne Cropped Tweed Jacket',
    gender: 'women',
    category: 'women-blazers',
    price: 320,
    shortDescription: 'A cropped tweed jacket with a refined, vintage feel.',
    description:
      'Woven from a textured wool tweed, Vivienne is cut close to the body with a collarless neckline and a cropped hem. Polished buttons and a delicate frayed edge complete the piece.',
    sizes: WOMEN_SIZES,
    colors: ['Brown', 'Black'],
    image: 'vivienne-cropped-tweed-jacket.webp',
    isNew: true,
  },
  {
    slug: 'helene-double-breasted-blazer',
    name: 'Hélène Double-Breasted Blazer',
    gender: 'women',
    category: 'women-blazers',
    price: 365,
    shortDescription: 'A confident double-breasted blazer in fluid wool.',
    description:
      'Hélène is tailored with a strong shoulder, peaked lapels and a softly suppressed waist. The double-breasted front and longline hem make it a defining layer over denim or tailoring.',
    sizes: WOMEN_SIZES,
    colors: ['Black', 'Beige'],
    image: 'helene-double-breasted-blazer.webp',
  },
  {
    slug: 'lea-linen-blazer',
    name: 'Léa Linen Blazer',
    gender: 'women',
    category: 'women-blazers',
    price: 265,
    compareAtPrice: 320,
    shortDescription: 'An unstructured linen blazer for warmer days.',
    description:
      'Cut from washed European linen, Léa has a relaxed shoulder and a clean, single-breasted line. Light enough to layer, polished enough to wear on its own.',
    sizes: WOMEN_SIZES,
    colors: ['Beige', 'Ivory'],
    image: 'lea-linen-blazer.webp',
    isNew: true,
  },
  {
    slug: 'camille-wide-leg-trousers',
    name: 'Camille Wide-Leg Trousers',
    gender: 'women',
    category: 'women-trousers',
    price: 210,
    shortDescription: 'High-waisted trousers with a fluid wide leg.',
    description:
      'Camille falls from a clean waistband into a generous wide leg that moves with the body. Cut from a wool-blend suiting fabric with a pressed crease and a discreet hook closure.',
    sizes: WOMEN_SIZES,
    colors: ['Black', 'Beige', 'Brown'],
    image: 'camille-wide-leg-trousers.webp',
    isFeatured: true,
  },
  {
    slug: 'margaux-pleated-trousers',
    name: 'Margaux Pleated Trousers',
    gender: 'women',
    category: 'women-trousers',
    price: 195,
    shortDescription: 'Tailored trousers with a soft front pleat.',
    description:
      'Margaux is cut with a high rise and a single forward pleat that adds volume through the leg. The tapered ankle and clean waistband keep the line sharp.',
    sizes: WOMEN_SIZES,
    colors: ['Beige', 'Black'],
    image: 'margaux-pleated-trousers.webp',
  },
  {
    slug: 'ines-slim-tailored-trousers',
    name: 'Inès Slim Tailored Trousers',
    gender: 'women',
    category: 'women-trousers',
    price: 185,
    shortDescription: 'A slim, ankle-length trouser with a clean finish.',
    description:
      'Inès is tailored from stretch suiting with a narrow leg and a precise ankle length. A versatile foundation for blazers, knits and silk shirts.',
    sizes: WOMEN_SIZES,
    colors: ['Black', 'Brown'],
    image: 'ines-slim-tailored-trousers.webp',
  },
  {
    slug: 'josephine-high-waist-trousers',
    name: 'Josephine High-Waist Trousers',
    gender: 'women',
    category: 'women-trousers',
    price: 175,
    shortDescription: 'A high-rise trouser with an elongated line.',
    description:
      'Josephine sits at the natural waist and falls in a straight, elongated line. Cut from a soft wool blend with side pockets and a concealed front fastening.',
    sizes: WOMEN_SIZES,
    colors: ['Black', 'Beige'],
    image: 'josephine-high-waist-trousers.webp',
  },
  {
    slug: 'noemie-silk-blouse',
    name: 'Noémie Silk Blouse',
    gender: 'women',
    category: 'women-tops',
    price: 180,
    shortDescription: 'A weightless silk blouse with a relaxed drape.',
    description:
      'Noémie is cut from sand-washed silk with a soft collar and mother-of-pearl buttons. The relaxed fit and fluid drape make it an effortless layer for day or evening.',
    sizes: WOMEN_SIZES,
    colors: ['Ivory', 'Black', 'Beige'],
    image: 'noemie-silk-blouse.webp',
    isNew: true,
    isFeatured: true,
  },
  {
    slug: 'jasmine-linen-shirt',
    name: 'Jasmine Linen Shirt',
    gender: 'women',
    category: 'women-tops',
    price: 145,
    shortDescription: 'An easy linen shirt with a soft, lived-in finish.',
    description:
      'Cut from washed European linen, Jasmine has a relaxed body, a soft collar and a curved hem. Wear it buttoned, open or half-tucked for an unstudied line.',
    sizes: WOMEN_SIZES,
    colors: ['Ivory', 'Black'],
    image: 'jasmine-linen-shirt.webp',
  },
  {
    slug: 'clara-satin-camisole',
    name: 'Clara Satin Camisole',
    gender: 'women',
    category: 'women-tops',
    price: 95,
    shortDescription: 'A delicate satin camisole with a clean, bias-cut line.',
    description:
      'Clara is cut on the bias from fluid satin, with fine adjustable straps and a softly draped neckline. An understated layer beneath tailoring or worn alone after dark.',
    sizes: WOMEN_SIZES,
    colors: ['Black', 'Ivory'],
    image: 'clara-satin-camisole.webp',
    isNew: true,
  },
  {
    slug: 'anais-poplin-shirt',
    name: 'Anaïs Poplin Shirt',
    gender: 'women',
    category: 'women-tops',
    price: 135,
    shortDescription: 'A crisp poplin shirt with a sculpted sleeve.',
    description:
      'Anaïs is tailored from cotton poplin with a neat collar, a clean placket and a gently gathered sleeve. The close fit and crisp finish make it a modern essential.',
    sizes: WOMEN_SIZES,
    colors: ['Ivory', 'Black'],
    image: 'anais-poplin-shirt.webp',
  },
  {
    slug: 'colette-pleated-midi-skirt',
    name: 'Colette Pleated Midi Skirt',
    gender: 'women',
    category: 'women-skirts',
    price: 185,
    shortDescription: 'A fine pleated midi skirt with quiet movement.',
    description:
      'Colette is pleated from a lightweight crepe that catches the light as it moves. The midi length and clean waistband keep the silhouette refined.',
    sizes: WOMEN_SIZES,
    colors: ['Beige', 'Black', 'Brown'],
    image: 'colette-pleated-midi-skirt.webp',
    isFeatured: true,
  },
  {
    slug: 'manon-bias-cut-slip-skirt',
    name: 'Manon Bias-Cut Slip Skirt',
    gender: 'women',
    category: 'women-skirts',
    price: 165,
    shortDescription: 'A fluid bias-cut skirt with a subtle sheen.',
    description:
      'Manon falls in a soft, diagonal line from a clean waistband. Cut from satin-backed crepe, it moves with the body and pairs easily with knitwear or tailoring.',
    sizes: WOMEN_SIZES,
    colors: ['Black', 'Beige'],
    image: 'manon-bias-cut-slip-skirt.webp',
    isNew: true,
  },
  {
    slug: 'delphine-a-line-skirt',
    name: 'Delphine A-Line Skirt',
    gender: 'women',
    category: 'women-skirts',
    price: 155,
    shortDescription: 'An elegant A-line skirt with a clean, flared hem.',
    description:
      'Delphine is cut from structured wool crepe with a high waist and a gentle A-line flare. The midi length and concealed zip keep the finish precise.',
    sizes: WOMEN_SIZES,
    colors: ['Black', 'Burgundy'],
    image: 'delphine-a-line-skirt.webp',
  },
  {
    slug: 'ines-cashmere-crewneck',
    name: 'Inès Cashmere Crewneck',
    gender: 'women',
    category: 'women-knitwear',
    price: 290,
    shortDescription: 'A soft cashmere crewneck in a fine gauge.',
    description:
      'Spun from grade-A cashmere, Inès is light, warm and quietly luxurious. The clean crew neck and relaxed body make it a year-round layer.',
    sizes: WOMEN_SIZES,
    colors: ['Ivory', 'Beige', 'Brown'],
    image: 'ines-cashmere-crewneck.webp',
    isFeatured: true,
  },
  {
    slug: 'elodie-ribbed-cardigan',
    name: 'Élodie Ribbed Cardigan',
    gender: 'women',
    category: 'women-knitwear',
    price: 195,
    shortDescription: 'A fine ribbed cardigan with a soft, close fit.',
    description:
      'Élodie is knitted from a merino blend in a delicate rib, with a round neckline and tonal buttons. Wear it buttoned as a top or open over a slip dress.',
    sizes: WOMEN_SIZES,
    colors: ['Beige', 'Ivory'],
    image: 'elodie-ribbed-cardigan.webp',
  },
  {
    slug: 'lucie-merino-turtleneck',
    name: 'Lucie Merino Turtleneck',
    gender: 'women',
    category: 'women-knitwear',
    price: 165,
    shortDescription: 'A fine merino turtleneck with a sculpted neck.',
    description:
      'Lucie is knitted from extra-fine merino for a soft, second-skin feel. The high neck and slim body make it an elegant base layer.',
    sizes: WOMEN_SIZES,
    colors: ['Black', 'Ivory', 'Burgundy'],
    image: 'lucie-merino-turtleneck.webp',
  },
  {
    slug: 'clara-wool-coat',
    name: 'Clara Wool Coat',
    gender: 'women',
    category: 'women-outerwear',
    price: 445,
    shortDescription: 'A longline coat in double-faced wool.',
    description:
      'Clara is cut from double-faced wool with a clean shoulder and a softly belted waist. The longline silhouette and hand-finished edges make it a piece to keep for years.',
    sizes: WOMEN_SIZES,
    colors: ['Beige', 'Black'],
    image: 'clara-wool-coat.webp',
    isNew: true,
    isFeatured: true,
  },
  {
    slug: 'beatrice-trench-coat',
    name: 'Béatrice Trench Coat',
    gender: 'women',
    category: 'women-outerwear',
    price: 395,
    shortDescription: 'A modern trench in water-resistant cotton gabardine.',
    description:
      'Béatrice reworks the classic trench with a relaxed shoulder, a clean belt and a fluid calf-length hem. Cut from cotton gabardine with a subtle sheen.',
    sizes: WOMEN_SIZES,
    colors: ['Beige', 'Black'],
    image: 'beatrice-trench-coat.webp',
    isFeatured: true,
  },
  {
    slug: 'marguerite-quilted-jacket',
    name: 'Marguerite Quilted Jacket',
    gender: 'women',
    category: 'women-outerwear',
    price: 285,
    shortDescription: 'A lightly quilted jacket with a soft, rounded line.',
    description:
      'Marguerite is quilted from a matte recycled shell with a high collar and a gently cropped hem. Lightweight and warm, it layers easily over knitwear.',
    sizes: WOMEN_SIZES,
    colors: ['Brown', 'Black'],
    image: 'marguerite-quilted-jacket.webp',
  },
  {
    slug: 'louise-straight-leg-jeans',
    name: 'Louise Straight-Leg Jeans',
    gender: 'women',
    category: 'women-denim',
    price: 145,
    shortDescription: 'A classic straight-leg jean in rigid denim.',
    description:
      'Louise is cut from rigid Italian denim with a high rise and a clean straight leg. The dark indigo wash and minimal detailing give it a refined, everyday finish.',
    sizes: WOMEN_SIZES,
    colors: ['Indigo', 'Black'],
    image: 'louise-straight-leg-jeans.webp',
  },
  {
    slug: 'adele-high-rise-wide-jeans',
    name: 'Adèle High-Rise Wide Jeans',
    gender: 'women',
    category: 'women-denim',
    price: 155,
    shortDescription: 'A high-rise jean with a relaxed wide leg.',
    description:
      'Adèle sits at the natural waist and falls into a generous wide leg. Cut from soft cotton denim with a clean hem and a subtle vintage wash.',
    sizes: WOMEN_SIZES,
    colors: ['Indigo', 'Stone'],
    image: 'adele-high-rise-wide-jeans.webp',
  },
  {
    slug: 'rose-denim-jacket',
    name: 'Rose Denim Jacket',
    gender: 'women',
    category: 'women-denim',
    price: 175,
    shortDescription: 'A cropped denim jacket with a soft, worn-in finish.',
    description:
      'Rose is cut from mid-weight cotton denim with a boxy body, dropped shoulders and a cropped hem. A versatile layer over dresses, tailoring and knitwear.',
    sizes: WOMEN_SIZES,
    colors: ['Indigo', 'Black'],
    image: 'rose-denim-jacket.webp',
    isNew: true,
  },
  {
    slug: 'henri-oxford-shirt',
    name: 'Henri Oxford Shirt',
    gender: 'men',
    category: 'men-shirts',
    price: 95,
    compareAtPrice: 120,
    shortDescription: 'A classic Oxford shirt in long-staple cotton.',
    description:
      'Henri is cut from long-staple Oxford cotton with a soft button-down collar and a clean, regular fit. A quietly dependable shirt for work and weekends.',
    sizes: MEN_SIZES,
    colors: ['Ivory', 'Black'],
    image: 'henri-oxford-shirt.webp',
    isNew: true,
  },
  {
    slug: 'lucien-linen-shirt',
    name: 'Lucien Linen Shirt',
    gender: 'men',
    category: 'men-shirts',
    price: 115,
    shortDescription: 'A relaxed linen shirt with a soft, breathable hand.',
    description:
      'Lucien is cut from washed European linen with a relaxed body and a natural, slightly rumpled finish. Wear it open over a tee or buttoned with tailored trousers.',
    sizes: MEN_SIZES,
    colors: ['Beige', 'Ivory'],
    image: 'lucien-linen-shirt.webp',
    isNew: true,
  },
  {
    slug: 'edouard-formal-shirt',
    name: 'Édouard Formal Shirt',
    gender: 'men',
    category: 'men-shirts',
    price: 135,
    shortDescription: 'A precise formal shirt in smooth cotton poplin.',
    description:
      'Édouard is tailored from two-ply cotton poplin with a sharp point collar and a clean placket. The slim fit and crisp finish make it an easy choice for formal occasions.',
    sizes: MEN_SIZES,
    colors: ['Black', 'Ivory'],
    image: 'edouard-formal-shirt.webp',
  },
  {
    slug: 'theo-brushed-cotton-shirt',
    name: 'Théo Brushed Cotton Shirt',
    gender: 'men',
    category: 'men-shirts',
    price: 105,
    shortDescription: 'A soft brushed-cotton shirt for cooler days.',
    description:
      'Théo is cut from brushed cotton with a warm, flannel-like hand and a relaxed collar. The muted palette and clean lines keep it polished without feeling formal.',
    sizes: MEN_SIZES,
    colors: ['Beige', 'Brown'],
    image: 'theo-brushed-cotton-shirt.webp',
  },
  {
    slug: 'julien-striped-poplin-shirt',
    name: 'Julien Striped Poplin Shirt',
    gender: 'men',
    category: 'men-shirts',
    price: 110,
    shortDescription: 'A striped poplin shirt with a modern, clean line.',
    description:
      'Julien is cut from crisp cotton poplin in a fine tonal stripe, with a neat collar and a regular fit. An easy layer under tailoring or worn open at the weekend.',
    sizes: MEN_SIZES,
    colors: ['Ivory', 'Navy'],
    image: 'julien-striped-poplin-shirt.webp',
  },
  {
    slug: 'antoine-pleated-chinos',
    name: 'Antoine Pleated Chinos',
    gender: 'men',
    category: 'men-trousers',
    price: 135,
    shortDescription: 'Pleated chinos with a relaxed, tailored line.',
    description:
      'Antoine is cut from garment-dyed cotton twill with a single forward pleat and a tapered leg. The soft finish and clean waistband make them an easy bridge between smart and casual.',
    sizes: MEN_SIZES,
    colors: ['Beige', 'Black'],
    image: 'antoine-pleated-chinos.webp',
  },
  {
    slug: 'victor-tailored-trousers',
    name: 'Victor Tailored Trousers',
    gender: 'men',
    category: 'men-trousers',
    price: 175,
    shortDescription: 'Sharp tailored trousers in Italian wool.',
    description:
      'Victor is cut from a mid-weight Italian wool with a clean flat front and a precise taper. Finished with a pressed crease and a concealed hook closure.',
    sizes: MEN_SIZES,
    colors: ['Black', 'Navy'],
    image: 'victor-tailored-trousers.webp',
  },
  {
    slug: 'hugo-cotton-chinos',
    name: 'Hugo Cotton Chinos',
    gender: 'men',
    category: 'men-trousers',
    price: 125,
    compareAtPrice: 155,
    shortDescription: 'Everyday chinos in soft cotton twill.',
    description:
      'Hugo is cut from washed cotton twill with a comfortable regular fit and a clean, straight leg. A versatile foundation for shirts, knits and tees.',
    sizes: MEN_SIZES,
    colors: ['Beige', 'Olive'],
    image: 'hugo-cotton-chinos.webp',
  },
  {
    slug: 'marcel-wool-trousers',
    name: 'Marcel Wool Trousers',
    gender: 'men',
    category: 'men-trousers',
    price: 195,
    shortDescription: 'Refined wool trousers with a soft, fluid drape.',
    description:
      'Marcel is tailored from a wool-blend flannel with a high rise and a gently tapered leg. The brushed finish and clean lines give it a quiet formality.',
    sizes: MEN_SIZES,
    colors: ['Black', 'Grey'],
    image: 'marcel-wool-trousers.webp',
  },
  {
    slug: 'leon-corduroy-trousers',
    name: 'Léon Corduroy Trousers',
    gender: 'men',
    category: 'men-trousers',
    price: 145,
    shortDescription: 'Soft corduroy trousers with a relaxed, vintage feel.',
    description:
      'Léon is cut from fine-wale cotton corduroy with a comfortable straight leg and a clean waistband. Warm, textural and easy to wear through the cooler months.',
    sizes: MEN_SIZES,
    colors: ['Brown', 'Olive'],
    image: 'leon-corduroy-trousers.webp',
  },
  {
    slug: 'bastien-tailored-blazer',
    name: 'Bastien Tailored Blazer',
    gender: 'men',
    category: 'men-blazers',
    price: 365,
    shortDescription: 'A single-breasted blazer with a clean, modern cut.',
    description:
      'Bastien is tailored from Italian wool with a soft shoulder, a clean notch lapel and a two-button close. Fully lined and finished with a subtle pick stitch.',
    sizes: MEN_SIZES,
    colors: ['Navy', 'Black'],
    image: 'bastien-tailored-blazer.webp',
    isNew: true,
    isFeatured: true,
  },
  {
    slug: 'charles-double-breasted-blazer',
    name: 'Charles Double-Breasted Blazer',
    gender: 'men',
    category: 'men-blazers',
    price: 395,
    shortDescription: 'A double-breasted blazer with a confident silhouette.',
    description:
      'Charles is cut with a structured shoulder, peaked lapels and a softly suppressed waist. The double-breasted front and deep navy tone make it a defining layer.',
    sizes: MEN_SIZES,
    colors: ['Navy', 'Black'],
    image: 'charles-double-breasted-blazer.webp',
  },
  {
    slug: 'raphael-linen-blazer',
    name: 'Raphaël Linen Blazer',
    gender: 'men',
    category: 'men-blazers',
    price: 295,
    shortDescription: 'An unstructured linen blazer for warm evenings.',
    description:
      'Raphaël is cut from washed linen with a relaxed shoulder and a clean, single-breasted line. Light enough for summer, polished enough for evening.',
    sizes: MEN_SIZES,
    colors: ['Beige', 'Ivory'],
    image: 'raphael-linen-blazer.webp',
  },
  {
    slug: 'olivier-tweed-jacket',
    name: 'Olivier Tweed Jacket',
    gender: 'men',
    category: 'men-blazers',
    price: 325,
    shortDescription: 'A textured tweed jacket with a tailored line.',
    description:
      'Olivier is woven from a soft wool tweed with a subtle check, cut with a clean shoulder and a two-button front. A refined layer for city and country alike.',
    sizes: MEN_SIZES,
    colors: ['Grey', 'Brown'],
    image: 'olivier-tweed-jacket.webp',
  },
  {
    slug: 'louis-cotton-t-shirt',
    name: 'Louis Cotton T-Shirt',
    gender: 'men',
    category: 'men-tshirts',
    price: 55,
    shortDescription: 'A heavyweight cotton T-shirt with a clean line.',
    description:
      'Louis is cut from compact organic cotton jersey with a clean crew neck and a slightly boxy body. The weight and finish give it a quietly elevated feel.',
    sizes: MEN_SIZES,
    colors: ['Ivory', 'Black'],
    image: 'louis-cotton-t-shirt.webp',
  },
  {
    slug: 'maxime-pique-polo',
    name: 'Maxime Piqué Polo',
    gender: 'men',
    category: 'men-tshirts',
    price: 85,
    shortDescription: 'A cotton piqué polo with a refined, retro line.',
    description:
      'Maxime is cut from breathable cotton piqué with a soft collar and a clean three-button placket. A considered take on a wardrobe staple.',
    sizes: MEN_SIZES,
    colors: ['Navy', 'Ivory'],
    image: 'maxime-pique-polo.webp',
    isNew: true,
  },
  {
    slug: 'gabriel-long-sleeve-tee',
    name: 'Gabriel Long-Sleeve Tee',
    gender: 'men',
    category: 'men-tshirts',
    price: 65,
    shortDescription: 'A long-sleeve tee in soft, mid-weight jersey.',
    description:
      'Gabriel is cut from garment-dyed cotton jersey with a relaxed body and a clean crew neck. An easy layer under jackets or worn alone.',
    sizes: MEN_SIZES,
    colors: ['Black', 'Beige'],
    image: 'gabriel-long-sleeve-tee.webp',
  },
  {
    slug: 'paul-merino-polo',
    name: 'Paul Merino Polo',
    gender: 'men',
    category: 'men-tshirts',
    price: 125,
    shortDescription: 'A fine merino polo with a soft, polished hand.',
    description:
      'Paul is knitted from extra-fine merino with a clean collar and a three-button placket. Lightweight, breathable and quietly refined.',
    sizes: MEN_SIZES,
    colors: ['Navy', 'Burgundy'],
    image: 'paul-merino-polo.webp',
  },
  {
    slug: 'arthur-cashmere-sweater',
    name: 'Arthur Cashmere Sweater',
    gender: 'men',
    category: 'men-knitwear',
    price: 285,
    shortDescription: 'A soft cashmere crewneck in a classic fit.',
    description:
      'Arthur is spun from grade-A cashmere with a clean crew neck, ribbed cuffs and a relaxed body. Light, warm and made to be worn often.',
    sizes: MEN_SIZES,
    colors: ['Beige', 'Navy'],
    image: 'arthur-cashmere-sweater.webp',
    isFeatured: true,
  },
  {
    slug: 'felix-ribbed-crewneck',
    name: 'Félix Ribbed Crewneck',
    gender: 'men',
    category: 'men-knitwear',
    price: 165,
    shortDescription: 'A ribbed wool crewneck with a modern, close fit.',
    description:
      'Félix is knitted from a merino-wool blend in a fine rib, with a clean crew neck and a gently tapered body. An easy layer under tailoring or outerwear.',
    sizes: MEN_SIZES,
    colors: ['Black', 'Grey'],
    image: 'felix-ribbed-crewneck.webp',
  },
  {
    slug: 'samuel-merino-cardigan',
    name: 'Samuel Merino Cardigan',
    gender: 'men',
    category: 'men-knitwear',
    price: 195,
    shortDescription: 'A fine merino cardigan with a clean, retro line.',
    description:
      'Samuel is knitted from extra-fine merino with a soft collar, tonal buttons and a relaxed body. Wear it buttoned as a top or open over a tee.',
    sizes: MEN_SIZES,
    colors: ['Ivory', 'Navy'],
    image: 'samuel-merino-cardigan.webp',
  },
  {
    slug: 'nicolas-cable-knit-sweater',
    name: 'Nicolas Cable-Knit Sweater',
    gender: 'men',
    category: 'men-knitwear',
    price: 185,
    shortDescription: 'A chunky cable-knit sweater with a soft hand.',
    description:
      'Nicolas is knitted from a wool-alpaca blend in a classic cable pattern, with a crew neck and a relaxed fit. Warm, textural and made for cold days.',
    sizes: MEN_SIZES,
    colors: ['Burgundy', 'Brown'],
    image: 'nicolas-cable-knit-sweater.webp',
  },
  {
    slug: 'augustin-wool-overcoat',
    name: 'Augustin Wool Overcoat',
    gender: 'men',
    category: 'men-outerwear',
    price: 445,
    shortDescription: 'A tailored overcoat in double-faced wool.',
    description:
      'Augustin is cut from double-faced wool with a clean shoulder, a concealed placket and a longline hem. A quiet, enduring layer over tailoring.',
    sizes: MEN_SIZES,
    colors: ['Grey', 'Navy'],
    image: 'augustin-wool-overcoat.webp',
    isNew: true,
    isFeatured: true,
  },
  {
    slug: 'emile-trench-coat',
    name: 'Émile Trench Coat',
    gender: 'men',
    category: 'men-outerwear',
    price: 395,
    shortDescription: 'A modern trench in water-resistant cotton gabardine.',
    description:
      'Émile reworks the classic trench with a relaxed shoulder, a clean belt and a calf-length hem. Cut from cotton gabardine with a subtle sheen.',
    sizes: MEN_SIZES,
    colors: ['Navy', 'Beige'],
    image: 'emile-trench-coat.webp',
    isFeatured: true,
  },
  {
    slug: 'mathis-field-jacket',
    name: 'Mathis Field Jacket',
    gender: 'men',
    category: 'men-outerwear',
    price: 275,
    shortDescription: 'A utilitarian field jacket with a refined finish.',
    description:
      'Mathis is cut from cotton twill with a stand collar, patch pockets and a softly cinched waist. Practical details, quietly considered.',
    sizes: MEN_SIZES,
    colors: ['Olive', 'Brown'],
    image: 'mathis-field-jacket.webp',
  },
  {
    slug: 'remi-padded-jacket',
    name: 'Rémi Padded Jacket',
    gender: 'men',
    category: 'men-outerwear',
    price: 245,
    shortDescription: 'A lightweight padded jacket for transitional weather.',
    description:
      'Rémi is filled with recycled insulation and cut from a matte recycled shell with a clean stand collar. Warm without bulk, easy to layer.',
    sizes: MEN_SIZES,
    colors: ['Black', 'Olive'],
    image: 'remi-padded-jacket.webp',
  },
  {
    slug: 'pierre-straight-jeans',
    name: 'Pierre Straight Jeans',
    gender: 'men',
    category: 'men-denim',
    price: 135,
    shortDescription: 'Classic straight-leg jeans in rigid denim.',
    description:
      'Pierre is cut from rigid Italian denim with a mid rise and a clean straight leg. The dark indigo wash and minimal detailing give it a refined everyday finish.',
    sizes: MEN_SIZES,
    colors: ['Indigo', 'Black'],
    image: 'pierre-straight-jeans.webp',
    isFeatured: true,
  },
  {
    slug: 'jules-slim-jeans',
    name: 'Jules Slim Jeans',
    gender: 'men',
    category: 'men-denim',
    price: 125,
    shortDescription: 'Slim jeans in comfort-stretch denim.',
    description:
      'Jules is cut from soft comfort-stretch denim with a clean slim leg and a mid rise. An easy, modern foundation for shirts, knits and jackets.',
    sizes: MEN_SIZES,
    colors: ['Indigo', 'Stone'],
    image: 'jules-slim-jeans.webp',
  },
  {
    slug: 'thomas-relaxed-jeans',
    name: 'Thomas Relaxed Jeans',
    gender: 'men',
    category: 'men-denim',
    price: 145,
    shortDescription: 'Relaxed jeans with a soft, lived-in wash.',
    description:
      'Thomas is cut from washed cotton denim with a relaxed body and a straight leg. The light indigo wash and clean hem make it an easy weekend staple.',
    sizes: MEN_SIZES,
    colors: ['Indigo', 'Stone'],
    image: 'thomas-relaxed-jeans.webp',
  },
  {
    slug: 'adrien-denim-jacket',
    name: 'Adrien Denim Jacket',
    gender: 'men',
    category: 'men-denim',
    price: 165,
    shortDescription: 'A classic denim jacket with a clean, boxy line.',
    description:
      'Adrien is cut from mid-weight cotton denim with a boxy body, a pointed collar and clean metal buttons. A versatile layer that softens with wear.',
    sizes: MEN_SIZES,
    colors: ['Indigo', 'Black'],
    image: 'adrien-denim-jacket.webp',
    isNew: true,
  },
];

function makeSku(slug: string, size: string, color: string): string {
  const skuSize = size.replace(/[^a-z0-9]/gi, '').toUpperCase();
  const skuColor = color
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 3)
    .toUpperCase();
  return `ME-${slug.toUpperCase().replace(/-/g, '')}-${skuSize}-${skuColor}`;
}

function makeVariantId(slug: string, size: string, color: string): string {
  return `demo-${slug}-${size.toLowerCase()}-${color.toLowerCase()}`;
}

function stockFor(seedIndex: number, sizeIndex: number, colorIndex: number): number {
  const base = 4 + (seedIndex % 5);
  const variance = ((seedIndex * 3 + sizeIndex * 2 + colorIndex) % 5) - 2;
  return Math.max(0, base + variance);
}

function makeVariants(seed: DemoProductSeed, seedIndex: number): ProductVariantDto[] {
  return seed.sizes.flatMap((size, sizeIndex) =>
    seed.colors.map((color, colorIndex) => ({
      id: makeVariantId(seed.slug, size, color),
      sku: makeSku(seed.slug, size, color),
      size,
      color,
      stockQuantity: stockFor(seedIndex, sizeIndex, colorIndex),
      price: seed.price,
    })),
  );
}

function makeImages(seed: DemoProductSeed): ProductImageDto[] {
  const folder = seed.category.replace(`${seed.gender}-`, '');
  const url = `/images/products/${seed.gender}/${folder}/${seed.image}`;

  return [
    {
      id: `demo-image-${seed.slug}`,
      url,
      alt: `${seed.name} — studio product photograph`,
      sortOrder: 0,
    },
  ];
}

export const demoProducts: DemoProduct[] = productSeeds.map((seed, seedIndex) => {
  const variants = makeVariants(seed, seedIndex);
  const category = CATEGORY[seed.category];

  return {
    id: `demo-${seed.slug}`,
    name: seed.name,
    slug: seed.slug,
    description: seed.description,
    shortDescription: seed.shortDescription,
    category,
    price: seed.price,
    ...(seed.compareAtPrice !== undefined ? { compareAtPrice: seed.compareAtPrice } : {}),
    currency: 'EUR',
    images: makeImages(seed),
    variants,
    sizes: [...new Set(variants.map((variant) => variant.size))],
    colors: [...new Set(variants.map((variant) => variant.color))],
    stock: variants.reduce((total, variant) => total + variant.stockQuantity, 0),
    isNew: seed.isNew ?? false,
    isFeatured: seed.isFeatured ?? false,
    status: 'ACTIVE',
  };
});

export const demoProductBySlug: ReadonlyMap<string, DemoProduct> = new Map(
  demoProducts.map((product) => [product.slug, product]),
);
