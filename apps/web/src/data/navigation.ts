export interface NavItem {
  label: string;
  to: string;
}

export interface SocialLink {
  label: string;
  href: string;
}

export const primaryNav: NavItem[] = [
  { label: 'Women', to: '/shop/women' },
  { label: 'Men', to: '/shop/men' },
  { label: 'New In', to: '/shop?sort=newest' },
  { label: 'Collections', to: '/shop' },
];

export const footerColumns: { title: string; links: NavItem[] }[] = [
  {
    title: 'Shop',
    links: [
      { label: 'Women', to: '/shop/women' },
      { label: 'Men', to: '/shop/men' },
      { label: 'New Arrivals', to: '/shop?sort=newest' },
      { label: 'Collections', to: '/shop' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'Our Story', to: '/our-story' },
      { label: 'Journal', to: '/journal' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    title: 'Customer Care',
    links: [
      { label: 'Shipping', to: '/shipping' },
      { label: 'Returns', to: '/returns' },
      { label: 'Size Guide', to: '/size-guide' },
      { label: 'FAQ', to: '/faq' },
    ],
  },
];

export const socialLinks: SocialLink[] = [
  { label: 'Instagram', href: 'https://instagram.com' },
  { label: 'TikTok', href: 'https://tiktok.com' },
  { label: 'Pinterest', href: 'https://pinterest.com' },
];
