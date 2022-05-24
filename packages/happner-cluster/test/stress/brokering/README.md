# start 2 brokers
node test/stress/brokering/broker --seq 1
node test/stress/brokering/broker --seq 2

# start some brokered to by the above components
node test/stress/brokering/instance-1.js --seq 3
node test/stress/brokering/instance-1.js --seq 4

# start some activity, 10 client connections distributed randomly amongst brokers, each doing a method call, a web request and event emit every 100ms:
node test/stress/brokering/activity.js --clients 1 --ports 7001,7002 --interval 100