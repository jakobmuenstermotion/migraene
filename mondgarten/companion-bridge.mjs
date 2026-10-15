import {grantRound,startRound} from './journey.mjs';
export const COMPANION={journalKey:'mt-garden-actions-v1',saveKey:'mondgarten.companion.save.v1'};
export function syncCompanionActions(s,raw){s.journey.preview=false;if(!raw||raw.version!==1||!Array.isArray(raw.actions))return false;let changed=false;for(const receipt of raw.actions)if(grantRound(s,receipt))changed=true;if(s.journey.round===0&&s.journey.closed&&s.journey.pending){startRound(s);changed=true;}return changed;}
export function prepareHostedState(s){s.journey.preview=false;s.journey.round=0;s.journey.closed=true;s.journey.pending=0;return s;}
