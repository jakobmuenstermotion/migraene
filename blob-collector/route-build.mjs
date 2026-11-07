import {payConstruction} from './construction-stock.mjs';
// Abkürzungen, die man aus Materialien baut (Jakob 31.10.): Sperren mit `build` öffnet kein Sauger, sondern dieser Bau.
export function buildRoute(s,id){const o=s.obstacles.find(o=>o.id===id&&o.route&&o.build&&!o.cleared);if(!o||(o.buildSide&&!o.buildSide(s))||!payConstruction(s,o.build.cost))return false;o.cleared=true;o.clearedAt=s.time;s.events?.push('obstacle');s.layoutRevision=(s.layoutRevision??0)+1;return true;}
