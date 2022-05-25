# start 2 brokers
# export the following to populate log files:
# in a separate console:
export LOG_FILE=[your projects folder]/happner-suite/packages/happner-cluster/test/stress/logs/logs-1.log
export LOG_RAW_TO_FILE=1
node test/stress/brokering/broker --seq 1

# in a separate console:
export LOG_FILE=[your projects folder]/happner-suite/packages/happner-cluster/test/stress/logs/logs-2.log
export LOG_RAW_TO_FILE=1
node test/stress/brokering/broker --seq 2

# start some brokered to by the above components
# in a separate console:
export LOG_FILE=[your projects folder]/happner-suite/packages/happner-cluster/test/stress/logs/logs-3.log
export LOG_RAW_TO_FILE=1
node test/stress/brokering/instance-1.js --seq 3

# in a separate console:
export LOG_FILE=[your projects folder]/happner-suite/packages/happner-cluster/test/stress/logs/logs-4.log
export LOG_RAW_TO_FILE=1
node test/stress/brokering/instance-1.js --seq 4

# start some activity, 10 client connections distributed randomly amongst brokers, each doing a method call, a web request and event emit every 100ms:
node test/stress/brokering/activity.js --clients 1 --ports 7001,7002 --interval 100