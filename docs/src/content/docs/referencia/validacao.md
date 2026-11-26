---
title: Validar um documento
description: Como validar um documento NCL360 contra os schemas, com xmllint.
---

Um documento NCL360 é válido quando passa pelo schema do perfil, `profiles/NCL360.xsd`, que importa os
módulos Layout, Media e Link e partes do NCL 4.0.

## O documento

O elemento raiz precisa declarar o namespace do perfil. Sem ele, o validador não associa o documento ao
schema:

```xml
<ncl360 id="minhaCena" xmlns="http://www.ncl.org.br/NCL360/NCL360Profile">
```

## Os schemas do NCL 4.0

Os schemas do NCL360 importam módulos do NCL 4.0 pela URL `http://www.ncl.org.br/NCL4.0/modules/...`.
Essa URL não serve os arquivos, então o validador precisa encontrá-los numa pasta local. Os módulos do
NCL 4.0 fazem parte dos arquivos suplementares da ABNT NBR 25608, na pasta `NCL4.0/modules/`.

## Com o script do repositório

O script `scripts/validar-exemplos.sh` monta um catálogo XML que aponta a URL do NCL 4.0 para a pasta
local e roda o `xmllint`. A variável `NCL40_DIR` indica a pasta que contém `NCL4.0/modules/`:

```sh
NCL40_DIR=/caminho/da/pasta scripts/validar-exemplos.sh minha-cena.ncl360
```

Sem arquivos, o script valida todos os exemplos de `exemplos/`. A saída diz, para cada arquivo,
`validates` ou a lista de erros, com a linha de cada um.

## Erros comuns

| Mensagem do `xmllint` | Causa |
|---|---|
| `No matching global declaration available for the validation root` | Falta o namespace no elemento raiz. |
| `Element '...port': The attribute 'id' is required but missing` | Todo `<port>` precisa de `id`. |
| `Element '...bind', attribute 'delay': The attribute 'delay' is not allowed` | `<bind>` não tem atraso; use um conector com `delay` (veja [Conector com atraso](/ncl360/exemplos/conector-com-atraso/)). |
| `This element is not expected` | Filhos fora de ordem: no `<head>`, regiões, descritores e conectores; no `<body>`, portas, mídias e elos. |
| `'10' is not accepted by the pattern` | Ângulos terminam em `d` e distâncias em `m`, como `10d` e `2m`. |

## Referências

- Schemas XML do NCL360 (perfil e módulos Layout, Media e Link), MultiSenS.
- ABNT NBR 25608 — TV 3.0 — Application coding, Prefácio (arquivos suplementares).
