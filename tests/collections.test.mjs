import test from 'node:test'
import assert from 'node:assert/strict'

import {
  collectionEscalationThresholds,
  formatCollectionThresholds,
  normalizeCollectionsWindow,
} from '../lib/collections.ts'

test('normalizeCollectionsWindow clamps and orders soft/hard days', () => {
  assert.deepEqual(normalizeCollectionsWindow(0, 0), { softDays: 1, hardDays: 2 })
  assert.deepEqual(normalizeCollectionsWindow(5, 99), { softDays: 5, hardDays: 60 })
  assert.deepEqual(normalizeCollectionsWindow(8, 6), { softDays: 8, hardDays: 9 })
})

test('collectionEscalationThresholds creates distinct staged days', () => {
  assert.deepEqual(collectionEscalationThresholds(3, 7), [3, 4, 6, 7])
  assert.deepEqual(collectionEscalationThresholds(5, 6), [5, 6])
})

test('formatCollectionThresholds renders readable copy', () => {
  assert.equal(formatCollectionThresholds([]), '')
  assert.equal(formatCollectionThresholds([4]), 'day 4')
  assert.equal(formatCollectionThresholds([3, 7]), 'days 3 and 7')
  assert.equal(formatCollectionThresholds([3, 4, 6, 7]), 'days 3, 4, 6, and 7')
})
