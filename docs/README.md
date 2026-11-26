# Documentação do NCL360

Site de documentação da linguagem, em Astro Starlight.

| Comando (nesta pasta) | Efeito |
|---|---|
| `npm ci` | Instala as dependências fixadas em `package-lock.json` |
| `npm run dev` | Servidor local com recarga, em `http://localhost:4321/ncl360/` |
| `npm run check` | Confere os tipos |
| `npm run build` | Gera o site em `dist/` |
| `npm run preview` | Serve o `dist/` gerado |

## Onde fica cada coisa

| O quê | Onde |
|---|---|
| Páginas escritas à mão | `src/content/docs/`, uma por arquivo; menu lateral em `astro.config.mjs` |
| Referência de elementos, tipos e schemas | gerada de `../profiles/` e `../modules/` por `src/lib/schemas.ts` |
| Descrição de elementos e atributos | `src/data/elementos.ts` |
| Papéis predefinidos dos elos | `src/data/papeis.ts` |
| Exemplos | `../exemplos/`, exibidos com o componente `src/components/exemplo.astro` |

## Ao mudar um schema

O build falha se `src/data/elementos.ts` e os schemas divergirem: elemento ou atributo sem descrição,
descrição de algo que não existe, ou parte do NCL 4.0 sem entrada `ncl40`. A mensagem lista cada
divergência. Um tipo novo (`simpleType`) precisa de descrição em `src/pages/referencia/tipos.astro`.

## Ao mudar um exemplo

Valide antes de publicar:

```sh
NCL40_DIR=/pasta/com/NCL4.0 ../scripts/validar-exemplos.sh
```

`NCL40_DIR` é a pasta que contém `NCL4.0/modules/` (arquivos suplementares da ABNT NBR 25608). O CI
não valida os exemplos, porque esses módulos não estão no repositório.

## Endereços espelhados do ncl.org.br

Namespaces e URIs públicas dos schemas ficam sob `http://www.ncl.org.br/NCL360/`. O site reproduz o que
vem depois desse prefixo:

| Endereço no ncl.org.br | Endereço no site |
|---|---|
| `http://www.ncl.org.br/NCL360/NCL360Profile` (namespace) | `/ncl360/NCL360Profile/` (página do perfil) |
| `http://www.ncl.org.br/NCL360/NCL360Layout` (namespace) | `/ncl360/NCL360Layout/` (página do módulo) |
| `http://www.ncl.org.br/NCL360/modules/Layout.xsd` (URI pública) | `/ncl360/modules/Layout.xsd` (arquivo) |
| `http://www.ncl.org.br/NCL360/` | `/ncl360/` (início) |

No servidor do ncl.org.br basta uma regra: `http://www.ncl.org.br/NCL360/<resto>` →
`https://multisens.com.br/ncl360/<resto>`, preservando `<resto>` e as maiúsculas. No Apache:

```apache
RedirectMatch 302 ^/NCL360/(.*)$ https://multisens.com.br/ncl360/$1
```

A página de cada schema fica no último segmento do seu `targetNamespace`, e o menu lateral lê o mesmo
valor. O build falha se um namespace não estiver sob `http://www.ncl.org.br/NCL360/` ou se a URI
pública de um `.xsd` não for `http://www.ncl.org.br/NCL360/<caminho do arquivo no repositório>`.

## Publicação

O workflow `.github/workflows/docs.yml` gera e publica o site no GitHub Pages a cada push em `main`
que toque `docs/`, `profiles/`, `modules/` ou `exemplos/`. Em *Settings → Pages*, a fonte do
repositório tem de ser *GitHub Actions*. O endereço será `https://multisens.com.br/ncl360/`.
