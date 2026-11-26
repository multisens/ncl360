// Serves each schema at the same path it has in the repository
// (/ncl360/profiles/NCL360.xsd, /ncl360/modules/Layout.xsd...), and each
// example at /ncl360/exemplos/<name>.ncl360.
import type { APIRoute, GetStaticPaths } from 'astro';
import { MODULES } from '../../lib/schemas';
import { EXEMPLOS } from '../../lib/exemplos';

export const getStaticPaths = (() => [
    ...MODULES.map((m) => {
        const [dir, file] = m.file.split('/');
        return { params: { dir, file }, props: { body: m.source } };
    }),
    ...EXEMPLOS.map((e) => ({ params: { dir: 'exemplos', file: e.file }, props: { body: e.source } })),
]) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
    new Response(props.body as string, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
