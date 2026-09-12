  const groups=B.physicalPlan([
    {type:'side',id:'mac',name:'Mac & Cheese',side:B.SIDES.mac,vessel:B.VESSELS.chafer,quantity:{amount:1.25,unit:'tin'}}
  ]);
  assert.equal(groups.length,2);
  assert.equal(groups[0].items.length,1);
  assert.equal(groups[0].items[0].serviceFill,'full');
  assert.equal(groups[1].items.length,1);
  assert.equal(groups[1].items.length,1);
  assert.equal(groups[1].items[0].serviceFill,'quarter');
});

test('buffet bread selection is driven by Accompaniment selections',()=>{
  const entry=fs.readFileSync(new URL('../public/buffet-ui.js',import.meta.url),'utf8');
  const ui=fs.readFileSync(new URL('../public/buffet-ui-v2.js',import.meta.url),'utf8');
  assert.match(entry,/buffet-ui-v2\.js/);
  assert.match(ui,/function accompanimentBreadIds\(\)/);
  assert.match(ui,/selectedSides\.has\('rolls'\).*hawaiian/);
  assert.match(ui,/selectedSides\.has\('cornbread'\).*cornbread/);
  assert.match(ui,/state\.breadIds=accompanimentBreadIds\(\)/);
  assert.match(ui,/Driven by the Accompaniment selections above/);
});