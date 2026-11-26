// Predefined roles of NCL360 links, which a <link> can use without a
// connector (ABNT NBR 25608, A.3.21.4, Tables A.36 and A.37).

export const CONDICOES: [string, string][] = [
    ['onBegin', 'A mídia começa a ser apresentada.'],
    ['onEnd', 'A mídia termina a apresentação.'],
    ['onAbort', 'A apresentação da mídia é abortada.'],
    ['onPause', 'A apresentação da mídia é pausada.'],
    ['onResume', 'A apresentação da mídia é retomada.'],
    ['onEndPreparation', 'A mídia termina sua preparação.'],
    ['onBeginView', 'A mídia entra no campo de visão do usuário.'],
    ['onEndView', 'A mídia sai do campo de visão do usuário.'],
];

export const ACOES: [string, string][] = [
    ['start', 'Inicia a apresentação da mídia.'],
    ['stop', 'Termina a apresentação da mídia.'],
    ['abort', 'Aborta a apresentação da mídia.'],
    ['pause', 'Pausa a apresentação da mídia.'],
    ['resume', 'Retoma a apresentação da mídia.'],
    ['prepare', 'Inicia a preparação da mídia.'],
];
