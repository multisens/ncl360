// Joins the structure read from the schemas (schemas.ts) with the prose of
// src/data/elementos.ts, and fails the build when the two disagree.

import { GRUPOS, type Elemento, type Ncl40 } from '../data/elementos';
import {
    ELEMENTS,
    MODULES,
    PARENTS,
    externalKey,
    findSimpleType,
    formatQName,
    type ChildInfo,
    type ElementInfo,
    type QName,
} from './schemas';

export interface AttrRow {
    name: string;
    type: string;
    /** Anchor of the value type on the types page, when it is an NCL360 type. */
    typeAnchor?: string;
    required: boolean;
    default?: string;
    desc: string;
    /** Section of ABNT NBR 25608 when the attribute comes from NCL 4.0. */
    ncl40?: string;
}

export interface ElementEntry {
    name: string;
    resumo: string;
    module: { slug: string; title: string; prefix: string };
    via: string[];
    parents: string[];
    children: ChildInfo[];
    attributes: AttrRow[];
    /** NCL 4.0 definitions the element follows without listing attributes here. */
    ncl40Refs: { label: string; secao: string }[];
    notas: string[];
}

export interface GroupEntry {
    id: string;
    titulo: string;
    intro: string;
    elementos: ElementEntry[];
}

function typeRow(q: QName): Pick<AttrRow, 'type' | 'typeAnchor'> {
    const local = findSimpleType(q);
    return { type: formatQName(q), typeAnchor: local ? local.name.toLowerCase() : undefined };
}

function build(): GroupEntry[] {
    const problems: string[] = [];
    const byName = new Map(ELEMENTS.map((e) => [e.name, e]));
    const documented = new Set<string>();

    const entry = (doc: Elemento): ElementEntry | undefined => {
        const info: ElementInfo | undefined = byName.get(doc.name);
        if (!info) {
            problems.push(`elementos.ts describes <${doc.name}>, which the schemas do not declare`);
            return undefined;
        }
        documented.add(doc.name);
        const mod = MODULES.find((m) => m.slug === info.module)!;
        const attributes: AttrRow[] = [];
        const described = doc.atributos ?? {};

        for (const a of info.attributes) {
            const desc = described[a.name];
            if (!desc) problems.push(`<${doc.name}> attribute "${a.name}" has no description`);
            attributes.push({
                name: a.name,
                ...typeRow(a.type),
                required: a.use === 'required',
                default: a.default,
                desc: desc ?? '',
            });
        }
        for (const name of Object.keys(described)) {
            if (!info.attributes.some((a) => a.name === name)) {
                problems.push(`<${doc.name}> describes attribute "${name}", absent from the schema`);
            }
        }

        const ncl40 = new Map<string, Ncl40>((doc.ncl40 ?? []).map((n) => [n.de, n]));
        const ncl40Refs: ElementEntry['ncl40Refs'] = [];
        let children = info.children;
        for (const ext of info.external) {
            const n = ncl40.get(externalKey(ext));
            if (!n) {
                problems.push(`<${doc.name}> takes ${formatQName(ext)} from NCL 4.0 without an ncl40 entry`);
                continue;
            }
            ncl40.delete(n.de);
            if (n.atributos) {
                for (const a of n.atributos) {
                    if (info.prohibited.includes(a.name)) continue;
                    attributes.push({
                        name: a.name,
                        type: a.type,
                        required: a.use === 'required',
                        desc: a.desc,
                        ncl40: n.secao,
                    });
                }
            } else {
                ncl40Refs.push({ label: formatQName(ext), secao: n.secao });
            }
            if (n.filhos) children = [...children, ...n.filhos];
        }
        for (const left of ncl40.keys()) {
            problems.push(`<${doc.name}> has an ncl40 entry for ${left}, which the schema does not use`);
        }

        return {
            name: doc.name,
            resumo: doc.resumo,
            module: { slug: mod.slug, title: mod.title, prefix: mod.prefix },
            via: info.via,
            parents: PARENTS[doc.name] ?? [],
            children,
            attributes,
            ncl40Refs,
            notas: doc.notas ?? [],
        };
    };

    const groups = GRUPOS.map((g) => ({
        id: g.id,
        titulo: g.titulo,
        intro: g.intro,
        elementos: g.elementos.map(entry).filter((e): e is ElementEntry => !!e),
    }));

    for (const e of ELEMENTS) {
        if (!documented.has(e.name)) problems.push(`<${e.name}> is in the schemas but not in elementos.ts`);
    }
    if (problems.length) {
        throw new Error(`Element reference out of sync with the schemas:\n- ${problems.join('\n- ')}`);
    }
    // Parents of bindParam come from the NCL 4.0 content of <bind>.
    for (const g of groups) {
        for (const el of g.elementos) {
            for (const c of el.children) {
                const child = groups.flatMap((x) => x.elementos).find((x) => x.name === c.name);
                if (child && !child.parents.includes(el.name)) child.parents.push(el.name);
            }
        }
    }
    return groups;
}

export const REFERENCE: GroupEntry[] = build();
