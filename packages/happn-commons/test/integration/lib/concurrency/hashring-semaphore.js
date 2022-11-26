const hashRingSemaphore = require('../../../../lib/concurrency/hashring-semaphore').create({
  slots: 5,
});
require('happn-commons-test').describe({ timeout: 120e3 }, function (test) {
  it('tests using the semaphore to lock group to concurrency according to username', async () => {
    let transactions = [
      { username: 'test1', delay: 5e2, id: 1 },
      { username: 'test2', delay: 5e2, id: 2 },
      { username: 'test3', delay: 5e2, id: 3 },
      { username: 'test4', delay: 5e2, id: 4 },
      { username: 'test5', delay: 5e2, id: 5 },
      { username: 'test1', delay: 4e2, id: 6 },
      { username: 'test2', delay: 4e2, id: 7 },
      { username: 'test3', delay: 4e2, id: 8 },
      { username: 'test4', delay: 4e2, id: 9 },
      { username: 'test5', delay: 4e2, id: 10 },
      { username: 'test1', delay: 3e2, id: 11 },
      { username: 'test2', delay: 3e2, id: 12 },
      { username: 'test3', delay: 3e2, id: 13 },
      { username: 'test4', delay: 3e2, id: 14 },
      { username: 'test5', delay: 3e2, id: 15 },
      { username: 'test1', delay: 2e2, id: 16 },
      { username: 'test2', delay: 2e2, id: 17 },
      { username: 'test3', delay: 2e2, id: 18 },
      { username: 'test4', delay: 2e2, id: 19 },
      { username: 'test5', delay: 2e2, id: 20 },
      { username: 'test1', delay: 1e2, id: 21 },
      { username: 'test2', delay: 1e2, id: 22 },
      { username: 'test3', delay: 1e2, id: 23 },
      { username: 'test4', delay: 1e2, id: 24 },
      { username: 'test5', delay: 1e2, id: 25 },
    ];

    let userTransactions = {
      test1: [],
      test2: [],
      test3: [],
      test4: [],
      test5: [],
    };

    let performTx = async function (tx) {
      await hashRingSemaphore.lock(tx.username, async () => {
        await test.delay(tx.delay);
        userTransactions[tx.username].push(tx.id);
      });
    };

    for (let transaction of transactions) {
      await performTx(transaction);
    }
    test.expect(userTransactions).to.eql({
      test1: [1, 6, 11, 16, 21],
      test2: [2, 7, 12, 17, 22],
      test3: [3, 8, 13, 18, 23],
      test4: [4, 9, 14, 19, 24],
      test5: [5, 10, 15, 20, 25],
    });
  });

  it('ensures a failing lock works', async () => {
    let performTx = async function (tx) {
      await hashRingSemaphore.lock(tx, async () => {
        if (tx === 'break') throw new Error('test error');
      });
    };

    let eMessage;
    try {
      await performTx('break');
    } catch (e) {
      eMessage = e.message;
    }
    test.expect(eMessage).to.be('test error');
  });
});
