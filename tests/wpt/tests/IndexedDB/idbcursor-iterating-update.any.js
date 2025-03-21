// META: global=window,worker
// META: title=IndexedDB: Index iteration with cursor updates/deletes
// META: script=resources/support.js

'use strict';

const objStoreValues = [
  {name: 'foo', id: 1},
  {name: 'bar', id: 2},
  {name: 'foo', id: 3},
  {name: 'bar', id: 4},
];

const objStoreValuesByIndex = [
  objStoreValues[1],
  objStoreValues[3],
  objStoreValues[0],
  objStoreValues[2],
];

const functionsThatShouldNotAffectIteration = [
  (cursor) => cursor.update({}),
  (cursor) => cursor.delete(),
];

functionsThatShouldNotAffectIteration.forEach(
    (func) => indexeddb_test(
        (t, db) => {
          const objStore = db.createObjectStore('items', {autoIncrement: true});
          objStore.createIndex('name', 'name', {unique: false});
          objStoreValues.forEach((value) => objStore.add(value));
        },
        (t, db) => {
          const txn = db.transaction('items', 'readwrite');
          const objStore = txn.objectStore('items');
          const nameIndex = objStore.index('name');

          const cursorValues = [];
          nameIndex.openCursor().onsuccess = (evt) => {
            const cursor = evt.target.result;
            if (cursor) {
              func(cursor);
              cursorValues.push(cursor.value);
              cursor.continue();
            } else {
              assert_equals(
                  cursorValues.length, 4,
                  `Cursor should iterate over 4 records`);

              cursorValues.forEach((value, i) => {
                assert_object_equals(value, objStoreValuesByIndex[i]);
              });
              t.done();
            }
          };
        },
        `Calling ${func} doesn't affect index iteration`));
