import {fertilizerValue} from './outdoors.mjs';
import {wearsButterflyWings} from './harvest-moments.mjs';
import { helperBoost } from "./apiary.mjs";
import { snailProfile, snailName, snailsResting } from "./snail-care.mjs";
import { advanceWoodcock } from "./woodcock.mjs";
import { materialHarvestRemaining } from "./funding.mjs";
import { harvestingAllowed } from "./journey.mjs";
import { BEDS, WORKSHOPS, VILLAGE, PRODUCTS } from "./village-content.mjs";
import { WORLD } from "./content.mjs";
import {
  availableProducts,
  bedYield,
  bedRegrow,
  collectProducts,
  takeBag,
  depositWorkshopSupplies,
  workshopSpot,
} from "./village.mjs";
import { capacity } from "./core.mjs";
import { credit } from "./money.mjs";
import {
  cargoCount,
  cargoValue,
  ingredientDestination,
  planSupply,
  supplySourceSpot,
  takeSupply,planWarehouseSupply,takeWarehouseSupply,returnSupplyToWarehouse,
} from "./logistics.mjs";
function walk(actor, target, speed, dt) {
  const dx = target.x - actor.x,
    dz = target.z - actor.z,
    d = Math.hypot(dx, dz);
  actor.moving = d > 0.16;
  if (!actor.moving) return true;
  actor.x += (dx / d) * Math.min(d, speed * dt);
  actor.z += (dz / d) * Math.min(d, speed * dt);
  let a = Math.atan2(dx, dz);
  while (a - actor.angle > Math.PI) a -= Math.PI * 2;
  while (a - actor.angle < -Math.PI) a += Math.PI * 2;
  actor.angle = a;
  return d < Math.max(0.2, speed * dt);
}
function deliverIngredients(s, actor, cargo, speed, dt, events, saleKind) {
  const snail = saleKind === "snailSale";
  const target =
    snail && actor.saleCrop && cargo.items[actor.saleCrop] > 1e-8
      ? { kind: "sell", id: actor.saleCrop, ...WORLD.bank }
      : ingredientDestination(s, cargo, actor, { sellOverflow: snail });
  if (snail && target?.overflow) actor.saleCrop = target.id;
  if (!target || !walk(actor, target, speed, dt)) return;
  if (target.kind === "workshop") {
    const count = depositWorkshopSupplies(s, target.workshop, cargo);
    if (count > 0)
      events.push({
        kind: "helperDelivery",
        x: actor.x,
        z: actor.z,
        to: { x: target.workshop.x, z: target.workshop.z },
        count,
      });
    const next =
      snail && ingredientDestination(s, cargo, actor, { sellOverflow: true });
    if (next?.overflow) actor.saleCrop = next.id;
  } else {
    const count = cargo.items[target.id],
      value = cargo.values[target.id] ?? 0;
    credit(s, value);
    s.village.autoSold += count;
    delete cargo.items[target.id];
    delete cargo.values[target.id];
    events.push({ kind: saleKind, value, count });
    if (snail) actor.saleCrop = null;
  }
}
export class GardenAutomation {
  constructor(s) {
    this.snails = [];
    this.snailClock = 0;
    this.partner = {
      x: VILLAGE.partner.x,
      z: VILLAGE.partner.z + 2,
      angle: 0,
      moving: false,
      visible: s.village.partner,
      bag: 0,
    };
    this.partnerJob = "";
    this.sync(s);
  }
  sync(s) {
    const beds = BEDS.map((b, i) => ({ ...b, index: i })).filter(
      (b) => s.village.beds[b.index],
    );
    while (this.snails.length < s.village.snails) {
      const i = this.snails.length,
        b = beds[i % beds.length],
        load = s.village.snailLoads?.[i],
        items = { ...(load?.items ?? {}) },
        values = { ...(load?.values ?? {}) };
      this.snails.push({
        x: load?.x ?? b.x,
        z: load?.z ?? b.z + b.rows * b.spacing * 0.45,
        angle: 0,
        moving: false,
        target: null,
        bed: b.index,
        items,
        values,
        bag: Object.values(items).reduce((a, b) => a + b, 0),
        timer: 0,
        mode: load?.mode ?? "graze",
        saleCrop: load?.saleCrop ?? null,
        supplyWorkshop:load?.supplyWorkshop??null,
        supplyClock:0,
      });
    }
    this.snails.length = s.village.snails;
    this.partner.visible = s.village.partner;
    for (const [i, a] of this.snails.entries()) {
      const profile = snailProfile(s, i);
      if(a.task!==undefined&&a.task!==profile.task){a.saleCrop=null;a.supplyWorkshop=null;a.target=null;a.timer=0;a.supplyClock=0;a.mode=cargoCount(a)>1e-8?'deliver':'graze';}
      const field=profile.field!==null&&s.village.beds[profile.field]?profile.field:null;
      if(a.assignedField!==field){a.target=null;a.timer=0;}
      if(a.assignedWorkshop!==undefined&&a.assignedWorkshop!==profile.workshop){a.supplyWorkshop=null;a.target=null;a.timer=0;a.supplyClock=0;}
      a.assignedWorkshop=profile.workshop;
      a.assignedField=field;
      a.task = profile.task;
      a.name = snailName(s, i);
      a.sleeping = snailsResting(s) || profile.task === "rest";
      if (a.sleeping) a.moving = false;
      a.level = s.village.snailLevel;
      a.species = s.village.farm.helpers[i] ?? null;
      a.flying = wearsButterflyWings(s,i);
      a.hat = s.village.boutiques.snailHats?.[i] ?? null;
    }
  }
  snapshot(s) {
    s.village.snailLoads = this.snails.map((a) => ({
      x: a.x,
      z: a.z,
      items: { ...a.items },
      values: { ...a.values },
      mode: a.mode,
      saleCrop: a.saleCrop,
      supplyWorkshop:a.supplyWorkshop,
    }));
  }
  update(s, cells, player, dt, time) {
    const events = advanceWoodcock(s, dt),
      v = s.village;
    this.sync(s);
    this.snapshot(s);
    const beds = BEDS.map((b, i) => ({ ...b, index: i })).filter(
      (b) => v.beds[b.index],
    );
    if (dt <= 0) return events;
    for (let i = 0; i < this.snails.length; i++) {
      const snail = this.snails[i],
        speed =
          Math.min(3, VILLAGE.snail.speed * Math.pow(1.18, v.snailLevel)) *
          helperBoost(s, "snail:" + i) * (snail.flying ? 2 : 1);
      if (snail.sleeping) continue;
      if(snail.task==='supply'){
        snail.target=null;snail.timer=0;snail.bag=cargoCount(snail);
        if(snail.bag>1e-8){snail.mode='deliver';const w=WORKSHOPS.find(w=>w.id===snail.assignedWorkshop&&w.id===snail.supplyWorkshop&&v.workshops[w.id].level);
          if(w){if(walk(snail,workshopSpot(w,'input'),speed*1.25,dt)){const count=depositWorkshopSupplies(s,w,snail);if(count)events.push({kind:'helperDelivery',x:snail.x,z:snail.z,to:{x:w.x,z:w.z},count});}}
          else if(walk(snail,VILLAGE.warehouse,speed*1.25,dt)){const count=returnSupplyToWarehouse(s,snail);if(count)events.push({kind:'helperDelivery',x:snail.x,z:snail.z,to:{...VILLAGE.warehouse},count});}
          snail.bag=cargoCount(snail);if(snail.bag<1e-8){snail.items={};snail.values={};snail.bag=0;snail.supplyWorkshop=null;snail.mode='supply';}continue;
        }
        snail.mode='supply';snail.supplyWorkshop=null;
        if(walk(snail,VILLAGE.warehouse,speed*1.25,dt)){
          snail.supplyClock=Math.max(0,snail.supplyClock-dt);if(snail.supplyClock>0)continue;snail.supplyClock=.5;
          const limit=Math.min(64,VILLAGE.snail.capacity+v.snailLevel*VILLAGE.snail.capacityPerLevel),job=planWarehouseSupply(s,limit,this.snails,snail.assignedWorkshop);
          if(job){takeWarehouseSupply(s,job);snail.items=job.items;snail.values=job.values;snail.bag=cargoCount(snail);if(snail.bag){snail.supplyWorkshop=job.workshop;snail.mode='deliver';events.push({kind:'snailSupplyPickup',x:snail.x,z:snail.z,items:{...snail.items},count:snail.bag});}}
        }
        continue;
      }
      if (snail.mode === "deliver") {
        if (snail.task === "warehouse") {
          if (walk(snail, VILLAGE.warehouse, speed * 1.25, dt)) {
            const delivered=returnSupplyToWarehouse(s,snail);
            if (delivered)
              events.push({
                kind: "helperDelivery",
                x: snail.x,
                z: snail.z,
                to: { ...VILLAGE.warehouse },
                count: delivered,
              });
          }
        } else {
          if (snail.task === "sell")
            snail.saleCrop =
              Object.keys(snail.items).find((id) => snail.items[id] > 1e-8) ??
              null;
          deliverIngredients(
            s,
            snail,
            snail,
            speed * 1.25,
            dt,
            events,
            "snailSale",
          );
        }
        snail.bag = cargoCount(snail);
        if (snail.bag < 1e-8) {
          snail.items = {};
          snail.values = {};
          snail.bag = 0;
          snail.mode = "graze";
          snail.target = null;
        }
        continue;
      }
      if (!harvestingAllowed(s)) {
        snail.moving = false;
        if (snail.bag > 0) snail.mode = "deliver";
        continue;
      }
      if(!beds.length){snail.moving=false;continue;}
      snail.bed = snail.assignedField??beds[i % beds.length].index;
      if (
        snail.target &&
        player &&
        Math.hypot(snail.target.x - player.x, snail.target.z - player.z) <
          VILLAGE.snail.playerSpace
      )
        snail.target = null;
      if (
        !snail.target ||
        snail.target.readyAt > time ||
        snail.target.bed !== snail.bed
      ) {
        snail.target =
          cells
            .filter(
              (p) =>
                p.bed === snail.bed &&
                p.readyAt <= time &&
                (!player ||
                  Math.hypot(p.x - player.x, p.z - player.z) >=
                    VILLAGE.snail.playerSpace) &&
                materialHarvestRemaining(s, p.crop) > 0,
            )
            .sort(
              (a, b) =>
                Math.hypot(a.x - snail.x, a.z - snail.z) -
                Math.hypot(b.x - snail.x, b.z - snail.z),
            )[0] ?? null;
      }
      if (!snail.target) {
        snail.moving = false;
        if (snail.bag > 0) snail.mode = "deliver";
        else if(snail.assignedField!==null)walk(snail,BEDS[snail.bed],speed,dt);
        continue;
      }
      if (walk(snail, snail.target, speed, dt)) {
        snail.timer += dt * helperBoost(s, "snail:" + i);
        if (
          snail.timer >=
          Math.max(
            0.12,
            (BEDS[snail.bed].mineHits
              ? BEDS[snail.bed].mineHits * BEDS[snail.bed].mineSeconds
              : (BEDS[snail.bed].pickSeconds ?? VILLAGE.snail.harvestSeconds)) /
              Math.pow(1.18, v.snailLevel),
          )
        ) {
          snail.timer = 0;
          const cell = snail.target;
          if (
            cell.readyAt <= time &&
            materialHarvestRemaining(s, cell.crop) > 0
          ) {
            const count = Math.min(
                cell.rare ? 2 : 1,
                materialHarvestRemaining(s, cell.crop),
              ),
              value = count * bedYield(s, cell.bed) * VILLAGE.manualBonus * fertilizerValue(s,cell);
            cell.cutAt = time;
            cell.readyAt = time + bedRegrow(s, cell.bed);
            snail.items[cell.crop] = (snail.items[cell.crop] ?? 0) + count;
            snail.values[cell.crop] = (snail.values[cell.crop] ?? 0) + value;
            snail.bag += count;
            s.stats.harvested += count;
            s.stats.runHarvested += count;
            events.push({ kind: "snail", x: cell.x, z: cell.z });
          }
          snail.target = null;
          if (
            snail.bag >=
            VILLAGE.snail.capacity +
              v.snailLevel * VILLAGE.snail.capacityPerLevel
          )
            snail.mode = "deliver";
        }
      }
    }
    this.snapshot(s);
    const p = this.partner;
    p.visible = v.partner;
    if (!v.partner) return events;
    const cargo = v.hauler,
      count = Object.values(cargo.items).reduce((a, b) => a + b, 0);
    p.bag = count;
    p.productID =
      Object.keys(cargo.items).find(
        (id) => PRODUCTS[id] && cargo.items[id] > 0,
      ) ?? null;
    if (count > 0) {
      if (cargo.kind === "finished") {
        if (
          walk(
            p,
            WORLD.bank,
            VILLAGE.partner.speed * helperBoost(s, "partner"),
            dt,
          )
        ) {
          const value = cargoValue(cargo);
          credit(s, value);
          v.autoSold += count;
          events.push({ kind: "partnerSale", value, count });
          v.hauler = { kind: "", items: {}, values: {} };
        }
      } else {
        deliverIngredients(
          s,
          p,
          cargo,
          VILLAGE.partner.speed * helperBoost(s, "partner"),
          dt,
          events,
          "partnerSale",
        );
        if (cargoCount(cargo) < 1e-8)
          v.hauler = { kind: "", items: {}, values: {} };
      }
      p.bag = cargoCount(v.hauler);
      return events;
    }
    // Carry intermediate products to the next workshop before selling surplus.
    const ingredientJob = planSupply(s, VILLAGE.partner.capacity, {
      productsOnly: true,
    });
    if (ingredientJob) {
      if (
        walk(
          p,
          supplySourceSpot(ingredientJob),
          VILLAGE.partner.speed * helperBoost(s, "partner"),
          dt,
        )
      ) {
        takeSupply(s, ingredientJob);
        v.hauler = {
          kind: "raw",
          items: ingredientJob.items,
          values: ingredientJob.values,
        };
        p.bag = cargoCount(v.hauler);
      }
      return events;
    }
    const product = Object.keys(PRODUCTS).find(
      (id) =>
        (id === "honeyapple" || WORKSHOPS.some((w) => w.product === id)) &&
        availableProducts(s, id, true) > 0,
    );
    if (product) {
      const w = WORKSHOPS.find(
        (w) =>
          w.product === product || (product === "honeyapple" && w.id === "tea"),
      );
      if (
        walk(
          p,
          workshopSpot(w, "output"),
          VILLAGE.partner.speed * helperBoost(s, "partner"),
          dt,
        )
      ) {
        const batch = collectProducts(
          s,
          VILLAGE.partner.capacity,
          true,
          product,
        );
        v.hauler = {
          kind: "finished",
          items: batch.items,
          values: batch.values,
        };
      }
      return events;
    }
    const supplyJob = planSupply(s, VILLAGE.partner.capacity);
    if (supplyJob) {
      if (
        walk(
          p,
          supplySourceSpot(supplyJob),
          VILLAGE.partner.speed * helperBoost(s, "partner"),
          dt,
        )
      ) {
        takeSupply(s, supplyJob);
        v.hauler = {
          kind: "raw",
          items: supplyJob.items,
          values: supplyJob.values,
        };
        p.bag = cargoCount(v.hauler);
      }
      return events;
    }
    if (player && s.bag >= capacity(s) * 0.5) {
      if (
        walk(p, player, VILLAGE.partner.speed * helperBoost(s, "partner"), dt)
      ) {
        const batch = takeBag(s, VILLAGE.partner.capacity);
        v.hauler = { kind: "raw", items: batch.items, values: batch.values };
        p.bag = cargoCount(v.hauler);
        events.push({ kind: "partnerCollect", value: batch.count });
      }
      return events;
    }
    walk(
      p,
      { x: VILLAGE.warehouse.x - 1, z: VILLAGE.warehouse.z + 1.5 },
      2.4,
      dt,
    );
    return events;
  }
}
