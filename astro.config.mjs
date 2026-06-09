// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { visit } from 'unist-util-visit';

const base = '/documentation';

// Prepend the site base to root-absolute internal URLs so links/images resolve
// when the site is served under `/documentation`. Leaves external URLs, anchors,
// and already-prefixed paths untouched. Covers markdown links/images AND MDX
// component attributes (e.g. <LinkCard href="/...">).
function fixInternalUrl(url) {
  if (typeof url !== 'string') return url;
  if (!url.startsWith('/') || url.startsWith('//')) return url; // external / protocol-relative
  if (url === base || url.startsWith(base + '/')) return url;    // already prefixed
  return base + url;
}

function remarkFixImagePaths() {
  return function (tree) {
    visit(tree, ['image', 'link'], function (node) {
      node.url = fixInternalUrl(node.url);
    });
    visit(tree, ['mdxJsxFlowElement', 'mdxJsxTextElement'], function (node) {
      if (!node.attributes) return;
      for (const attr of node.attributes) {
        if (
          attr.type === 'mdxJsxAttribute' &&
          (attr.name === 'href' || attr.name === 'src') &&
          typeof attr.value === 'string'
        ) {
          attr.value = fixInternalUrl(attr.value);
        }
      }
    });
  };
}

export default defineConfig({
  site: 'https://sanketika-obsrv.github.io',
  base,
  markdown: {
    remarkPlugins: [remarkFixImagePaths],
  },
  integrations: [
    starlight({
      title: 'Obsrv',
      logo: {
        src: './src/assets/obsrv-logo.svg',
        replacesTitle: true,
      },
      favicon: '/favicon.svg',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/Sunbird-Obsrv' },
        { icon: 'discord', label: 'Discord', href: 'https://discord.gg/Q5mvw2mGC8' },
      ],
      lastUpdated: false,
      pagination: true,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      customCss: ['./src/styles/custom.css'],
      components: {
        PageFrame: './src/components/PageFrame.astro',
        SiteTitle: './src/components/SiteTitle.astro',
        Sidebar: './src/components/Sidebar.astro',
        PageTitle: './src/components/PageTitle.astro',
        TableOfContents: './src/components/TableOfContents.astro',
      },
      sidebar: [
        {
          label: 'Welcome to Obsrv',
          items: [
            { label: 'Welcome to Obsrv', slug: '' },
            { label: 'The Value of Data', slug: 'introduction/the-value-of-data' },
            { label: 'Data Value Chain', slug: 'introduction/data-value-chain' },
            { label: 'Challenges', slug: 'introduction/challenges' },
            { label: 'The Solution: Obsrv', slug: 'introduction/the-solution-obsrv' },
          ],
        },
        {
          label: 'Core Concepts',
          collapsed: true,
          autogenerate: { directory: 'core-concepts' },
        },
        {
          label: 'Explore',
          collapsed: true,
          items: [
            { label: 'Explore', slug: 'explore' },
            {
              label: 'Roadmap',
              collapsed: true,
              items: [
                { label: 'FY2025-26', slug: 'explore/roadmap/fy2025-26' },
                { label: 'FY2024-25', slug: 'explore/roadmap/fy2024-25' },
              ],
            },
            {
              label: 'Case Studies',
              collapsed: true,
              items: [
                { label: 'Agri Climate Advisory', slug: 'explore/case-studies/agri-climate-advisory' },
                { label: 'Learning Analytics at Population Scale', slug: 'explore/case-studies/learning-analytics-at-population-scale' },
                { label: 'IOT Observations Infra', slug: 'explore/case-studies/iot-observations-infra' },
              ],
            },
            { label: 'Performance Benchmarks', slug: 'explore/performance-benchmarks' },
          ],
        },
        {
          label: 'Guides',
          collapsed: true,
          items: [
            { label: 'Guides', slug: 'guides' },
            {
              label: 'Installation Guide',
              collapsed: true,
              items: [
                { label: 'AWS Installation Guide', slug: 'guides/installation/aws-installation-guide' },
                { label: 'Azure', slug: 'guides/installation/azure-installation-guide' },
                { label: 'GCP', slug: 'guides/installation/gcp-installation-guide' },
                { label: 'OCI', slug: 'guides/installation/oci-installation-guide' },
                { label: 'Data Center', slug: 'guides/installation/data-center-installation-guide' },
              ],
            },
            {
              label: 'API Specification',
              collapsed: true,
              items: [
                { label: 'Dataset Management APIs', slug: 'guides/api-specification/dataset-management' },
                { label: 'Connector APIs', slug: 'guides/api-specification/connector-apis' },
                { label: 'Data In & Out APIs', slug: 'guides/api-specification/data-in-and-out-apis' },
                { label: 'Alerts and Notification Channels APIs', slug: 'guides/api-specification/alerts-notification-channel-apis' },
              ],
            },
            { label: 'Dataset Management Console', slug: 'guides/management-console-guide' },
            { label: 'Developer Guide', slug: 'guides/developer-guide' },
            { label: 'Example Datasets', collapsed: true, autogenerate: { directory: 'guides/example-datasets' } },
            { label: 'Connectors Developer Guide', collapsed: true, autogenerate: { directory: 'guides/connectors-developer-guide' } },
          ],
        },
        { label: 'Community', slug: 'community' },
        {
          label: 'Releases',
          collapsed: true,
          items: [
            { label: 'Releases', slug: 'release-notes' },
            { label: '2.1.0', collapsed: true, autogenerate: { directory: 'release-notes/2.1.0' } },
            { label: '2.0.0', slug: 'release-notes/200' },
            { label: '1.9.0', collapsed: true, autogenerate: { directory: 'release-notes/1.9.0' } },
            { label: '1.8.0', slug: 'release-notes/180' },
            { label: '1.7.0', slug: 'release-notes/170' },
            {
              label: 'Archive',
              collapsed: true,
              items: [
                { label: '1.1.0-Beta', slug: 'release-notes/archive/110-beta' },
                { label: '1.2.0', slug: 'release-notes/archive/120' },
              ],
            },
          ],
        },
        {
          label: 'How-Tos',
          collapsed: true,
          items: [
            { label: 'How-Tos', slug: 'how-tos' },
            { label: 'Data Backup and Restoration', slug: 'how-tos/data-backup-and-restoration' },
            { label: 'Create a Dataset', slug: 'how-tos/create-a-dataset' },
            { label: 'Register a Connector', slug: 'how-tos/register-a-connector' },
            {
              label: 'Scale Infrastructure',
              collapsed: true,
              badge: { text: 'Pro Feature', variant: 'tip' },
              autogenerate: { directory: 'how-tos/scale-infrastructure' },
            },
            {
              label: 'Troubleshoot',
              collapsed: true,
              autogenerate: { directory: 'how-tos/troubleshoot' },
            },
            {
              label: 'Alerts and Notifications',
              collapsed: true,
              items: [
                { label: 'Alerts and Notifications', link: '/how-tos/alerts-and-notifications/' },
                {
                  label: 'Alerts and Recommended Actions',
                  collapsed: true,
                  autogenerate: { directory: 'how-tos/alerts-and-notifications/alerts-and-recommended-actions' },
                },
                {
                  label: 'Notifications',
                  collapsed: true,
                  autogenerate: { directory: 'how-tos/alerts-and-notifications/notifications' },
                },
                { label: 'Alerts Modification', link: '/how-tos/alerts-and-notifications/alerts-modification/' },
              ],
            },
            {
              label: 'Migration Guide',
              collapsed: true,
              items: [
                { label: 'Migration Plan: Obsrv GA to Obsrv 1.0', link: '/how-tos/migration-guide/migration-plan-obsrv-ga-to-obsrv-1-0/' },
                { label: 'Migration Guide: Obsrv 1.x to Obsrv 2.x', link: '/how-tos/migration-guide/migration-guide-obsrv-1x-to-obsrv-2x/' },
              ],
            },
            { label: 'Integration with Managed Kafka Services', slug: 'how-tos/managed-kafka-integration' },
            { label: 'Sanity Checklist', slug: 'how-tos/sanity-checklist' },
            { label: 'Configure Lakehouse Store', slug: 'how-tos/configure-lakehouse-store' },
          ],
        },
      ],
    }),
  ],
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
});
