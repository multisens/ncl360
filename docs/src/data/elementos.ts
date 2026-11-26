// Prose of the element reference (/referencia/elementos/).
//
// Structure, attributes, cardinalities and value types come from the XML
// Schemas (src/lib/schemas.ts). This file adds only what the schemas cannot
// say: the description of each element and attribute, and the attributes of
// the parts taken from NCL 4.0, whose schemas are not in this repository.
//
// The build fails when this file and the schemas disagree: an element or
// attribute of the schemas without a description here, a description of
// something the schemas do not have, or an NCL 4.0 part not covered by an
// `ncl40` entry (src/lib/referencia.ts).

const NCL40 = 'http://www.ncl.org.br/NCL4.0/';
const CONNECTOR = `${NCL40}CausalConnectorFunctionality|`;

export interface AtributoNcl40 {
    name: string;
    type: string;
    use: 'required' | 'optional';
    desc: string;
}

export interface Ncl40 {
    /** Namespace and name of the NCL 4.0 type, group or element, "ns|name". */
    de: string;
    /** Section of ABNT NBR 25608 that defines it. */
    secao: string;
    /** Its attributes; omitted when the page only points to the definition. */
    atributos?: AtributoNcl40[];
    filhos?: { name: string; min: string; max: string }[];
}

export interface Elemento {
    name: string;
    resumo: string;
    /** Description of each attribute the NCL360 schemas declare. */
    atributos?: Record<string, string>;
    ncl40?: Ncl40[];
    /** Notes shown below the tables. */
    notas?: string[];
}

export interface Grupo {
    id: string;
    titulo: string;
    intro: string;
    elementos: Elemento[];
}

export const GRUPOS: Grupo[] = [
    {
        id: 'estrutura',
        titulo: 'Estrutura do documento',
        intro: 'Um documento NCL360 descreve uma cena 360° inteira: um elemento raiz com cabeçalho e corpo.',
        elementos: [
            {
                name: 'ncl360',
                resumo: 'Elemento raiz. Contém toda a definição da cena.',
                atributos: { id: 'Identificador do documento.' },
                notas: [
                    'Declare o namespace do perfil no elemento raiz, `xmlns="http://www.ncl.org.br/NCL360/NCL360Profile"`, para que o documento seja validado pelo schema.',
                ],
            },
            {
                name: 'head',
                resumo: 'Cabeçalho: características de exibição da cena (regiões e descritores) e relações genéricas (conectores).',
                notas: ['Os filhos aparecem nesta ordem: todos os `<region>`, depois os `<descriptor>`, depois os `<causalConnector>`.'],
            },
            {
                name: 'body',
                resumo: 'Corpo: os objetos que compõem a cena e os relacionamentos entre eles.',
                notas: ['Os filhos aparecem nesta ordem: todos os `<port>`, depois as `<media>`, depois os `<link>`.'],
            },
        ],
    },
    {
        id: 'cabecalho',
        titulo: 'Cabeçalho',
        intro: 'Onde e como cada mídia é apresentada.',
        elementos: [
            {
                name: 'region',
                resumo: 'Posição no ambiente virtual onde um objeto de mídia é apresentado, em coordenadas polares em relação à posição inicial do usuário.',
                atributos: {
                    id: 'Identificador da região, usado no atributo `region` do descritor.',
                    polar: 'Ângulo polar da posição, em graus. Ex.: `10d`.',
                    azimuthal: 'Ângulo azimutal da posição, em graus. Ex.: `-25d`.',
                    width: 'Largura do objeto apresentado, em metros. Ex.: `2m`.',
                    height: 'Altura do objeto apresentado, em metros. Ex.: `1.5m`.',
                    radius: 'Distância entre o usuário e o objeto, em metros. Ex.: `6m`.',
                    zIndex: 'Índice de sobreposição entre objetos.',
                    pin: '`environment`: o objeto fica fixo no ambiente. `camera`: o objeto acompanha a câmera.',
                },
            },
            {
                name: 'descriptor',
                resumo: 'Características de apresentação de uma mídia: posição, duração, som e projeção.',
                atributos: {
                    id: 'Identificador do descritor, usado no atributo `descriptor` da mídia.',
                    region: 'Onde a mídia é apresentada: o `id` de um `<region>` ou um identificador predefinido. Use `default.sky` para apresentar a mídia no ambiente inteiro, como num vídeo 360°.',
                    dur: 'Duração explícita da apresentação, em segundos. Ex.: `10`.',
                    soundType: 'Formato do som da mídia.',
                    volume: 'Volume do som, de `0` a `1`.',
                    projection: 'Projeção de uma mídia 360°.',
                },
                notas: [
                    'O schema não confere o valor de `region`: um `id` inexistente passa na validação.',
                ],
            },
            {
                name: 'descriptorParam',
                resumo: 'Parâmetro adicional de apresentação, como par nome-valor.',
                ncl40: [
                    {
                        de: `${NCL40}Descriptor|descriptorParamPrototype`,
                        secao: 'A.3.7',
                        atributos: [
                            { name: 'name', type: 'xs:string', use: 'required', desc: 'Nome do parâmetro.' },
                            { name: 'value', type: 'xs:string', use: 'required', desc: 'Valor do parâmetro.' },
                        ],
                    },
                ],
            },
        ],
    },
    {
        id: 'corpo',
        titulo: 'Corpo',
        intro: 'O conteúdo da cena e o que é apresentado quando ela começa.',
        elementos: [
            {
                name: 'port',
                resumo: 'Mídia apresentada quando a cena começa. Pode haver mais de um.',
                ncl40: [
                    {
                        de: `${NCL40}CompositeNodeInterface|compositeNodePortPrototype`,
                        secao: 'A.3.6',
                        atributos: [
                            { name: 'id', type: 'xs:ID', use: 'required', desc: 'Identificador da porta.' },
                            { name: 'component', type: 'xs:IDREF', use: 'required', desc: '`id` da mídia apresentada.' },
                            { name: 'interface', type: 'xs:string', use: 'optional', desc: '`id` de uma âncora da mídia, para começar por ela.' },
                        ],
                    },
                ],
                notas: ['O `id` é obrigatório, como em todo `<port>` do NCL 4.0.'],
            },
            {
                name: 'media',
                resumo: 'Objeto de mídia da cena: vídeo 360°, imagem ou vídeo 2D, objeto 3D ou áudio.',
                atributos: {
                    id: 'Identificador da mídia. É também o identificador que uma aplicação NCL 4.0 usa no `label` de uma âncora da cena.',
                    src: 'URI do conteúdo.',
                    descriptor: '`id` do descritor que define como a mídia é apresentada.',
                },
            },
            {
                name: 'area',
                resumo: 'Âncora temporal: trecho da mídia usado para sincronização, com início e fim contados a partir do começo da apresentação da mídia.',
                atributos: { id: 'Identificador da âncora, usado no atributo `interface` de um `<bind>`.' },
                ncl40: [
                    {
                        de: `${NCL40}MediaContentAnchor|temporalAnchorAttrs`,
                        secao: 'A.3.6',
                        atributos: [
                            { name: 'begin', type: 'xs:string', use: 'optional', desc: 'Início do trecho. Ex.: `30s`.' },
                            { name: 'end', type: 'xs:string', use: 'optional', desc: 'Fim do trecho. Ex.: `90s`.' },
                        ],
                    },
                ],
            },
            {
                name: 'property',
                resumo: 'Guarda ou dá acesso a um dado da apresentação da mídia.',
                ncl40: [
                    {
                        de: `${NCL40}PropertyAnchor|propertyAnchorPrototype`,
                        secao: 'A.3.6',
                        atributos: [
                            { name: 'name', type: 'xs:string', use: 'required', desc: 'Nome da propriedade.' },
                            { name: 'value', type: 'xs:string', use: 'optional', desc: 'Valor inicial.' },
                        ],
                    },
                ],
                notas: ['O atributo `externable` do NCL 4.0 é proibido no NCL360.'],
            },
        ],
    },
    {
        id: 'elos',
        titulo: 'Elos',
        intro: 'Relações causais entre a apresentação dos objetos da cena e suas âncoras.',
        elementos: [
            {
                name: 'link',
                resumo: 'Relação causal: quando as condições acontecem, as ações são executadas.',
                atributos: {
                    id: 'Identificador do elo.',
                    xconnector: '`id` do `<causalConnector>` que o elo usa. Pode ser omitido quando o elo usa só papéis predefinidos.',
                },
                notas: [
                    'Um elo tem pelo menos dois `<bind>`: um para a condição e um para a ação.',
                    'Os papéis predefinidos estão em [Tipos e valores](../tipos/#papéis-predefinidos).',
                ],
            },
            {
                name: 'linkParam',
                resumo: 'Valor de um parâmetro do conector, válido para todos os binds do elo.',
                ncl40: [
                    {
                        de: `${NCL40}Linking|linkParam`,
                        secao: 'A.3.8',
                        atributos: [
                            { name: 'name', type: 'xs:string', use: 'required', desc: 'Nome do `<connectorParam>`.' },
                            { name: 'value', type: 'xs:anySimpleType', use: 'required', desc: 'Valor do parâmetro.' },
                        ],
                    },
                ],
            },
            {
                name: 'bind',
                resumo: 'Liga um papel a uma mídia, ou a uma âncora dela.',
                ncl40: [
                    {
                        de: `${NCL40}Linking|bind`,
                        secao: 'A.3.8',
                        atributos: [
                            { name: 'role', type: 'xs:string', use: 'required', desc: 'Papel: predefinido ou declarado no conector do elo.' },
                            { name: 'component', type: 'xs:IDREF', use: 'required', desc: '`id` da mídia.' },
                            { name: 'interface', type: 'xs:string', use: 'optional', desc: '`id` de uma `<area>` ou `name` de uma `<property>` da mídia.' },
                        ],
                        filhos: [{ name: 'bindParam', min: '0', max: 'unbounded' }],
                    },
                ],
                notas: [
                    'O `<bind>` não tem atributo `delay`. Para atrasar uma ação, declare o atraso num conector e passe o valor por `<bindParam>` ou `<linkParam>` (veja o exemplo [Conector com atraso](../../exemplos/conector-com-atraso/)).',
                ],
            },
            {
                name: 'bindParam',
                resumo: 'Valor de um parâmetro do conector, só para este bind.',
                ncl40: [
                    {
                        de: `${NCL40}Linking|bindParam`,
                        secao: 'A.3.8',
                        atributos: [
                            { name: 'name', type: 'xs:string', use: 'required', desc: 'Nome do `<connectorParam>`.' },
                            { name: 'value', type: 'xs:anySimpleType', use: 'required', desc: 'Valor do parâmetro.' },
                        ],
                    },
                ],
            },
        ],
    },
    {
        id: 'conectores',
        titulo: 'Conectores',
        intro: 'Os conectores seguem a definição do NCL 4.0 sem alteração. Esta seção lista os elementos aceitos; atributos e semântica estão na ABNT NBR 25608, Seção A.3.9.',
        elementos: [
            ['causalConnector', 'Relação genérica, reutilizada pelos elos que a referenciam no atributo `xconnector`.'],
            ['connectorParam', 'Parâmetro do conector, com valor dado em cada elo.'],
            ['simpleCondition', 'Condição simples: um papel de condição.'],
            ['compoundCondition', 'Condição composta por outras condições e asserções.'],
            ['simpleAction', 'Ação simples: um papel de ação.'],
            ['compoundAction', 'Ação composta por outras ações.'],
            ['assessmentStatement', 'Asserção que compara dois valores.'],
            ['attributeAssessment', 'Valor de um atributo usado numa asserção.'],
            ['valueAssessment', 'Valor constante usado numa asserção.'],
            ['compoundStatement', 'Asserção composta por outras asserções.'],
        ].map(([name, resumo]) => ({
            name,
            resumo,
            ncl40: [{ de: `${CONNECTOR}${name}`, secao: 'A.3.9' }],
        })),
    },
];
