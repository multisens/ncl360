// The example scenes in exemplos/ at the root of the repository.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './schemas';

const DIR = join(REPO_ROOT, 'exemplos');

export const EXEMPLOS = readdirSync(DIR)
    .filter((f) => f.endsWith('.ncl360') || f.endsWith('.ncl'))
    .sort()
    .map((file) => ({ file, source: readFileSync(join(DIR, file), 'utf8') }));

export function exemplo(file: string) {
    const found = EXEMPLOS.find((e) => e.file === file);
    if (!found) throw new Error(`exemplos/${file} not found`);
    return found;
}
