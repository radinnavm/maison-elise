import { randomBytes } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required to run the seed script.');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

interface CategorySeed {
  name: string;
  slug: string;
}

interface ProductSeed {
  slug: string;
  name: string;
  categorySlug: string;
  description: string;
  basePrice: number;
  isNew: boolean;
  isFeatured: boolean;
  sizes: string[];
  colors: string[];
  stockPerVariant: number;
}

const categorySeed: CategorySeed[] = [
  { name: 'Dresses', slug: 'dresses' },
  { name: 'Tops', slug: 'tops' },
  { name: 'Trousers', slug: 'trousers' },
  { name: 'Skirts', slug: 'skirts' },
  { name: 'Outerwear', slug: 'outerwear' },
  { name: 'Bags', slug: 'bags' },
  { name: 'Accessories', slug: 'accessories' },
];

const garmentSizes = ['XS', 'S', 'M', 'L', 'XL'];
const oneSize = ['One Size'];

const productSeed: ProductSeed[] = [
  {
    slug: 'aurelia-satin-dress',
    name: 'Aurelia Satin Dress',
    categorySlug: 'dresses',
    description:
      'Cut from fluid satin with a softly structured silhouette, Aurelia is designed for understated evening elegance.',
    basePrice: 189,
    isNew: true,
    isFeatured: true,
    sizes: garmentSizes,
    colors: ['Black', 'Ivory', 'Burgundy'],
    stockPerVariant: 2,
  },
  {
    slug: 'elise-tailored-blazer',
    name: 'Elise Tailored Blazer',
    categorySlug: 'outerwear',
    description:
      'A sharply tailored blazer in Italian wool, with structured shoulders and a single-breasted close for effortless polish.',
    basePrice: 520,
    isNew: true,
    isFeatured: true,
    sizes: garmentSizes,
    colors: ['Black', 'Beige', 'Brown'],
    stockPerVariant: 2,
  },
  {
    slug: 'noemie-silk-blouse',
    name: 'Noémie Silk Blouse',
    categorySlug: 'tops',
    description:
      'Noémie is a weightless silk blouse with a relaxed drape and mother-of-pearl buttons — a quiet foundation for any look.',
    basePrice: 280,
    isNew: true,
    isFeatured: false,
    sizes: garmentSizes,
    colors: ['Ivory', 'Black', 'Beige'],
    stockPerVariant: 3,
  },
  {
    slug: 'camille-wide-leg-trousers',
    name: 'Camille Wide-Leg Trousers',
    categorySlug: 'trousers',
    description:
      'High-waisted and fluid, Camille falls in a clean wide leg that moves with the body and elongates the silhouette.',
    basePrice: 310,
    isNew: false,
    isFeatured: false,
    sizes: garmentSizes,
    colors: ['Black', 'Brown', 'Beige'],
    stockPerVariant: 2,
  },
  {
    slug: 'amelie-knit-dress',
    name: 'Amélie Knit Dress',
    categorySlug: 'dresses',
    description:
      'Knitted from a soft wool blend, Amélie skims the figure with a fine rib and a graceful midi length.',
    basePrice: 260,
    isNew: false,
    isFeatured: true,
    sizes: garmentSizes,
    colors: ['Beige', 'Brown', 'Burgundy'],
    stockPerVariant: 1,
  },
  {
    slug: 'sophie-leather-bag',
    name: 'Sophie Leather Bag',
    categorySlug: 'bags',
    description:
      'Sophie is a compact calf-leather bag with a sculpted flap and a hand-finished edge — an everyday object made to last.',
    basePrice: 690,
    isNew: true,
    isFeatured: true,
    sizes: oneSize,
    colors: ['Brown', 'Black'],
    stockPerVariant: 4,
  },
  {
    slug: 'clara-wool-coat',
    name: 'Clara Wool Coat',
    categorySlug: 'outerwear',
    description:
      'A longline coat in double-faced wool, cut with a clean shoulder and a belt to define the waist. Designed to be worn for years.',
    basePrice: 880,
    isNew: false,
    isFeatured: true,
    sizes: garmentSizes,
    colors: ['Beige', 'Black', 'Burgundy'],
    stockPerVariant: 1,
  },
  {
    slug: 'margot-evening-dress',
    name: 'Margot Evening Dress',
    categorySlug: 'dresses',
    description:
      'Margot is a floor-skimming column dress in crepe, with a draped neckline and a subtle sheen for evening.',
    basePrice: 560,
    isNew: false,
    isFeatured: true,
    sizes: garmentSizes,
    colors: ['Black', 'Burgundy'],
    stockPerVariant: 0,
  },
  {
    slug: 'ines-cashmere-sweater',
    name: 'Inès Cashmere Sweater',
    categorySlug: 'tops',
    description:
      'Spun from grade-A cashmere, Inès is a soft, light crew neck that layers easily across the seasons.',
    basePrice: 390,
    isNew: false,
    isFeatured: false,
    sizes: garmentSizes,
    colors: ['Ivory', 'Beige', 'Brown', 'Black'],
    stockPerVariant: 2,
  },
  {
    slug: 'louise-silk-scarf',
    name: 'Louise Silk Scarf',
    categorySlug: 'accessories',
    description:
      'A square silk scarf printed with a tonal archive motif, finished by hand for a soft, fluid drape.',
    basePrice: 150,
    isNew: false,
    isFeatured: false,
    sizes: oneSize,
    colors: ['Burgundy', 'Beige', 'Ivory'],
    stockPerVariant: 5,
  },
  {
    slug: 'jasmine-linen-shirt',
    name: 'Jasmine Linen Shirt',
    categorySlug: 'tops',
    description:
      'Cut from washed European linen, Jasmine is an easy, breathable shirt with a soft collar and a relaxed line.',
    basePrice: 190,
    isNew: false,
    isFeatured: false,
    sizes: garmentSizes,
    colors: ['Ivory', 'Black'],
    stockPerVariant: 3,
  },
  {
    slug: 'colette-pleated-skirt',
    name: 'Colette Pleated Skirt',
    categorySlug: 'skirts',
    description:
      'Colette is a fine pleated skirt that catches the light as it moves, sitting neatly at the waist.',
    basePrice: 240,
    isNew: false,
    isFeatured: false,
    sizes: garmentSizes,
    colors: ['Beige', 'Black', 'Brown'],
    stockPerVariant: 2,
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

function generatePassword(): string {
  return randomBytes(12).toString('base64url');
}

async function seedCategories(): Promise<Map<string, string>> {
  for (const category of categorySeed) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
  }

  const categories = await prisma.category.findMany();
  return new Map(categories.map((category) => [category.slug, category.id]));
}

async function seedProducts(categoryIds: Map<string, string>): Promise<void> {
  for (const product of productSeed) {
    const categoryId = categoryIds.get(product.categorySlug);

    if (!categoryId) {
      throw new Error(`Unknown category "${product.categorySlug}" for product "${product.slug}".`);
    }

    const images = [1, 2, 3].map((index) => ({
      url: `/static/products/${product.slug}-${index}.svg`,
      alt: `${product.name} — view ${index}`,
      sortOrder: index - 1,
    }));

    const variants = product.sizes.flatMap((size) =>
      product.colors.map((color) => ({
        sku: makeSku(product.slug, size, color),
        size,
        color,
        stockQuantity: product.stockPerVariant,
        price: product.basePrice,
      })),
    );

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        categoryId,
        basePrice: product.basePrice,
        currency: 'EUR',
        status: 'ACTIVE',
        isNew: product.isNew,
        isFeatured: product.isFeatured,
        images: { deleteMany: {}, create: images },
        variants: { deleteMany: {}, create: variants },
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        categoryId,
        basePrice: product.basePrice,
        currency: 'EUR',
        status: 'ACTIVE',
        isNew: product.isNew,
        isFeatured: product.isFeatured,
        images: { create: images },
        variants: { create: variants },
      },
    });
  }
}

interface SeedUser {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  password?: string;
}

async function seedUser(user: SeedUser): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email: user.email } });

  if (existing) {
    await prisma.user.update({
      where: { email: user.email },
      data: { firstName: user.firstName, lastName: user.lastName, role: user.role },
    });
    console.log(`Updated existing user: ${user.email}`);
    return;
  }

  const password = user.password ?? generatePassword();
  const passwordHash = await hash(password, 10);

  await prisma.user.create({
    data: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      passwordHash,
      role: user.role,
    },
  });

  if (user.password) {
    console.log(`Created user: ${user.email}`);
  } else {
    console.log(`Created user: ${user.email} with generated password: ${password}`);
  }
}

async function main(): Promise<void> {
  console.log('Seeding Maison Élise database...');

  const categoryIds = await seedCategories();
  await seedProducts(categoryIds);

  await seedUser({
    firstName: 'Elise',
    lastName: 'Moreau',
    email: process.env.ADMIN_EMAIL ?? 'admin@maisonelise.com',
    role: 'ADMIN',
    password: process.env.ADMIN_PASSWORD,
  });

  await seedUser({
    firstName: 'Camille',
    lastName: 'Laurent',
    email: process.env.CUSTOMER_EMAIL ?? 'customer@maisonelise.com',
    role: 'CUSTOMER',
    password: process.env.CUSTOMER_PASSWORD,
  });

  console.log('Seed complete.');
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
