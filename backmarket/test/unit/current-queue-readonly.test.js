const assert = require('assert');
const {
  buildPlan,
  classifyRow,
  linkedIds,
  columnText,
} = require('../../scripts/current-queue-readonly');

const plan = buildPlan();
assert.equal(plan.ok, true);
assert.equal(plan.liveRead, false);
assert.equal(plan.liveMutation, false);
assert.equal(plan.notifications, false);

const main = {
  id: '1',
  name: 'BM test',
  column_values: [
    { id: 'status_2_Mjj4GJNQ', text: 'Fair' },
    { id: 'status8', text: 'Space Grey' },
    { id: 'board_relation5', linked_item_ids: ['2'] },
  ],
};
const bm = {
  id: '2',
  name: 'MacBook Pro 13-inch A2338',
  column_values: [
    { id: 'text_mkyd4bx3', text: '' },
    { id: 'text89', text: 'MBP.A2338.M2.8GB.256GB.Grey.Fair' },
    { id: 'text', text: 'A2338' },
    { id: 'status__1', text: '8GB' },
    { id: 'color2', text: '256GB' },
    { id: 'status7__1', text: '8-Core' },
    { id: 'status8__1', text: '10-Core' },
  ],
};

assert.deepEqual(linkedIds(main), ['2']);
assert.equal(columnText(bm, 'text89'), 'MBP.A2338.M2.8GB.256GB.Grey.Fair');
assert.equal(classifyRow(main, bm).classification, 'READY_FOR_LISTING_PROPOSAL');
assert.equal(classifyRow(main, null).classification, 'MISSING_BM_DEVICE_RELATION');
assert.equal(classifyRow({ ...main, column_values: [{ id: 'status8', text: 'Space Grey' }] }, bm).classification, 'MISSING_FINAL_GRADE');
assert.equal(classifyRow(main, { ...bm, column_values: bm.column_values.filter(c => c.id !== 'text89') }).classification, 'QC_SKU_MISSING');
assert.equal(classifyRow(main, { ...bm, column_values: bm.column_values.map(c => c.id === 'text89' ? { ...c, text: 'WRONG' } : c) }).classification, 'QC_SKU_MISMATCH');
assert.equal(classifyRow(main, { ...bm, column_values: bm.column_values.filter(c => c.id !== 'status8__1') }).classification, 'MISSING_SPEC_FIELD');

console.log('current-queue-readonly.test passed');
