import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The site reads the schemas and the examples from outside docs/; in dev,
// restart when one of them changes.
// Sidebar link to a schema page: the last segment of its targetNamespace, as
// in src/lib/schemas.ts (which fails the build if the namespace is not
// http://www.ncl.org.br/NCL360/<name>).
function schemaLink(label, file) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    const namespace = source.match(/targetNamespace="([^"]+)"/)[1];
    return { label, link: `/${namespace.split('/').pop()}/` };
}

const watchRepoFiles = {
    name: 'ncl360-watch-repo-files',
    hooks: {
        'astro:config:setup': ({ addWatchFile }) => {
            for (const dir of ['profiles', 'modules', 'exemplos']) {
                const url = new URL(`../${dir}/`, import.meta.url);
                for (const file of readdirSync(fileURLToPath(url))) addWatchFile(new URL(file, url));
            }
        },
    },
};

const REPOSITORY_URL = 'https://github.com/multisens/ncl360';

export default defineConfig({
    site: 'https://multisens.com.br',
    base: '/ncl360',
    integrations: [
        watchRepoFiles,
        starlight({
            title: 'NCL360',
            description: 'Documentação da linguagem NCL360, para cenas 360° em aplicações '
                + 'Ginga-NCL da TV 3.0',
            defaultLocale: 'root',
            locales: {
                root: { label: 'Português', lang: 'pt-BR' },
            },
            social: [
                { icon: 'github', label: 'Repositório', href: REPOSITORY_URL },
            ],
            customCss: ['./src/styles/site.css'],
            components: {
                Footer: './src/components/footer.astro',
                PageSidebar: './src/components/page-sidebar.astro',
                TwoColumnContent: './src/components/two-column-content.astro',
            },
            sidebar: [
                { label: 'Início', slug: 'index' },
                {
                    label: 'Entenda',
                    items: [
                        'visao-geral',
                        'integracao-ncl',
                    ],
                },
                {
                    label: 'Exemplos',
                    items: [{ autogenerate: { directory: 'exemplos' } }],
                },
                {
                    label: 'Referência',
                    items: [
                        { label: 'Elementos', link: '/referencia/elementos/' },
                        { label: 'Tipos e valores', link: '/referencia/tipos/' },
                        'referencia/validacao',
                        {
                            label: 'Schemas',
                            items: [
                                schemaLink('Perfil NCL360', 'profiles/NCL360.xsd'),
                                schemaLink('Layout', 'modules/Layout.xsd'),
                                schemaLink('Media', 'modules/Media.xsd'),
                                schemaLink('Link', 'modules/Link.xsd'),
                            ],
                        },
                    ],
                },
            ],
        }),
    ],
});
