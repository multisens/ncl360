// Reads the NCL360 XML Schemas at the root of the repository (profiles/ and
// modules/) and resolves, for each element a document can use, its
// attributes, its children and the parts it takes from NCL 4.0.
//
// The schemas are the single source of the reference pages: what the site
// shows about structure, attributes and value types comes from here, and only
// the prose comes from src/data/elementos.ts.

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { XMLParser } from 'fast-xml-parser';

/** Root of the repository, one level above docs/ (where npm runs). */
export const REPO_ROOT = resolve(process.cwd(), '..');

const XS = 'http://www.w3.org/2001/XMLSchema';

export interface ModuleDef {
    title: string;
    /** Path relative to the repository root, also the download path. */
    file: string;
    summary: string;
}

/** The four NCL360 schemas, in the order the site presents them. */
export const MODULE_DEFS: ModuleDef[] = [
    {
        title: 'Perfil NCL360',
        file: 'profiles/NCL360.xsd',
        summary: 'Raiz do documento, cabeçalho e corpo; reúne os módulos e os elementos que vêm do NCL 4.0.',
    },
    {
        title: 'Módulo Layout',
        file: 'modules/Layout.xsd',
        summary: 'Regiões no espaço 360° e descritores de apresentação.',
    },
    {
        title: 'Módulo Media',
        file: 'modules/Media.xsd',
        summary: 'Objetos de mídia da cena, suas âncoras temporais e propriedades.',
    },
    {
        title: 'Módulo Link',
        file: 'modules/Link.xsd',
        summary: 'Elos causais entre os objetos da cena.',
    },
];

/** Friendly names of the NCL 4.0 namespaces the schemas import. */
export const NCL40_NAMESPACES: Record<string, string> = {
    'http://www.ncl.org.br/NCL4.0/CausalConnectorFunctionality': 'NCL 4.0 — CausalConnectorFunctionality',
    'http://www.ncl.org.br/NCL4.0/CompositeNodeInterface': 'NCL 4.0 — CompositeNodeInterface',
    'http://www.ncl.org.br/NCL4.0/Linking': 'NCL 4.0 — Linking',
    'http://www.ncl.org.br/NCL4.0/Descriptor': 'NCL 4.0 — Descriptor',
    'http://www.ncl.org.br/NCL4.0/PropertyAnchor': 'NCL 4.0 — PropertyAnchor',
    'http://www.ncl.org.br/NCL4.0/MediaContentAnchor': 'NCL 4.0 — MediaContentAnchor',
    'http://www.ncl.org.br/NCL4.0/Media': 'NCL 4.0 — Media',
};

// ---------------------------------------------------------------------------
// XML tree

interface XNode {
    tag: string;
    attrs: Record<string, string>;
    children: XNode[];
}

type Ordered = Record<string, unknown>;

function toTree(items: Ordered[]): XNode[] {
    const out: XNode[] = [];
    for (const item of items) {
        const tag = Object.keys(item).find((k) => k !== ':@');
        if (!tag || tag === '#text' || tag === '#comment' || tag.startsWith('?')) continue;
        const rawAttrs = (item[':@'] ?? {}) as Record<string, string>;
        const attrs: Record<string, string> = {};
        for (const [k, v] of Object.entries(rawAttrs)) attrs[k.replace(/^@_/, '')] = String(v);
        out.push({
            tag: tag.replace(/^xs:/, ''),
            attrs,
            children: toTree(item[tag] as Ordered[]),
        });
    }
    return out;
}

const parser = new XMLParser({
    preserveOrder: true,
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    commentPropName: '#comment',
});

// ---------------------------------------------------------------------------
// Modules

export interface Facet {
    kind: 'pattern' | 'enumeration' | 'minInclusive' | 'maxInclusive';
    value: string;
}

export interface SimpleTypeInfo {
    name: string;
    module: string;
    base: QName;
    facets: Facet[];
}

export interface QName {
    ns: string;
    name: string;
}

/**
 * Namespaces and public URIs of the schemas live under this prefix. The site
 * mirrors what follows it, so that a single redirect on ncl.org.br
 * (http://www.ncl.org.br/NCL360/<rest> -> <site>/<rest>) leads each namespace
 * to its page and each public URI to its file.
 */
export const NCL360_PREFIX = 'http://www.ncl.org.br/NCL360/';

export interface SchemaModule extends ModuleDef {
    /**
     * Last segment of the namespace (e.g. NCL360Layout): the address of the
     * module page and the key that identifies the module across the site.
     */
    slug: string;
    namespace: string;
    prefix: string;
    publicUri: string;
    revision: string;
    source: string;
    imports: { namespace: string; schemaLocation: string }[];
    /** Elements declared at the top level of this schema, in file order. */
    declared: string[];
    simpleTypes: SimpleTypeInfo[];
    prefixes: Record<string, string>;
    root: XNode;
}

function loadModule(def: ModuleDef): SchemaModule {
    const source = readFileSync(join(REPO_ROOT, def.file), 'utf8');
    const tree = toTree(parser.parse(source) as Ordered[]);
    const root = tree.find((n) => n.tag === 'schema');
    if (!root) throw new Error(`${def.file}: no xs:schema element`);
    const prefixes: Record<string, string> = {};
    for (const [k, v] of Object.entries(root.attrs)) {
        if (k.startsWith('xmlns:')) prefixes[k.slice(6)] = v;
    }
    const namespace = root.attrs.targetNamespace;
    if (!namespace.startsWith(NCL360_PREFIX) || namespace.slice(NCL360_PREFIX.length).includes('/')) {
        throw new Error(`${def.file}: namespace ${namespace} is not ${NCL360_PREFIX}<name>`);
    }
    const prefix = Object.keys(prefixes).find((p) => p !== 'xs' && prefixes[p] === namespace) ?? '';
    const header = (label: string) => source.match(new RegExp(`${label}:\\s*(.+)`))?.[1].trim() ?? '';
    const publicUri = header('Public URI');
    if (publicUri !== NCL360_PREFIX + def.file) {
        throw new Error(`${def.file}: public URI ${publicUri} is not ${NCL360_PREFIX}${def.file}, where the site serves it`);
    }
    const mod: SchemaModule = {
        ...def,
        slug: namespace.slice(NCL360_PREFIX.length),
        namespace,
        prefix,
        publicUri,
        revision: header('Revision'),
        source,
        imports: root.children
            .filter((n) => n.tag === 'import')
            .map((n) => ({ namespace: n.attrs.namespace, schemaLocation: n.attrs.schemaLocation })),
        declared: root.children.filter((n) => n.tag === 'element').map((n) => n.attrs.name),
        simpleTypes: [],
        prefixes,
        root,
    };
    mod.simpleTypes = root.children
        .filter((n) => n.tag === 'simpleType')
        .map((n) => {
            const restriction = n.children.find((c) => c.tag === 'restriction');
            if (!restriction) throw new Error(`${def.file}: simpleType ${n.attrs.name} without restriction`);
            return {
                name: n.attrs.name,
                module: mod.slug,
                base: qname(mod, restriction.attrs.base),
                facets: restriction.children
                    .filter((c) => ['pattern', 'enumeration', 'minInclusive', 'maxInclusive'].includes(c.tag))
                    .map((c) => ({ kind: c.tag as Facet['kind'], value: c.attrs.value })),
            };
        });
    return mod;
}

function qname(mod: SchemaModule, value: string): QName {
    const [p, local] = value.includes(':') ? value.split(':') : ['', value];
    const ns = p ? mod.prefixes[p] : mod.namespace;
    if (ns === undefined) throw new Error(`${mod.file}: unknown prefix in "${value}"`);
    return { ns, name: local };
}

export const MODULES: SchemaModule[] = MODULE_DEFS.map(loadModule);

const BY_NAMESPACE = new Map(MODULES.map((m) => [m.namespace, m]));

export const PROFILE = MODULES[0];

function topLevel(ns: string, tag: string, name: string): { mod: SchemaModule; node: XNode } | undefined {
    const mod = BY_NAMESPACE.get(ns);
    const node = mod?.root.children.find((n) => n.tag === tag && n.attrs.name === name);
    return mod && node ? { mod, node } : undefined;
}

export function isLocal(q: QName): boolean {
    return BY_NAMESPACE.has(q.ns) || q.ns === XS;
}

export function findSimpleType(q: QName): SimpleTypeInfo | undefined {
    return BY_NAMESPACE.get(q.ns)?.simpleTypes.find((t) => t.name === q.name);
}

// ---------------------------------------------------------------------------
// Elements

export interface AttrInfo {
    name: string;
    type: QName;
    use: 'required' | 'optional';
    default?: string;
}

export interface ChildInfo {
    name: string;
    min: string;
    max: string;
}

export interface ElementInfo {
    name: string;
    /** Module whose schema holds the definition actually used. */
    module: string;
    /** Chain of substitution groups followed, e.g. ["layout:region"]. */
    via: string[];
    attributes: AttrInfo[];
    prohibited: string[];
    children: ChildInfo[];
    /** NCL 4.0 types, groups or bases the definition takes, unresolved here. */
    external: QName[];
}

function key(q: QName) {
    return `${q.ns}|${q.name}`;
}

export function externalKey(q: QName) {
    return key(q);
}

function emptyInfo(name: string, module: string): ElementInfo {
    return { name, module, via: [], attributes: [], prohibited: [], children: [], external: [] };
}

function readComplexType(mod: SchemaModule, node: XNode, info: ElementInfo) {
    for (const c of node.children) {
        switch (c.tag) {
            case 'attribute':
                if (c.attrs.use === 'prohibited') {
                    info.prohibited.push(c.attrs.name);
                } else {
                    info.attributes.push({
                        name: c.attrs.name,
                        type: qname(mod, c.attrs.type),
                        use: c.attrs.use === 'required' ? 'required' : 'optional',
                        default: c.attrs.default,
                    });
                }
                break;
            case 'attributeGroup': {
                const q = qname(mod, c.attrs.ref);
                const found = topLevel(q.ns, 'attributeGroup', q.name);
                if (found) readComplexType(found.mod, found.node, info);
                else info.external.push(q);
                break;
            }
            case 'sequence':
                readSequence(mod, c, info);
                break;
            case 'group': {
                const q = qname(mod, c.attrs.ref);
                const found = topLevel(q.ns, 'group', q.name);
                if (!found) throw new Error(`${mod.file}: group ${c.attrs.ref} not found`);
                readComplexType(found.mod, found.node, info);
                break;
            }
            case 'complexContent': {
                const der = c.children.find((d) => d.tag === 'restriction' || d.tag === 'extension');
                if (!der) throw new Error(`${mod.file}: complexContent without derivation`);
                const base = qname(mod, der.attrs.base);
                const found = topLevel(base.ns, 'complexType', base.name);
                if (found) readComplexType(found.mod, found.node, info);
                else info.external.push(base);
                readComplexType(mod, der, info);
                break;
            }
            default:
                break;
        }
    }
}

function readSequence(mod: SchemaModule, node: XNode, info: ElementInfo) {
    for (const c of node.children) {
        if (c.tag === 'element') {
            const name = c.attrs.ref ? qname(mod, c.attrs.ref).name : c.attrs.name;
            info.children.push({
                name,
                min: c.attrs.minOccurs ?? '1',
                max: c.attrs.maxOccurs ?? '1',
            });
            if (c.attrs.name) LOCAL_DECLS.set(c.attrs.name, { mod, node: c });
        } else if (c.tag === 'sequence') {
            readSequence(mod, c, info);
        } else if (c.tag === 'group') {
            readComplexType(mod, { ...node, children: [c] }, info);
        }
    }
}

/** Elements declared inside a content model (head, body), by name. */
const LOCAL_DECLS = new Map<string, { mod: SchemaModule; node: XNode }>();

function readElement(mod: SchemaModule, node: XNode, info: ElementInfo) {
    info.module = mod.slug;
    if (node.attrs.substitutionGroup && !node.attrs.type && !node.children.length) {
        const head = qname(mod, node.attrs.substitutionGroup);
        info.via.push(node.attrs.substitutionGroup);
        const found = topLevel(head.ns, 'element', head.name);
        if (found) readElement(found.mod, found.node, info);
        else info.external.push(head);
        return;
    }
    if (node.attrs.type) {
        const t = qname(mod, node.attrs.type);
        const found = topLevel(t.ns, 'complexType', t.name);
        if (found) {
            info.module = found.mod.slug;
            readComplexType(found.mod, found.node, info);
        } else {
            info.external.push(t);
        }
        return;
    }
    const inline = node.children.find((c) => c.tag === 'complexType');
    if (inline) readComplexType(mod, inline, info);
}

function resolveElement(name: string): ElementInfo {
    const info = emptyInfo(name, PROFILE.slug);
    const top = topLevel(PROFILE.namespace, 'element', name);
    const local = LOCAL_DECLS.get(name);
    const found = top ?? local;
    if (!found) throw new Error(`Element ${name} is used but not declared in the profile`);
    readElement(found.mod, found.node, info);
    return info;
}

/**
 * Every element a document can use, in the order of a walk from <ncl360>,
 * plus the connector elements, which the profile declares but which only
 * appear through <causalConnector>.
 */
function collectElements(): ElementInfo[] {
    const out = new Map<string, ElementInfo>();
    const queue = ['ncl360'];
    while (queue.length) {
        const name = queue.shift()!;
        if (out.has(name)) continue;
        const info = resolveElement(name);
        out.set(name, info);
        queue.push(...info.children.map((c) => c.name));
    }
    for (const name of PROFILE.declared) {
        if (!out.has(name)) out.set(name, resolveElement(name));
    }
    return [...out.values()];
}

export const ELEMENTS: ElementInfo[] = collectElements();

/** Parents of each element, from the resolved content models. */
export const PARENTS: Record<string, string[]> = {};
for (const el of ELEMENTS) {
    for (const c of el.children) (PARENTS[c.name] ??= []).push(el.name);
}

export function formatQName(q: QName): string {
    if (q.ns === XS) return `xs:${q.name}`;
    const mod = BY_NAMESPACE.get(q.ns);
    if (mod) return `${mod.prefix}:${q.name}`;
    return `${NCL40_NAMESPACES[q.ns] ?? q.ns} · ${q.name}`;
}

export function cardinality(c: ChildInfo): string {
    const max = c.max === 'unbounded' ? 'n' : c.max;
    return c.min === max ? c.min : `${c.min}..${max}`;
}
