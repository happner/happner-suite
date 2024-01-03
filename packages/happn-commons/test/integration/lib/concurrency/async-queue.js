const asyncQueue = require('../../../../lib/concurrency/async-queue').create({
  concurrency: 1,
});
require('happn-commons-test').describe({ timeout: 120e3 }, function (test) {
  it('tests concurrency', async () => {
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

    let userTransactions = [];

    let performTx = async function (tx) {
      await asyncQueue.lock(async () => {
        await test.delay(tx.delay);
        userTransactions.push(tx.id);
      });
    };

    for (let transaction of transactions) {
      await performTx(transaction);
    }

    test
      .expect(userTransactions)
      .to.eql([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
      ]);
  });

  it('ensures a failing lock works', async () => {
    let performTx = async function (tx) {
      await asyncQueue.lock(async () => {
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
