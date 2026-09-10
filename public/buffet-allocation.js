/* FSDC Meatfest — shared physical buffet allocation layer. */
(() => {
  const B = globalThis.BuffetEngine;
  if (!B || typeof B.plan !== 'function') return;

  const stationOrder = Object.freeze(['entry','cold','vegetable','starch','core','specialty','bread','finish']);
  const stationRank = key => { const i = stationOrder.indexOf(key); return i < 0 ? 99 : i; };
  const itemName = item => item?.name || item?.side?.name || item?.bread?.name || item?.item?.name || item?.id || 'Service item';

  function allocate(groups, tableLengths = B.TABLE_GEOMETRY.main) {
    const lengths = tableLengths.map(Number).filter(n => Number.isFinite(n) && n > 0);
    const segments = lengths.map((length, i) => ({
      table: i + 1,
      length,
      items: [],
      used: 0,
      remaining: length,
      stations: [],
      overflow: false
    }));
    let tableIndex = 0;
    const overflow = [];

    for (const group of groups || []) {
      const width = Math.max(0, Number(group?.linearIn) || 0);
      if (!width) continue;
      let placed = false;
      for (let i = tableIndex; i < segments.length; i++) {
        if (width <= segments[i].remaining + 1e-9) {
          const seg = segments[i];
          seg.items.push(group);
          seg.used += width;
          seg.remaining -= width;
          if (!seg.stations.includes(group.station)) seg.stations.push(group.station);
          tableIndex = i;
          placed = true;
          break;
        }
      }
      if (!placed) overflow.push(group);
    }

    const required = (groups || []).reduce((sum, g) => sum + (Number(g?.linearIn) || 0), 0);
    const provided = lengths.reduce((sum, n) => sum + n, 0);
    const overflowIn = Math.max(0, required - provided);
    const overflowStations = [...new Set(overflow.map(g => g.station))].sort((a,b) => stationRank(a) - stationRank(b));

    return {
      shape: 'U',
      tableLengths: lengths,
      linearRequired: required,
      linearProvided: provided,
      overflow: overflow.length > 0 || required > provided,
      overflowIn,
      overflowGroups: overflow,
      overflowItems: overflow.flatMap(g => (g.items || []).map(itemName)),
      overflowStations,
      segments
    };
  }

  function wrapPlan(input = {}) {
    const plan = B.plan(input);
    const layout = allocate(plan.serviceGroups, input.mainTableLengths || B.TABLE_GEOMETRY.main);
    return {
      ...plan,
      tables: {
        ...plan.tables,
        tables: layout.tableLengths,
        linearRequired: layout.linearRequired,
        linearProvided: layout.linearProvided,
        layout,
        overflow: layout.overflow
      }
    };
  }

  const wrapped = Object.freeze({ ...B, plan: wrapPlan });
  globalThis.BuffetAllocation = Object.freeze({ allocate, itemName, stationRank });
  globalThis.BuffetEngine = wrapped;
})();
