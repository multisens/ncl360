// Reads the regions of an example scene for the 360° diagram
// (components/cena-360.astro): each region with its position, size and the
// media presented in it.

import { XMLParser } from 'fast-xml-parser';
import { exemplo } from './exemplos';

export interface RegiaoCena {
    id: string;
    polar: number;
    azimuthal: number;
    radius: number;
    width: number;
    height: number;
    pin: 'environment' | 'camera';
    zIndex?: number;
    /** Ids of the media presented in this region. */
    midias: string[];
}

export interface BindCena {
    component: string;
    role: string;
    interface?: string;
}

/** A link that uses only predefined roles: one condition, its actions. */
export interface LinkCena {
    id?: string;
    condicao: BindCena;
    acoes: BindCena[];
}

export interface Cena {
    regioes: RegiaoCena[];
    /** Ids of the media presented on default.sky (the 360° video). */
    ceu: string[];
    /** Media started by the ports. */
    portas: string[];
    /** Links without xconnector, which the diagram can simulate. */
    elos: LinkCena[];
}

const CONDICOES = ['onBegin', 'onEnd', 'onAbort', 'onPause', 'onResume', 'onEndPreparation', 'onBeginView', 'onEndView'];

type Attrs = Record<string, string>;

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

function list<T>(v: T | T[] | undefined): T[] {
    return v === undefined ? [] : Array.isArray(v) ? v : [v];
}

function num(value: string, unit: string, where: string): number {
    const m = value.match(new RegExp(`^([-+]?[0-9]*\\.?[0-9]+)${unit}$`));
    if (!m) throw new Error(`${where}: "${value}" is not a number in ${unit}`);
    return Number(m[1]);
}

export function lerCena(arquivo: string): Cena {
    const doc = parser.parse(exemplo(arquivo).source).ncl360;
    const regions = list<Attrs>(doc.head.region);
    const descriptors = list<Attrs>(doc.head.descriptor);
    const media = list<Attrs>(doc.body.media);

    const midiasDaRegiao = (region: string) => {
        const ds = descriptors.filter((d) => d.region === region).map((d) => d.id);
        return media.filter((m) => ds.includes(m.descriptor)).map((m) => m.id);
    };

    const elos: LinkCena[] = list<Attrs & { bind: Attrs | Attrs[] }>(doc.body.link)
        .filter((l) => !l.xconnector)
        .map((l) => {
            const binds = list(l.bind).map((b) => ({ component: b.component, role: b.role, interface: b.interface }));
            const condicoes = binds.filter((b) => CONDICOES.includes(b.role));
            if (condicoes.length !== 1) throw new Error(`${arquivo}, link ${l.id}: expected one condition`);
            return { id: l.id, condicao: condicoes[0], acoes: binds.filter((b) => !CONDICOES.includes(b.role)) };
        });

    return {
        ceu: midiasDaRegiao('default.sky'),
        portas: list<Attrs>(doc.body.port).map((p) => p.component),
        elos,
        regioes: regions.map((r) => {
            const where = `${arquivo}, region ${r.id}`;
            return {
                id: r.id,
                polar: num(r.polar, 'd', where),
                azimuthal: num(r.azimuthal, 'd', where),
                radius: num(r.radius, 'm', where),
                width: num(r.width, 'm', where),
                height: num(r.height, 'm', where),
                pin: r.pin === 'camera' ? 'camera' : 'environment',
                zIndex: r.zIndex === undefined ? undefined : Number(r.zIndex),
                midias: midiasDaRegiao(r.id),
            };
        }),
    };
}
